// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RemixNFT
 * @notice ERC-721 contract for user-minted AR remixes of sports moments.
 *
 * Each remix NFT represents a fan's creation: a video clip overlaid with
 * AR effects from WorldCupPack, timestamped to a specific match moment.
 *
 * Minting flow:
 *   1. User creates a remix in the MagicLens editor
 *   2. User selects which WorldCupPack items to include (packTokenIds[])
 *   3. Contract verifies user owns those pack items (balance check)
 *   4. RemixNFT is minted to the user
 *   5. Remix appears on the daily leaderboard
 */
contract RemixNFT is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // ── Events ────────────────────────────────────────────
    event RemixMinted(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 indexed matchTimestamp,
        string matchId,
        uint256[] packTokenIds
    );
    event RemixFeatured(uint256 indexed tokenId, uint256 indexed day);

    // ── Constants ─────────────────────────────────────────
    /// @notice Reference to the WorldCupPack contract (set after deployment)
    address public worldCupPackAddress;

    // ── State ─────────────────────────────────────────────
    uint256 public totalSupply;
    uint256 public mintFee;              // Fee in wei (0 during hackathon)

    // tokenId => metadata
    mapping(uint256 => RemixData) public remixes;

    struct RemixData {
        address creator;
        uint256 matchTimestamp;   // Unix timestamp of the match moment
        string matchId;           // e.g. "WC2026_GROUP_A_BRA_VS_ARG"
        string videoCid;          // IPFS / Arweave CID of the remix video
        string thumbnailCid;      // IPFS / Arweave CID of the thumbnail
        uint256[] packTokenIds;   // WorldCupPack token IDs used in this remix
        uint256 totalVotes;       // Total votes on leaderboard
        uint256 featuredDay;      // Day number if featured (0 = not featured)
    }

    // ── Constructor ───────────────────────────────────────
    constructor(
        address initialOwner,
        address _worldCupPackAddress,
        uint256 _mintFee,
        uint96 _royaltyBps
    ) ERC721("MagicLens Remix", "REMIX") Ownable(initialOwner) {
        worldCupPackAddress = _worldCupPackAddress;
        mintFee = _mintFee;
        _setDefaultRoyalty(initialOwner, _royaltyBps);
    }

    // ── Configuration ─────────────────────────────────────
    function setWorldCupPackAddress(address _addr) external onlyOwner {
        worldCupPackAddress = _addr;
    }

    function setMintFee(uint256 _fee) external onlyOwner {
        mintFee = _fee;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
    }

    // ── Minting ───────────────────────────────────────────
    /**
     * @notice Mint a new RemixNFT. Creator must own the referenced WorldCupPack items.
     * @param matchTimestamp  Unix timestamp of the match moment being remixed
     * @param matchId         Identifier for the match (e.g. "WC2026_FINAL")
     * @param videoCid        Content hash / CID of the remix video
     * @param thumbnailCid    Content hash / CID of the thumbnail
     * @param packTokenIds    WorldCupPack token IDs used (must be owned by sender)
     * @param uri             Metadata URI for this specific token
     */
    function mintRemix(
        uint256 matchTimestamp,
        string calldata matchId,
        string calldata videoCid,
        string calldata thumbnailCid,
        uint256[] calldata packTokenIds,
        string calldata uri
    ) external payable nonReentrant returns (uint256 tokenId) {
        // Fee check (free during hackathon; enforced post-launch)
        if (mintFee > 0) {
            require(msg.value >= mintFee, "Insufficient mint fee");
        }

        // Verify pack ownership via IERC1155 balance check
        if (worldCupPackAddress != address(0) && packTokenIds.length > 0) {
            for (uint256 i = 0; i < packTokenIds.length; i++) {
                require(
                    IERC1155(worldCupPackAddress).balanceOf(msg.sender, packTokenIds[i]) > 0,
                    "Sender does not own referenced pack item"
                );
            }
        }

        tokenId = totalSupply;
        totalSupply++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        remixes[tokenId] = RemixData({
            creator: msg.sender,
            matchTimestamp: matchTimestamp,
            matchId: matchId,
            videoCid: videoCid,
            thumbnailCid: thumbnailCid,
            packTokenIds: packTokenIds,
            totalVotes: 0,
            featuredDay: 0
        });

        emit RemixMinted(tokenId, msg.sender, matchTimestamp, matchId, packTokenIds);
    }

    // ── Leaderboard / Features ────────────────────────────
    /**
     * @notice Mark a remix as featured (called by FanCastRewards or owner).
     * @param tokenId  The remix NFT token ID
     * @param day      The day number the remix was featured
     */
    function featureRemix(uint256 tokenId, uint256 day) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        remixes[tokenId].featuredDay = day;
        emit RemixFeatured(tokenId, day);
    }

    // ── EIP-2981 Royalties (via OpenZeppelin ERC2981 mixin) ─
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ── Metadata helpers ─────────────────────────────────
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function contractURI() public pure returns (string memory) {
        return "https://api.magiclens.app/metadata/RemixNFT/contract.json";
    }
}
