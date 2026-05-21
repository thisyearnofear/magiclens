// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @notice Simple ERC-20 that mimics USDT (6 decimals) for demo / testing.
 *         Owner can mint arbitrary amounts.
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;

    constructor() ERC20("Mock USDT", "USDT") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
