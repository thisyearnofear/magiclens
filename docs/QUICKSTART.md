# MagicLens Flow Integration - Quick Start Guide

## 🚀 Getting Started (Days 1-2)

### Prerequisites Installation

1. **Install Flow CLI**
   ```bash
   sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"
   ```

2. **Verify Installation**
   ```bash
   flow version
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd app
   pnpm add @onflow/fcl @onflow/types @onflow/sdk
   ```

### Flow Testnet Setup

1. **Create Flow Testnet Account**
   - Visit: https://testnet-faucet.onflow.org/
   - Click "Create Account"
   - Save your address and private key securely
   - Fund account with testnet FLOW tokens

2. **Update flow.json**
   ```bash
   # Edit flow.json and add your testnet account details
   # Replace YOUR_TESTNET_PRIVATE_KEY with your actual key
   ```

3. **Test Connection**
   ```bash
   flow accounts get YOUR_TESTNET_ADDRESS --network testnet
   ```

### Local Development Setup

1. **Start Flow Emulator**
   ```bash
   flow emulator start
   ```

2. **Deploy Contracts Locally (in new terminal)**
   ```bash
   flow project deploy --network emulator
   ```

3. **Verify Deployment**
   ```bash
   flow accounts get f8d6e0586b0a20c7 --network emulator
   ```

## 📋 Day-by-Day Checklist

### Day 1: Setup & Research ✓
- [x] Install Flow CLI
- [x] Create testnet account
- [x] Review Flow documentation
- [x] Study Forte Actions & Workflows
- [ ] Test local emulator
- [ ] Deploy contracts to emulator

### Day 2: Smart Contract Testing
- [ ] Test ARAssetNFT contract
- [ ] Test CollaborationHub contract
- [ ] Test ForteAutomation contract
- [ ] Write transaction scripts
- [ ] Write query scripts
- [ ] Deploy to testnet

### Day 3-4: Frontend Integration
- [ ] Set up FCL configuration
- [ ] Implement wallet connection
- [ ] Create Flow auth hook
- [ ] Test authentication flow
- [ ] Update UI components

### Day 5-6: NFT Integration
- [ ] Implement NFT minting UI
- [ ] Display user NFT collection
- [ ] Add asset ownership verification
- [ ] Test NFT transfers
- [ ] Integrate with existing asset system

### Day 7-8: Forte Workflows
- [ ] Implement scheduled publishing
- [ ] Add royalty distribution
- [ ] Create collaboration triggers
- [ ] Test workflow execution
- [ ] Add workflow management UI

### Day 9-10: Backend Integration
- [ ] Create Flow service layer
- [ ] Sync blockchain events
- [ ] Update database schema
- [ ] Test end-to-end flows
- [ ] Performance optimization

### Day 11-12: Testing & Polish
- [ ] Full integration testing
- [ ] Bug fixes
- [ ] UI/UX improvements
- [ ] Performance tuning
- [ ] Security review

### Day 13: Documentation & Demo
- [ ] Record demo video (5-7 min)
- [ ] Write comprehensive README
- [ ] Document smart contracts
- [ ] Create deployment guide
- [ ] Prepare social media post

### Day 14: Submission
- [ ] Final testing
- [ ] Deploy to mainnet (optional)
- [ ] Submit to hackathon
- [ ] Post on social media
- [ ] Celebrate! 🎉

## 🔧 Essential Commands

### Flow CLI Commands
```bash
# Start emulator
flow emulator start

# Deploy contracts
flow project deploy --network emulator
flow project deploy --network testnet

# Run transactions
flow transactions send ./transactions/mint-asset.cdc --network testnet

# Run scripts (queries)
flow scripts execute ./scripts/get-assets.cdc --network testnet

# Get account info
flow accounts get ADDRESS --network testnet

# Generate keys
flow keys generate
```

### Development Workflow
```bash
# Terminal 1: Backend
cd services
uvicorn main:app --reload

# Terminal 2: Frontend
cd app
pnpm run dev

# Terminal 3: Flow Emulator (for local testing)
flow emulator start

# Terminal 4: Logging Server
cd logging-server
python logging-server.py
```

## 📚 Key Resources

### Flow Documentation
- **Main Docs**: https://developers.flow.com/
- **Cadence Docs**: https://cadence-lang.org/
- **FCL Docs**: https://github.com/onflow/fcl-js
- **Flow Playground**: https://play.flow.com/

### Forte Resources
- **Forte Overview**: https://flow.com/forte
- **Actions & Workflows**: https://developers.flow.com/forte
- **Examples**: https://github.com/onflow/forte-examples

### Tools
- **Flow CLI**: https://developers.flow.com/tools/flow-cli
- **Flow Explorer (Testnet)**: https://testnet.flowscan.org/
- **Flow Faucet**: https://testnet-faucet.onflow.org/
- **VS Code Extension**: Search "Flow" in VS Code extensions

### Community
- **Discord**: https://discord.gg/flow
- **Forum**: https://forum.flow.com/
- **Telegram**: Join from hackathon page

## 🎯 Success Criteria

### Technical Requirements
- ✅ Deploy 3+ smart contracts to testnet
- ✅ Implement wallet connection with FCL
- ✅ Mint AR assets as NFTs
- ✅ Create 2+ Forte workflows
- ✅ Demonstrate collaboration features
- ✅ Show automated royalty distribution

### Submission Requirements
- ✅ Working demo on testnet
- ✅ GitHub repository (public)
- ✅ README with Flow integration details
- ✅ Contract addresses documented
- ✅ 5-7 minute demo video
- ✅ Social media post tagging @flow_blockchain

### Judging Criteria Focus
1. **Technology (25%)**: Deep Flow + Forte integration
2. **Completion (20%)**: Full end-to-end working demo
3. **Originality (10%)**: First AR NFT platform on Flow
4. **UX (10%)**: Polished interface
5. **Practicality (10%)**: Real creator use case
6. **Protocol Usage (10%)**: Extensive Flow ecosystem integration

## 🚨 Common Issues & Solutions

### Issue: Flow CLI not found
```bash
# Solution: Add to PATH
export PATH="$HOME/.local/bin:$PATH"
source ~/.zshrc  # or ~/.bashrc
```

### Issue: Emulator won't start
```bash
# Solution: Kill existing process
pkill flow-emulator
flow emulator start
```

### Issue: Contract deployment fails
```bash
# Solution: Check syntax in Flow Playground first
# Visit: https://play.flow.com/
# Paste contract code and test
```

### Issue: Transaction fails
```bash
# Solution: Check account balance
flow accounts get YOUR_ADDRESS --network testnet
# Get more tokens from faucet if needed
```

### Issue: FCL connection fails
```bash
# Solution: Check FCL configuration
# Ensure correct network and access node
# Clear browser cache and reconnect wallet
```

## 💡 Pro Tips

1. **Test Locally First**: Always test on emulator before testnet
2. **Use Flow Playground**: Great for testing contract syntax
3. **Save Private Keys Securely**: Never commit to git
4. **Document as You Go**: Write docs while coding
5. **Record Progress**: Take screenshots/videos throughout
6. **Join Discord**: Get help from Flow community
7. **Start Simple**: Get basic flow working, then add features
8. **Test Early, Test Often**: Don't wait until day 14

## 🎬 Demo Video Structure

1. **Introduction (30s)**
   - What is MagicLens
   - Problem it solves
   - Flow integration benefits

2. **Wallet Connection (1min)**
   - Connect Flow wallet
   - Show user profile
   - Display NFT collection

3. **NFT Minting (1.5min)**
   - Upload AR asset
   - Mint as NFT
   - View on Flow explorer
   - Show in wallet

4. **Collaboration (1.5min)**
   - Create project
   - Add collaborators
   - Set revenue shares
   - Record contributions

5. **Forte Workflows (1.5min)**
   - Create scheduled publishing workflow
   - Set up royalty distribution
   - Trigger workflow
   - Show automation in action

6. **Conclusion (1min)**
   - Recap key features
   - Real-world use cases
   - Future roadmap
   - Call to action

## 📊 Progress Tracking

Use this checklist to track your progress:

```
Day 1:  [▓▓▓▓▓▓▓▓▓▓] 100% - Setup & Research
Day 2:  [░░░░░░░░░░]   0% - Contract Testing
Day 3:  [░░░░░░░░░░]   0% - Frontend Integration
Day 4:  [░░░░░░░░░░]   0% - Frontend Integration
Day 5:  [░░░░░░░░░░]   0% - NFT Integration
Day 6:  [░░░░░░░░░░]   0% - NFT Integration
Day 7:  [░░░░░░░░░░]   0% - Forte Workflows
Day 8:  [░░░░░░░░░░]   0% - Forte Workflows
Day 9:  [░░░░░░░░░░]   0% - Backend Integration
Day 10: [░░░░░░░░░░]   0% - Backend Integration
Day 11: [░░░░░░░░░░]   0% - Testing & Polish
Day 12: [░░░░░░░░░░]   0% - Testing & Polish
Day 13: [░░░░░░░░░░]   0% - Demo & Docs
Day 14: [░░░░░░░░░░]   0% - Submission
```

## 🏆 Target Prizes

**Primary Targets:**
- Best Killer App on Flow: $16,000
- Best Use of Flow Forte: $12,000
- Best Existing Code Integration: $12,000

**Bonus Targets:**
- Dapper NFT Experience: $9,000
- Best Vibe Coded Project: $5,000

**Total Potential: $54,000**

---

**Ready to build? Let's make MagicLens the winning project! 🚀**

For questions or issues, refer to:
- FLOW_INTEGRATION_PLAN.md (detailed technical plan)
- Flow Discord community
- Hackathon Telegram group