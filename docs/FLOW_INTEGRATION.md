# Flow Blockchain Integration

## Overview

MagicLens integrates with Flow blockchain to enable:
- **NFT-based AR Assets**: Mint AR overlays as tradeable NFTs
- **Forte Workflows**: Automate content publishing and royalty distribution
- **Decentralized Collaboration**: Smart contract-based team projects with revenue sharing
- **On-chain Authentication**: Secure wallet-based user authentication

## Architecture

### Smart Contracts (Cadence)
```
contracts/
├── ARAssetNFT.cdc          # Main NFT contract for AR overlays
├── CollaborationHub.cdc    # Multi-party collaboration contracts
├── ForteAutomation.cdc     # Actions & Workflows integration
```

### Frontend Integration
```typescript
app/src/lib/flow/
├── config.ts              # Network and contract configuration
├── fcl-config.ts          # FCL (Flow Client Library) setup
├── transactions/          # Cadence transaction templates
├── scripts/               # Cadence read-only queries
├── hooks/                 # React hooks for Flow features
└── components/            # UI components for Flow features
```

### Backend Integration
```python
services/core/flow/
├── flow_client.py         # Flow blockchain client
├── nft_service.py         # NFT minting & management
├── workflow_service.py    # Forte Actions/Workflows
├── marketplace_service.py # Trading & licensing
└── event_listener.py      # Listen to blockchain events
```

## Features Implemented

### ✅ Wallet Connection
- Flow wallet integration via FCL
- Support for Flow Wallet, Blocto, Lilico
- Automatic session management
- User-friendly connection UI

### ✅ NFT Management
- Mint AR assets as NFTs
- View NFT collection with metadata
- Track usage statistics
- Ownership verification

### ✅ Forte Workflows
- Create scheduled publishing workflows
- Automate royalty distribution
- Event-based triggers
- Workflow execution tracking

### ✅ Smart Contracts
- **ARAssetNFT**: NFT contract with metadata, royalties, licensing
- **CollaborationHub**: Multi-party project management with revenue sharing
- **ForteAutomation**: Workflow automation with triggers and actions

## Contract Details

### ARAssetNFT Contract

**Features:**
- NFT standard compliance (NonFungibleToken, MetadataViews)
- Rich metadata: name, description, category, file URLs, dimensions
- Royalty support with creator earnings
- License types: personal, commercial, exclusive
- Usage tracking and analytics

**Categories:**
- 0: Creatures, 1: Effects, 2: Objects, 3: Text, 4: Decorations

**License Types:**
- 0: Personal (free for personal use)
- 1: Commercial (requires payment)
- 2: Exclusive (one-time license)

### ForteAutomation Contract

**Workflow Types:**
- 0: Scheduled Publishing
- 1: Royalty Distribution
- 2: Collaboration Notification
- 3: Content Moderation

**Trigger Types:**
- 0: Time-Based, 1: Event-Based, 2: Condition-Based

**Action Types:**
- 0: Mint AR Asset, 1: Apply Overlay, 2: Share Revenue
- 3: License Asset, 4: Notify Collaborators, 5: Publish Content

### CollaborationHub Contract

**Features:**
- Multi-party project management
- Role-based access control (Owner, Editor, Contributor, Viewer)
- Revenue sharing with percentage-based distribution
- Contribution tracking
- Project lifecycle management

## Usage Examples

### Connect Wallet
```typescript
import { useFlowAuth } from '@/hooks/use-flow-auth';

function MyComponent() {
  const { connectWallet, walletAddress, isLoggedIn } = useFlowAuth();

  return (
    <button onClick={connectWallet}>
      {isLoggedIn ? walletAddress : 'Connect Wallet'}
    </button>
  );
}
```

### Mint AR Asset NFT
```typescript
import { useFlowNFTs } from '@/hooks/use-flow-nfts';

function MintAsset() {
  const { mintAsset } = useFlowNFTs(walletAddress);

  const handleMint = async () => {
    await mintAsset({
      name: "Cool AR Effect",
      description: "An awesome AR overlay",
      category: 1, // Effects
      assetType: "gif",
      fileURL: "https://...",
      thumbnailURL: "https://...",
      fileSize: 1024000,
      width: 512,
      height: 512,
      tags: ["effect", "particles"],
      licenseType: 0, // Personal
      royaltyPercentage: 5.0
    });
  };

  return <button onClick={handleMint}>Mint NFT</button>;
}
```

### Create Workflow
```typescript
import { useFlowWorkflows } from '@/hooks/use-flow-workflows';

function CreateWorkflow() {
  const { createScheduledPublishing } = useFlowWorkflows(walletAddress);

  const handleCreate = async () => {
    const publishDate = new Date('2025-12-31T12:00:00');
    await createScheduledPublishing('content-123', publishDate);
  };

  return <button onClick={handleCreate}>Schedule Publishing</button>;
}
```

## Deployment

### Prerequisites
1. Install Flow CLI: `sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"`
2. Create Flow testnet account at https://testnet-faucet.onflow.org/
3. Save private key securely

### Deploy to Testnet
1. Update `flow.json` with your testnet account
2. Deploy: `flow project deploy --network testnet`
3. Update contract addresses in `app/src/lib/flow/config.ts`
4. Set `VITE_FLOW_NETWORK=testnet` in `.env`

### Testing
```bash
# Local testing with emulator
flow emulator start
flow project deploy --network emulator

# Test transactions
flow transactions send ./transactions/mint-asset.cdc --network emulator

# Test scripts
flow scripts execute ./scripts/get-user-nfts.cdc YOUR_ADDRESS --network emulator
```

## Integration with Existing Features

### Asset Upload → NFT Minting
When users upload AR assets, they can optionally mint them as NFTs:

```typescript
// In AssetUpload component
const handleUploadAndMint = async (file) => {
  const uploadedAsset = await uploadAsset(file);
  await mintAsset({
    name: uploadedAsset.name,
    fileURL: uploadedAsset.url,
    // ... other params
  });
};
```

### Collaboration → Smart Contracts
Collaboration projects can be backed by smart contracts:

```typescript
// In CollaborationWorkspace
const createBlockchainProject = async (projectData) => {
  const txId = await createCollaboration(projectData);
  await saveProjectToDatabase({
    ...projectData,
    blockchainTxId: txId
  });
};
```

## Roadmap

### Phase 1: Core Integration ✅
- Wallet connection
- NFT minting and display
- Basic workflows
- Smart contracts

### Phase 2: Enhanced Features
- NFT marketplace
- Advanced workflows
- Collaboration contracts
- Royalty automation

### Phase 3: Production Ready
- Mainnet deployment
- Security audit
- Performance optimization
- Analytics dashboard

## Resources

### Flow Documentation
- **Main Docs**: https://developers.flow.com/
- **Cadence**: https://cadence-lang.org/
- **FCL**: https://github.com/onflow/fcl-js
- **Playground**: https://play.flow.com/

### Forte Resources
- **Forte Docs**: https://flow.com/forte
- **Actions & Workflows**: https://developers.flow.com/forte
- **Examples**: https://github.com/onflow/forte-examples

### Community
- **Discord**: https://discord.gg/flow
- **Forum**: https://forum.flow.com/

## Troubleshooting

### Wallet Won't Connect
1. Check browser console for errors
2. Ensure FCL is properly configured
3. Try different wallet (Blocto, Lilico)
4. Clear browser cache

### Transaction Fails
1. Check account has sufficient FLOW tokens
2. Verify contract addresses are correct
3. Check transaction parameters
4. Review Cadence syntax in Flow Playground

### NFTs Not Showing
1. Ensure account is set up (run setup-account transaction)
2. Check wallet address is correct
3. Verify contracts are deployed
4. Check network configuration

---

**Built for Forte Hacks by Flow** 🚀