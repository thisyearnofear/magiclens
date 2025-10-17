# Flow Contract Deployment Guide

## Prerequisites

### 1. Install Flow CLI

```bash
sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"
```

Verify installation:
```bash
flow version
```

### 2. Create Flow Testnet Account

1. Visit: https://testnet-faucet.onflow.org/
2. Click "Create Account"
3. **IMPORTANT**: Save your credentials securely:
   - Account Address
   - Private Key
   - Public Key

4. Fund your account with testnet FLOW tokens (use the faucet)

## Configuration

### 1. Update flow.json

Edit [`flow.json`](flow.json) and replace the placeholder values:

```json
{
  "accounts": {
    "testnet-account": {
      "address": "YOUR_TESTNET_ADDRESS",
      "key": {
        "type": "hex",
        "index": 0,
        "signatureAlgorithm": "ECDSA_P256",
        "hashAlgorithm": "SHA3_256",
        "privateKey": "YOUR_TESTNET_PRIVATE_KEY"
      }
    }
  }
}
```

### 2. Test Locally First

Start the Flow emulator:
```bash
flow emulator start
```

In a new terminal, deploy to emulator:
```bash
flow project deploy --network emulator
```

Verify deployment:
```bash
flow accounts get f8d6e0586b0a20c7 --network emulator
```

## Testnet Deployment

### Step 1: Deploy Contracts

```bash
flow project deploy --network testnet
```

This will deploy all three contracts:
- ARAssetNFT
- CollaborationHub
- ForteAutomation

### Step 2: Verify Deployment

Check your account on Flow explorer:
```bash
flow accounts get YOUR_ADDRESS --network testnet
```

Or visit: https://testnet.flowscan.org/account/YOUR_ADDRESS

### Step 3: Update Frontend Configuration

Edit [`app/src/lib/flow/config.ts`](app/src/lib/flow/config.ts):

```typescript
testnet: {
  ARAssetNFT: 'YOUR_DEPLOYED_ADDRESS',
  CollaborationHub: 'YOUR_DEPLOYED_ADDRESS',
  ForteAutomation: 'YOUR_DEPLOYED_ADDRESS',
  // ... other contracts
}
```

### Step 4: Update Backend Configuration

Use the API endpoint to set contract addresses:

```bash
curl -X POST http://localhost:8000/api/flow/admin/set-contract-address \
  -H "Content-Type: application/json" \
  -d '{
    "contract_name": "ARAssetNFT",
    "address": "YOUR_DEPLOYED_ADDRESS"
  }'
```

Repeat for each contract.

## Testing Deployment

### 1. Test Account Setup

```bash
flow transactions send ./app/src/lib/flow/transactions/setup-account.ts \
  --network testnet \
  --signer testnet-account
```

### 2. Test NFT Minting

Create a test transaction file `test-mint.cdc`:

```cadence
import ARAssetNFT from YOUR_ADDRESS

transaction() {
  prepare(signer: AuthAccount) {
    let minter = signer.borrow<&ARAssetNFT.NFTMinter>(from: ARAssetNFT.MinterStoragePath)
      ?? panic("Could not borrow minter")
    
    let collection = signer.getCapability(ARAssetNFT.CollectionPublicPath)
      .borrow<&ARAssetNFT.Collection{NonFungibleToken.CollectionPublic}>()
      ?? panic("Could not borrow collection")
    
    minter.mintNFT(
      recipient: collection,
      name: "Test NFT",
      description: "Test description",
      category: ARAssetNFT.Category.effects,
      assetType: "gif",
      fileURL: "https://example.com/test.gif",
      thumbnailURL: nil,
      fileSize: 1024,
      dimensions: {"width": 512, "height": 512},
      duration: nil,
      tags: ["test"],
      licenseType: ARAssetNFT.LicenseType.personal,
      royaltyPercentage: 5.0,
      creator: signer.address
    )
  }
}
```

Execute:
```bash
flow transactions send test-mint.cdc --network testnet --signer testnet-account
```

### 3. Test Scripts

Query user NFTs:
```bash
flow scripts execute ./app/src/lib/flow/scripts/get-user-nfts.ts YOUR_ADDRESS --network testnet
```

## Frontend Testing

### 1. Update Environment

```bash
cd app
echo "VITE_FLOW_NETWORK=testnet" > .env
```

### 2. Start Development Server

```bash
pnpm run dev
```

### 3. Test Wallet Connection

1. Navigate to http://localhost:5173/flow
2. Click "Connect Wallet"
3. Choose your Flow wallet (Blocto, Lilico, or Flow Wallet)
4. Approve connection

### 4. Test NFT Minting

1. Go to asset upload
2. Upload an AR asset
3. Click "Mint as NFT"
4. Approve transaction in wallet
5. Wait for confirmation
6. Check NFT gallery

## Troubleshooting

### Issue: "Account not found"

**Solution**: Ensure your testnet account is funded
```bash
# Check balance
flow accounts get YOUR_ADDRESS --network testnet

# If balance is 0, visit faucet again
```

### Issue: "Contract not found"

**Solution**: Verify deployment
```bash
flow accounts get YOUR_ADDRESS --network testnet
# Look for "contracts" section
```

### Issue: "Insufficient gas"

**Solution**: Get more testnet FLOW from faucet
- Visit: https://testnet-faucet.onflow.org/
- Enter your address
- Request tokens

### Issue: "Transaction failed"

**Solution**: Check transaction details
```bash
flow transactions get TRANSACTION_ID --network testnet
```

### Issue: "Wallet won't connect"

**Solutions**:
1. Clear browser cache
2. Try different wallet (Blocto, Lilico)
3. Check FCL configuration in console
4. Ensure correct network (testnet)

## Mainnet Deployment (Optional)

⚠️ **WARNING**: Only deploy to mainnet after thorough testing on testnet!

### 1. Create Mainnet Account

- Use a hardware wallet or secure key management
- Fund with real FLOW tokens
- **NEVER** share your mainnet private key

### 2. Update flow.json

```json
{
  "accounts": {
    "mainnet-account": {
      "address": "YOUR_MAINNET_ADDRESS",
      "key": {
        "privateKey": "YOUR_MAINNET_PRIVATE_KEY"
      }
    }
  }
}
```

### 3. Deploy to Mainnet

```bash
flow project deploy --network mainnet
```

### 4. Update Frontend

```typescript
// app/src/lib/flow/config.ts
mainnet: {
  ARAssetNFT: 'YOUR_MAINNET_ADDRESS',
  CollaborationHub: 'YOUR_MAINNET_ADDRESS',
  ForteAutomation: 'YOUR_MAINNET_ADDRESS',
}
```

```bash
# .env
VITE_FLOW_NETWORK=mainnet
```

## Post-Deployment Checklist

- [ ] All contracts deployed successfully
- [ ] Contract addresses updated in frontend config
- [ ] Contract addresses updated in backend
- [ ] Account setup transaction works
- [ ] NFT minting works
- [ ] Wallet connection works
- [ ] NFT gallery displays correctly
- [ ] Workflows can be created
- [ ] All transactions complete successfully
- [ ] Explorer links work
- [ ] Documentation updated with addresses

## Monitoring

### Check Contract Events

```bash
# Get recent events
flow events get A.YOUR_ADDRESS.ARAssetNFT.Minted \
  --start BLOCK_HEIGHT \
  --end BLOCK_HEIGHT \
  --network testnet
```

### Monitor Transactions

Visit Flow explorer:
- Testnet: https://testnet.flowscan.org/
- Mainnet: https://flowscan.org/

### API Health Check

```bash
curl http://localhost:8000/api/flow/health
```

Expected response:
```json
{
  "status": "healthy",
  "network": "testnet",
  "contracts": {
    "ARAssetNFT": "YOUR_ADDRESS",
    "CollaborationHub": "YOUR_ADDRESS",
    "ForteAutomation": "YOUR_ADDRESS"
  }
}
```

## Security Best Practices

1. **Never commit private keys** to git
2. **Use environment variables** for sensitive data
3. **Test thoroughly** on testnet before mainnet
4. **Backup your keys** securely
5. **Use hardware wallets** for mainnet
6. **Monitor contract events** for suspicious activity
7. **Set up alerts** for large transactions
8. **Regular security audits** before mainnet

## Support Resources

- **Flow Discord**: https://discord.gg/flow
- **Flow Forum**: https://forum.flow.com/
- **Flow Docs**: https://developers.flow.com/
- **Hackathon Telegram**: Join from hackathon page

## Next Steps After Deployment

1. ✅ Test all features end-to-end
2. ✅ Create demo video
3. ✅ Update documentation with deployed addresses
4. ✅ Prepare hackathon submission
5. ✅ Post on social media
6. ✅ Submit to hackathon platform

---

**Ready to deploy? Follow this guide step-by-step and you'll have your contracts live on Flow testnet in minutes!** 🚀