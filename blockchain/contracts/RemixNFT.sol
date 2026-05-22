// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RemixNFT
 * @notice ERC-721 for user-minted AR remixes of sports moments on X Layer.
 *
 * Design philosophy: ANYONE can mint. Pack ownership is a boost, not a gate.
 * - No pack required to mint (removes onboarding friction)
 * - Pack holders get a "verified" flag and leaderboard multiplier
 * - Simplified mint params (metadata lives off-chain via URI)
 * - Daily cycle tracking built in (day number emitted with each mint)
 * - Optional referrer for viral growth loops
 */
contract RemixNFT is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {

    // ── Events ────────────────────────────────────────────
    event RemixMinted(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 indexed day,
        string overlayIds,
        bool hasPackBoost,
        address referrer
    );
    event RemixFeatured(uint256 indexed tokenId, uint256 indexed day);
    event DayAdvanced(uint256 indexed newDay);

    // ── State ─────────────────────────────────────────────
    address public worldCupPackAddress;
    uint256 public totalSupply;
    uint256 public currentDay;

    struct RemixData {
        address creator;
        uint256 day;
        string overlayIds;
        bool hasPackBoost;
        address referrer;
        uint256 featuredDay;
    }

    mapping(uint256 => RemixData) public remixes;
    mapping(address => uint256) public mintCount;
    mapping(address => uint256) public referralCount;

    // ── Constructor ───────────────────────────────────────
    constructor(
        address initialOwner,
        address _worldCupPackAddress,
        uint96 _royaltyBps
    ) ERC721("MagicLens Remix", "REMIX") Ownable(initialOwner) {
        worldCupPackAddress = _worldCupPackAddress;
        currentDay = 1;
        _setDefaultRoyalty(initialOwner, _royaltyBps);
    }

    // ── Configuration ─────────────────────────────────────
    function setWorldCupPackAddress(address _addr) external onlyOwner {
        worldCupPackAddress = _addr;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function advanceDay() external onlyOwner {
        currentDay++;
        emit DayAdvanced(currentDay);
    }

    // ── Minting ───────────────────────────────────────────
    /**
     * @notice Mint a remix NFT. Free, open to everyone.
     * @param uri         Metadata URI (contains video CID, thumbnail, matchId off-chain)
     * @param overlayIds  Comma-separated overlay IDs used (e.g. "flag-halos,trophy-confetti")
     * @param packTokenIds  Optional: WorldCupPack token IDs owned (for boost verification)
     * @param referrer    Optional: address that referred this minter (address(0) if none)
     */
    function mint(
        string calldata uri,
        string calldata overlayIds,
        uint256[] calldata packTokenIds,
        address referrer
    ) external nonReentrant returns (uint256 tokenId) {
        // Determine pack boost
        bool hasBoost = _checkPackOwnership(msg.sender, packTokenIds);

        tokenId = totalSupply;
        totalSupply++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        remixes[tokenId] = RemixData({
            creator: msg.sender,
            day: currentDay,
            overlayIds: overlayIds,
            hasPackBoost: hasBoost,
            referrer: referrer,
            featuredDay: 0
        });

        mintCount[msg.sender]++;

        if (referrer != address(0) && referrer != msg.sender) {
            referralCount[referrer]++;
        }

        emit RemixMinted(tokenId, msg.sender, currentDay, overlayIds, hasBoost, referrer);
    }

    // ── Pack Boost Check ──────────────────────────────────
    function _checkPackOwnership(address user, uint256[] calldata packTokenIds) internal view returns (bool) {
        if (worldCupPackAddress == address(0) || packTokenIds.length == 0) {
            return false;
        }
        for (uint256 i = 0; i < packTokenIds.length; i++) {
            if (IERC1155(worldCupPackAddress).balanceOf(user, packTokenIds[i]) > 0) {
                return true;
            }
        }
        return false;
    }

    // ── Leaderboard / Features ────────────────────────────
    function featureRemix(uint256 tokenId, uint256 day) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        remixes[tokenId].featuredDay = day;
        emit RemixFeatured(tokenId, day);
    }

    // ── EIP-165 + EIP-2981 ────────────────────────────────
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function contractURI() public pure returns (string memory) {
        return "https://api.magiclens.app/metadata/RemixNFT/contract.json";
    }
}
