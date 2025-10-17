# MagicLens Flow Blockchain Integration

## Overview

MagicLens has been integrated with Flow blockchain to enable:
- **NFT-based AR Assets**: Mint your AR overlays as tradeable NFTs
- **Forte Workflows**: Automate content publishing and royalty distribution
- **Decentralized Collaboration**: Smart contract-based team projects with revenue sharing
- **On-chain Authentication**: Secure wallet-based user authentication

## 🚀 Quick Start

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
cd app
pnpm install
```

### 2. Configure Environment

Create `.env` file in the `app` directory:

```bash
cp .env.example .env
```

Edit `.env` and set:
```
VITE_FLOW_NETWORK=testnet
```

### 3. Run the Application

```bash
# Terminal 1: Backend
cd services
uvicorn main:app --reload

# Terminal 2: Frontend
cd app
pnpm run dev
```

### 4. Access Flow Dashboard

Navigate to: `http://localhost:5173/flow`

## 📁 Project Structure

```
app/src/
├── lib/flow/
│   ├── config.ts                    # Network and contract configuration
│   ├── fcl-config.ts               # FCL initialization
│   ├── transactions/               # Cadence transactions
│   │   ├── mint-asset.ts          # Mint AR NFT
│   │   ├── setup-account.ts       # Initialize user account
│   │   ├── create-collaboration.ts # Create project
│   │   └── create-workflow.ts     # Create Forte workflow
│   └── scripts/                    # Cadence scripts (queries)
│       ├── get-user-nfts.ts       # Fetch user NFTs
│       ├── get-user-projects.ts   # Fetch collaborations
│       └── get-user-workflows.ts  # Fetch workflows
├── hooks/
│   ├── use-flow-auth.ts           # Flow wallet authentication
│   ├── use-flow-nfts.ts           # NFT management
│   └── use-flow-workflows.ts      # Workflow management
└── components/
    ├── FlowDashboard.tsx          # Main Flow dashboard
    ├── FlowWalletConnect.tsx      # Wallet connection UI
    ├── FlowNFTGallery.tsx         # NFT display
    └── FlowWorkflowManager.tsx    # Workflow management UI

contracts/
├── ARAssetNFT.cdc                 # AR Asset NFT contract
├── CollaborationHub.cdc           # Collaboration contract
├── ForteAutomation.cdc            # Forte workflows contract
└── MarketplaceCore.cdc            # (Coming soon)

flow.json                          # Flow project configuration
```

## 🔧 Features Implemented

### ✅ Wallet Connection
- Flow wallet integration via FCL
- Support for Flow Wallet, Blocto, Lilico
- Automatic session management
- User-friendly connection UI

### ✅ NFT Management
- Mint AR assets as NFTs
- View NFT collection
- Display NFT metadata
- Track usage statistics

### ✅ Forte Workflows
- Create scheduled publishing workflows
- Automate royalty distribution
- Event-based triggers
- Workflow execution tracking

### ✅ Smart Contracts
- ARAssetNFT: NFT contract with metadata and royalties
- CollaborationHub: Multi-party project management
- ForteAutomation: Workflow automation

## 🎯 Usage Examples

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

## 🔐 Smart Contract Deployment

### Prerequisites

1. Install Flow CLI:
```bash
sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"
```

2. Create Flow testnet account:
- Visit: https://testnet-faucet.onflow.org/
- Save your address and private key

### Deploy to Testnet

1. Update `flow.json` with your testnet account:
```json
{
  "accounts": {
    "testnet-account": {
      "address": "YOUR_ADDRESS",
      "key": {
        "privateKey": "YOUR_PRIVATE_KEY"
      }
    }
  }
}
```

2. Deploy contracts:
```bash
flow project deploy --network testnet
```

3. Update contract addresses in `app/src/lib/flow/config.ts`:
```typescript
testnet: {
  ARAssetNFT: 'YOUR_DEPLOYED_ADDRESS',
  CollaborationHub: 'YOUR_DEPLOYED_ADDRESS',
  ForteAutomation: 'YOUR_DEPLOYED_ADDRESS',
}
```

## 🧪 Testing

### Local Testing with Emulator

1. Start Flow emulator:
```bash
flow emulator start
```

2. Deploy contracts locally:
```bash
flow project deploy --network emulator
```

3. Update environment:
```bash
VITE_FLOW_NETWORK=emulator
```

### Test Transactions

```bash
# Test minting
flow transactions send ./transactions/mint-asset.cdc --network emulator

# Test account setup
flow transactions send ./transactions/setup-account.cdc --network emulator
```

### Test Scripts

```bash
# Get user NFTs
flow scripts execute ./scripts/get-user-nfts.cdc YOUR_ADDRESS --network emulator
```

## 📊 Contract Details

### ARAssetNFT

**Features:**
- NFT standard compliance (NonFungibleToken, MetadataViews)
- Rich metadata (name, description, category, file URLs)
- Royalty support (creator earnings)
- License types (personal, commercial, exclusive)
- Usage tracking

**Categories:**
- 0: Creatures
- 1: Effects
- 2: Objects
- 3: Text
- 4: Decorations

**License Types:**
- 0: Personal (free for personal use)
- 1: Commercial (requires payment)
- 2: Exclusive (one-time license)

### ForteAutomation

**Workflow Types:**
- 0: Scheduled Publishing
- 1: Royalty Distribution
- 2: Collaboration Notification
- 3: Content Moderation

**Trigger Types:**
- 0: Time-Based (execute at specific time)
- 1: Event-Based (execute on blockchain event)
- 2: Condition-Based (execute when condition met)

**Action Types:**
- 0: Mint AR Asset
- 1: Apply Overlay
- 2: Share Revenue
- 3: License Asset
- 4: Notify Collaborators
- 5: Publish Content

### CollaborationHub

**Features:**
- Multi-party project management
- Role-based access control
- Revenue sharing (percentage-based)
- Contribution tracking
- Project lifecycle management

**Roles:**
- 0: Owner (full control)
- 1: Editor (can edit)
- 2: Contributor (can contribute)
- 3: Viewer (read-only)

## 🎨 UI Components

### FlowDashboard
Main dashboard with tabs for wallet, NFTs, workflows, and collaborations.

### FlowWalletConnect
Wallet connection component with status display and disconnect functionality.

### FlowNFTGallery
Grid display of user's AR Asset NFTs with metadata and usage stats.

### FlowWorkflowManager
Create and manage Forte workflows with scheduling and execution tracking.

## 🔄 Integration with Existing Features

### Asset Upload → NFT Minting
When users upload AR assets, they can optionally mint them as NFTs:

```typescript
// In AssetUpload component
const handleUploadAndMint = async (file) => {
  // 1. Upload to storage
  const uploadedAsset = await uploadAsset(file);
  
  // 2. Mint as NFT
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
  // Create on-chain project
  const txId = await createCollaboration(
    projectData.name,
    projectData.description
  );
  
  // Store project ID in database
  await saveProjectToDatabase({
    ...projectData,
    blockchainTxId: txId
  });
};
```

## 🚧 Roadmap

### Phase 1: Core Integration (Current)
- ✅ Wallet connection
- ✅ NFT minting and display
- ✅ Basic workflows
- ✅ Smart contracts

### Phase 2: Enhanced Features
- [ ] NFT marketplace
- [ ] Advanced workflows
- [ ] Collaboration contracts
- [ ] Royalty automation

### Phase 3: Production Ready
- [ ] Mainnet deployment
- [ ] Security audit
- [ ] Performance optimization
- [ ] Analytics dashboard

## 📚 Resources

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
- **Telegram**: Join from hackathon page

## 🐛 Troubleshooting

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
4. Check network configuration (emulator vs testnet)

## 🤝 Contributing

When adding new Flow features:

1. Add Cadence code to `contracts/`
2. Create transaction/script in `app/src/lib/flow/`
3. Add hook in `app/src/hooks/`
4. Create UI component in `app/src/components/`
5. Update this README

## 📝 License

This Flow integration is part of the MagicLens project and follows the same license.

---

**Built for Forte Hacks by Flow** 🚀