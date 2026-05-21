// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title WorldCupPack
 * @notice ERC-1155 contract for curated AR overlay packs themed around the FIFA World Cup.
 *
 * Each pack type represents a themed overlay collection (e.g. "2026 Flag Halos",
 * "Goal! Lower-Thirds", "Trophy Confetti", "Ref-Card Overlays").
 *
 * Packs are minted by the MagicLens protocol (owner) and claimed by users when
 * they create a remix. This keeps the supply limited and curated.
 */
contract WorldCupPack is ERC1155, Ownable, ERC1155Supply {
    using Strings for uint256;

    // ── Events ────────────────────────────────────────────
    event PackTypeCreated(uint256 indexed packTypeId, string name, uint256 maxSupply);
    event PackClaimed(uint256 indexed packTypeId, address indexed claimer, uint256 amount);
    event PackURIUpdated(uint256 indexed packTypeId, string uri);

    // ── State ─────────────────────────────────────────────
    uint256 public nextPackTypeId;

    struct PackType {
        string name;        // Human-readable name (e.g. "2026 Flag Halos")
        uint256 maxSupply;  // Max mintable across all users (0 = unlimited)
        uint256 minted;     // Total minted so far
        bool exists;
    }

    mapping(uint256 => PackType) public packTypes;
    mapping(uint256 => string) private _customUris;

    // ── Constructor ───────────────────────────────────────
    constructor(address initialOwner)
        ERC1155("https://api.magiclens.app/metadata/WorldCupPack/{id}.json")
        Ownable(initialOwner)
    {}

    // ── Admin: Manage Pack Types ──────────────────────────
    /**
     * @notice Create a new AR overlay pack type.
     * @param name  Human-readable name (e.g. "Country Flag Halos")
     * @param maxSupply  Maximum supply (0 = unlimited)
     * @param uriSuffix  Optional custom URI suffix (e.g. "flag-halos")
     */
    function createPackType(
        string calldata name,
        uint256 maxSupply,
        string calldata uriSuffix
    ) external onlyOwner returns (uint256 packTypeId) {
        return _createPackType(name, maxSupply, uriSuffix);
    }

    /**
     * @notice Internal helper to create pack types (used by both external and batch).
     */
    function _createPackType(
        string memory name,
        uint256 maxSupply,
        string memory uriSuffix
    ) internal returns (uint256 packTypeId) {
        packTypeId = nextPackTypeId++;
        packTypes[packTypeId] = PackType({
            name: name,
            maxSupply: maxSupply,
            minted: 0,
            exists: true
        });

        if (bytes(uriSuffix).length > 0) {
            _customUris[packTypeId] = string.concat(
                "https://api.magiclens.app/metadata/WorldCupPack/", uriSuffix, ".json"
            );
        }

        emit PackTypeCreated(packTypeId, name, maxSupply);
    }

    /**
     * @notice Batch-create starter pack types.
     */
    function createStarterPacks() external onlyOwner {
        _createPackType("2026 Flag Halos - All 32 Nations",   32,   "flag-halos");
        _createPackType("GOAL! Lower-Thirds",                 10,   "goal-lower-thirds");
        _createPackType("Trophy Confetti Burst",              5,    "trophy-confetti");
        _createPackType("Ref-Card Overlays",                  8,    "ref-cards");
        _createPackType("Stadium Atmosphere Sparkles",        15,   "stadium-sparkles");
        _createPackType("Commentary Bubble Styles",           10,   "commentary-bubbles");
    }

    // ── User: Claim Packs ─────────────────────────────────
    /**
     * @notice Claim one or more packs of a given type. Users must have
     *         enough allowance (packs are free during hackathon; gating
     *         can be added later via a Merkle tree or token-gate).
     */
    function claimPack(uint256 packTypeId, uint256 amount) external {
        PackType storage pt = packTypes[packTypeId];
        require(pt.exists, "Pack type does not exist");
        require(amount > 0, "Amount must be > 0");

        if (pt.maxSupply > 0) {
            require(pt.minted + amount <= pt.maxSupply, "Exceeds max supply");
        }

        pt.minted += amount;
        _mint(msg.sender, packTypeId, amount, "");

        emit PackClaimed(packTypeId, msg.sender, amount);
    }

    // ── Metadata ──────────────────────────────────────────
    function uri(uint256 packTypeId) public view override returns (string memory) {
        if (bytes(_customUris[packTypeId]).length > 0) {
            return _customUris[packTypeId];
        }
        return super.uri(packTypeId);
    }

    function setPackURI(uint256 packTypeId, string calldata newUri) external onlyOwner {
        _customUris[packTypeId] = newUri;
        emit PackURIUpdated(packTypeId, newUri);
    }

    function contractURI() public pure returns (string memory) {
        return "https://api.magiclens.app/metadata/WorldCupPack/contract.json";
    }

    // ── Overrides ─────────────────────────────────────────
    function _update(
        address from, address to, uint256[] memory ids, uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
