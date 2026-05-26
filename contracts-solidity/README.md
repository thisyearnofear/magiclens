# MagicLens EVM Contracts (X Layer / OKX Hackathon)

Three Solidity smart contracts deployed on **X Layer** (chain ID 1952 testnet / 196 mainnet) for the OKX X Cup hackathon.

## Contracts

| Contract | Standard | Purpose |
|---|---|---|
| `WorldCupPack.sol` | ERC-1155 | Curated AR overlay packs themed around the FIFA World Cup. Each pack type is a themed collection (flag halos, GOAL! lower-thirds, trophy confetti, etc.). |
| `RemixNFT.sol` | ERC-721 + ERC-2981 | User-minted remix NFTs representing fan AR edits of match moments, referencing specific WorldCupPack items. EIP-2981 royalty support (2.5% default). |
| `FanCastRewards.sol` | — | Daily leaderboard and USDT reward distribution to the top-N remixers. Emits `TopThreeSelected` events for cross-VM Flow Forte relay. |
| `MockUSDT.sol` | ERC-20 | Hackathon demo token (6 decimals, mintable by owner). Replace with canonical USDT for production. |

## Architecture

```
User creates remix in AR editor
        │
        ▼
Uses WorldCupPack items (ERC-1155 balance check enforced)
        │
        ▼
Mints RemixNFT (ERC-721) with match metadata + royalty support
        │
        ▼
Remix appears on daily leaderboard
        │
        ▼
FanCastRewards distributes USDT to top 10
        │
        ▼
Top 3 → cross-VM event → Flow "Iconic Moment" NFT (via ForteAutomation)
```

## Setup

```bash
cd blockchain
cp .env.example .env
# Edit .env: set XLAYER_DEPLOYER_PRIVATE_KEY

npm install
npm run compile
npm run test
npm run deploy:xlayer-testnet
```

## X Layer Network Info

| Property | Testnet | Mainnet |
|---|---|---|
| Chain ID | **1952** (0x7A0) | 196 |
| RPC | `https://testrpc.xlayer.tech/terigon` | `https://rpc.xlayer.tech` |
| Explorer | https://www.oklink.com/xlayer-testnet | https://www.oklink.com/xlayer |
| Currency | OKB (testnet via faucet) | OKB |

Note: X Layer is a Polygon CDK zkEVM chain, not an OP Stack fork. The RPC endpoint uses the `/terigon` suffix for Polygon zkEVM compatibility.

## Deployed Addresses (X Layer Testnet)

| Contract | Address | Explorer |
|---|---|---|
| WorldCupPack | `0x1db0C06578Ad9f7efEc65fb4363495d6E82980A7` | [OKLink](https://www.oklink.com/xlayer-testnet/address/0x1db0C06578Ad9f7efEc65fb4363495d6E82980A7) |
| RemixNFT | `0x7e33f6b572A37792dAEacd902060528070b378D3` | [OKLink](https://www.oklink.com/xlayer-testnet/address/0x7e33f6b572A37792dAEacd902060528070b378D3) |
| FanCastRewards | `0xeDCDc2d8aEE4cF9Df025495cf8c39c93E7CBEb8c` | [OKLink](https://www.oklink.com/xlayer-testnet/address/0xeDCDc2d8aEE4cF9Df025495cf8c39c93E7CBEb8c) |
| MockUSDT | `0x117cA0AFaE17F5bE8142EEeACFDB89B148154a2D` | [OKLink](https://www.oklink.com/xlayer-testnet/address/0x117cA0AFaE17F5bE8142EEeACFDB89B148154a2D) |

Rewards pool: **1,000 MockUSDT** deposited (Day 1, ready for distribution).

Set these in `app/.env` as:

```env
VITE_WORLDCUP_PACK_ADDRESS=0x1db0C06578Ad9f7efEc65fb4363495d6E82980A7
VITE_REMIX_NFT_ADDRESS=0x7e33f6b572A37792dAEacd902060528070b378D3
VITE_FAN_CAST_REWARDS_ADDRESS=0xeDCDc2d8aEE4cF9Df025495cf8c39c93E7CBEb8c
```

## Testing

```bash
cd blockchain
npx hardhat test
```

Tests cover:
- **WorldCupPack**: pack type creation, max supply enforcement, invalid type reverts
- **RemixNFT**: pack ownership verification before minting, EIP-2981 royalty support
- **FanCastRewards**: USDT distribution with proper split amounts, `TopThreeSelected` event emission

## Cross-VM Integration

`FanCastRewards` emits `TopThreeSelected(day, remixTokenIds, winners)` events on-chain. An off-chain relayer (the MagicLens backend) watches for this event and triggers the Flow ForteAutomation workflow to mint premium "Iconic Moment" NFTs on Flow Cadence.
