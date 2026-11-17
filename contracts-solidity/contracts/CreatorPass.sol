// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreatorPass
 * @notice Paid pass that unlocks Pro export features in MagicLens.
 *         Holding token id 1 = Pro entitlement — the on-chain key the
 *         frontend reads before unlocking watermark-free, longer exports.
 *
 * Deliberately sport-agnostic and pack-independent: the pass travels with
 * the creator across every overlay pack and sport we add later.
 */
contract CreatorPass is ERC1155, Ownable, ReentrancyGuard {
    uint256 public constant PASS_ID = 1;

    uint256 public price;
    uint256 public maxSupply; // 0 = unlimited
    uint256 public minted;

    event PassMinted(address indexed to, uint256 paid);
    event PriceUpdated(uint256 newPrice);

    constructor(
        address initialOwner,
        uint256 initialPrice,
        uint256 _maxSupply,
        string memory baseUri
    ) ERC1155(baseUri) Ownable(initialOwner) {
        price = initialPrice;
        maxSupply = _maxSupply;
    }

    function mint() external payable nonReentrant {
        require(msg.value >= price, "Insufficient payment");
        if (maxSupply > 0) require(minted + 1 <= maxSupply, "Sold out");
        minted++;
        _mint(msg.sender, PASS_ID, 1, "");
        emit PassMinted(msg.sender, msg.value);
        if (msg.value > price) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refunded, "Refund failed");
        }
    }

    /// @notice The single read the frontend needs.
    function isPro(address account) external view returns (bool) {
        return balanceOf(account, PASS_ID) > 0;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
        emit PriceUpdated(newPrice);
    }

    function setMaxSupply(uint256 supply_) external onlyOwner {
        maxSupply = supply_;
    }

    function setURI(string memory newUri) external onlyOwner {
        _setURI(newUri);
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    receive() external payable {}
}
