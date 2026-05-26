# MagicLens — Cadence Smart Contracts (Flow)

Cadence 1.0 smart contracts for MagicLens deployed on Flow testnet.

## Contracts

| Contract | Address | Description |
|---|---|---|
| **ARAssetAssetNFT** | `0x4520a5a7b69ee3ac` | Core NFT contract for AR overlay assets. Implements NonFungibleToken, MetadataViews, ViewResolver. Stores AR overlay metadata (name, description, creator). |
| **CollaborationHub** | `0x4520a5a7b69ee3ac` | Multi-party collaboration with revenue sharing, role-based access control, contribution tracking, and project lifecycle management. |
| **ForteAutomation** | `0x4520a5a7b69ee3ac` | Automated workflows engine for scheduled publishing, royalty distribution, and collaboration notifications. |

## Networks

| Network | Access Node |
|---|---|
| **testnet** | `access.devnet.nodes.onflow.org:9000` |
| **mainnet** | `access.mainnet.nodes.onflow.org:9000` |

## Standard Contract Addresses (testnet)

| Contract | Address |
|---|---|
| NonFungibleToken | `0x631e88ae7f1d7c20` |
| MetadataViews | `0x631e88ae7f1d7c20` |
| ViewResolver | `0x631e88ae7f1d7c20` |
| FungibleToken | `0x9a0766d93b6608b7` |
| FlowToken | `0x7e60df042a9c0868` |

## Deploy

```bash
flow project deploy --network testnet
```

## Scripts

- `cadence/scripts/CheckTotalSupply.cdc` — read `ARAssetNFT.totalSupply`

## Account

- **Address**: `0x4520a5a7b69ee3ac`
- **Funded**: 100,000 test FLOW via faucet
