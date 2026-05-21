// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FanCastRewards
 * @notice Daily leaderboard + reward distribution for MagicLens remixers.
 *
 * Each day, the top-N remixes (by votes / curated picks) receive USDT rewards.
 * Rewards can be funded by:
 *   - Platform revenue share
 *   - Sponsor contributions (brands, broadcasters)
 *   - Community reward pools
 *
 * Cross-VM integration: On Flow, top-3 daily remixes are auto-minted as
 * premium "Iconic Moment" NFTs via ForteAutomation. This contract emits
 * events that the Flow off-chain relayer picks up.
 *
 * Token flow:
 *   Treasury (USDT) ──► FanCastRewards ──► Top remixers (USDT)
 *   Leaderboard votes ──► FanCastRewards (emits events for Flow relayer)
 */
contract FanCastRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Events ────────────────────────────────────────────
    event DailyCycleStarted(uint256 indexed day, uint256 rewardPool);
    event RewardDistributed(
        uint256 indexed day,
        uint256 indexed rank,
        address indexed winner,
        uint256 remixTokenId,
        uint256 amount
    );
    event TopThreeSelected(
        uint256 indexed day,
        uint256[3] remixTokenIds,
        address[3] winners
    );
    event TreasuryDeposited(address indexed funder, uint256 amount);
    event TreasuryWithdrawn(address indexed to, uint256 amount);
    event RewardTokenUpdated(address indexed oldToken, address indexed newToken);

    // ── Constants ─────────────────────────────────────────
    uint256 public constant MAX_WINNERS_PER_DAY = 10;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ── State ─────────────────────────────────────────────
    /// @notice The reward token (USDT on X Layer)
    IERC20 public rewardToken;

    /// @notice Reference to the RemixNFT contract
    address public remixNFTAddress;

    /// @notice Current daily cycle
    uint256 public currentDay;

    /// @notice Whether rewards are paused
    bool public paused;

    /// @notice Reward pool for the current day
    uint256 public currentDayRewardPool;

    /// @notice Reward shares by rank (basis points of pool)
    /// rank 0 (1st) = 3000 bps = 30%, rank 1 (2nd) = 2000 bps = 20%, etc.
    uint256[10] public rankShares = [
        3000, // 1st: 30%
        2000, // 2nd: 20%
        1200, // 3rd: 12%
        800,  // 4th: 8%
        700,  // 5th: 7%
        600,  // 6th: 6%
        500,  // 7th: 5%
        500,  // 8th: 5%
        350,  // 9th: 3.5%
        350   // 10th: 3.5%
    ];

    struct DailyResult {
        uint256 day;
        uint256 rewardPool;
        uint256[] remixTokenIds;
        address[] winners;
        uint256[] amounts;
        bool distributed;
    }

    /// @notice day => DailyResult (only stored for days with distributions)
    mapping(uint256 => DailyResult) public dailyResults;

    /// @notice user => total rewards earned all-time
    mapping(address => uint256) public totalEarned;

    // ── Constructor ───────────────────────────────────────
    constructor(
        address initialOwner,
        address _rewardToken,
        address _remixNFTAddress
    ) Ownable(initialOwner) {
        rewardToken = IERC20(_rewardToken);
        remixNFTAddress = _remixNFTAddress;
        currentDay = 1;
    }

    // ── Modifiers ─────────────────────────────────────────
    modifier whenNotPaused() {
        require(!paused, "Rewards are paused");
        _;
    }

    // ── Admin: Configuration ──────────────────────────────
    function setRewardToken(address _token) external onlyOwner {
        emit RewardTokenUpdated(address(rewardToken), _token);
        rewardToken = IERC20(_token);
    }

    function setRemixNFTAddress(address _addr) external onlyOwner {
        remixNFTAddress = _addr;
    }

    function setRankShares(uint256[10] calldata _shares) external onlyOwner {
        uint256 totalBps;
        for (uint256 i = 0; i < 10; i++) {
            require(_shares[i] <= 5000, "Single share cannot exceed 50%");
            totalBps += _shares[i];
        }
        require(totalBps == BPS_DENOMINATOR, "Shares must sum to 100%");
        rankShares = _shares;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    // ── Treasury ──────────────────────────────────────────
    /**
     * @notice Deposit USDT into the treasury. Deposits are added to the
     *         current day's reward pool.
     */
    function depositTreasury(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        currentDayRewardPool += amount;
        emit TreasuryDeposited(msg.sender, amount);
    }

    /**
     * @notice Owner can withdraw excess funds from treasury.
     */
    function withdrawTreasury(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        rewardToken.safeTransfer(to, amount);
        emit TreasuryWithdrawn(to, amount);
    }

    // ── Daily Cycle ───────────────────────────────────────
    /**
     * @notice Start a new daily cycle. Moves current unspent pool forward
     *         or resets it. Called by a cron job or admin at day boundary.
     */
    function startNewDay() external onlyOwner whenNotPaused {
        currentDay++;
        currentDayRewardPool = 0; // Reset; sponsor needs to re-deposit
        emit DailyCycleStarted(currentDay, 0);
    }

    // ── Reward Distribution ───────────────────────────────
    /**
     * @notice Distribute rewards for the current day to the top-N remixers.
     *         Called by the off-chain leaderboard service (or owner during hackathon).
     *
     * @param remixTokenIds  Array of RemixNFT token IDs, ordered 1st to Nth.
     * @param winners        Corresponding winner addresses.
     */
    function distributeRewards(
        uint256[] calldata remixTokenIds,
        address[] calldata winners
    ) external onlyOwner whenNotPaused nonReentrant {
        require(remixTokenIds.length == winners.length, "Array length mismatch");
        require(remixTokenIds.length > 0, "At least one winner");
        require(remixTokenIds.length <= MAX_WINNERS_PER_DAY, "Too many winners");
        require(!dailyResults[currentDay].distributed, "Already distributed today");

        uint256 pool = currentDayRewardPool;
        require(pool > 0, "No rewards in pool");

        uint256[] memory amounts = new uint256[](winners.length);
        uint256 totalDistributed;

        for (uint256 i = 0; i < winners.length; i++) {
            uint256 share = (pool * rankShares[i]) / BPS_DENOMINATOR;
            amounts[i] = share;
            totalDistributed += share;

            // Transfer USDT to winner
            rewardToken.safeTransfer(winners[i], share);

            // Track totals
            totalEarned[winners[i]] += share;
        }

        // Store result
        dailyResults[currentDay] = DailyResult({
            day: currentDay,
            rewardPool: pool,
            remixTokenIds: remixTokenIds,
            winners: winners,
            amounts: amounts,
            distributed: true
        });

        // Reset pool (dust remains)
        currentDayRewardPool = 0;

        // Emit cross-VM event for Flow relayer (top 3)
        if (winners.length >= 3) {
            uint256[3] memory topTokenIds = [
                remixTokenIds[0],
                remixTokenIds[1],
                remixTokenIds[2]
            ];
            address[3] memory topWinners = [
                winners[0],
                winners[1],
                winners[2]
            ];
            emit TopThreeSelected(currentDay, topTokenIds, topWinners);
        }
    }

    // ── Getters ───────────────────────────────────────────
    /**
     * @notice Get the current day's pending reward amount for a given rank.
     */
    function pendingReward(uint256 rank) external view returns (uint256) {
        require(rank < MAX_WINNERS_PER_DAY, "Invalid rank");
        return (currentDayRewardPool * rankShares[rank]) / BPS_DENOMINATOR;
    }

    /**
     * @notice Get leaderboard results for a specific day.
     */
    function getDailyResult(uint256 day) external view returns (DailyResult memory) {
        return dailyResults[day];
    }
}
