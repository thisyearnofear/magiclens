// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title WorldCupPack
 * @notice ERC-1155 for curated AR overlay packs themed around the FIFA World Cup.
 *
 * Design: Free starter pack for every new address. Additional packs can be
 * claimed openly (supply-capped) or purchased in later phases.
 *
 * Having a pack gives RemixNFT minters a "verified" boost on the leaderboard
 * but is NOT required to mint remixes.
 */
contract WorldCupPack is ERC1155, Ownable, ERC1155Supply {
    using Strings for uint256;

    // ── Events ────────────────────────────────────────────
    event PackTypeCreated(uint256 indexed packTypeId, string name, uint256 maxSupply);
    event PackClaimed(uint256 indexed packTypeId, address indexed claimer, uint256 amount);
    event StarterPackClaimed(address indexed claimer);
    event PackURIUpdated(uint256 indexed packTypeId, string uri);

    // ── State ─────────────────────────────────────────────
    uint256 public nextPackTypeId;

    struct PackType {
        string name;
        uint256 maxSupply;  // 0 = unlimited
        uint256 minted;
        bool exists;
    }

    mapping(uint256 => PackType) public packTypes;
    mapping(uint256 => string) private _customUris;
    mapping(address => bool) public hasClaimedStarter;

    // ── Constructor ───────────────────────────────────────
    constructor(address initialOwner)
        ERC1155("https://api.magiclens.app/metadata/WorldCupPack/{id}.json")
        Ownable(initialOwner)
    {}

    // ── Admin: Manage Pack Types ──────────────────────────
    function createPackType(
        string calldata name,
        uint256 maxSupply,
        string calldata uriSuffix
    ) external onlyOwner returns (uint256 packTypeId) {
        return _createPackType(name, maxSupply, uriSuffix);
    }

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

    function createStarterPacks() external onlyOwner {
        _createPackType("2026 Flag Halos - All 32 Nations", 0, "flag-halos");
        _createPackType("GOAL! Lower-Thirds", 0, "goal-lower-thirds");
        _createPackType("Trophy Confetti Burst", 0, "trophy-confetti");
        _createPackType("Ref-Card Overlays", 0, "ref-cards");
        _createPackType("Stadium Atmosphere Sparkles", 0, "stadium-sparkles");
        _createPackType("Commentary Bubble Styles", 0, "commentary-bubbles");
    }

    // ── User: Free Starter Pack ───────────────────────────
    /**
     * @notice Claim a free starter pack (one per address). Gives one of each
     *         pack type so the user can immediately remix with boosted status.
     */
    function claimStarterPack() external {
        require(!hasClaimedStarter[msg.sender], "Starter pack already claimed");
        require(nextPackTypeId > 0, "No pack types created yet");

        hasClaimedStarter[msg.sender] = true;

        uint256 count = nextPackTypeId;
        uint256[] memory ids = new uint256[](count);
        uint256[] memory amounts = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            ids[i] = i;
            amounts[i] = 1;
            packTypes[i].minted++;
        }

        _mintBatch(msg.sender, ids, amounts, "");
        emit StarterPackClaimed(msg.sender);
    }

    // ── User: Claim Individual Packs ──────────────────────
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
