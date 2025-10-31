// FCL (Flow Client Library) configuration
import * as fcl from '@onflow/fcl';
import { flowConfig } from './config';

// Configure FCL
console.log('🔗 Configuring FCL with app icon:', `${window.location.origin}/magiclens.png`);
fcl.config({
  'app.detail.title': 'MagicLens',
  'app.detail.icon': `${window.location.origin}/magiclens.png`,
  'app.detail.description': 'Decentralized AR Video Platform on Flow',
  'app.detail.url': window.location.origin,
  'walletconnect.projectId': import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'dev-project-id', // Required for WalletConnect v2
  'accessNode.api': flowConfig.accessNode,
  'discovery.wallet': flowConfig.discoveryWallet,
  'discovery.authn.endpoint': flowConfig.discoveryAuthnEndpoint,
  'flow.network': flowConfig.network,
  // Remove deprecated 'env' config

  // Contract addresses
  '0xARAssetNFT': flowConfig.contractAddresses.ARAssetNFT,
  '0xCollaborationHub': flowConfig.contractAddresses.CollaborationHub,
  '0xForteAutomation': flowConfig.contractAddresses.ForteAutomation,
  '0xNonFungibleToken': flowConfig.contractAddresses.NonFungibleToken,
  '0xMetadataViews': flowConfig.contractAddresses.MetadataViews,
  '0xFungibleToken': flowConfig.contractAddresses.FungibleToken,
  '0xFlowToken': flowConfig.contractAddresses.FlowToken,
});

// Export configured FCL
export { fcl };

// Helper function to get current user
export const getCurrentUser = () => fcl.currentUser;

// Helper function to authenticate
export const authenticate = () => fcl.authenticate();

// Helper function to unauthenticate
export const unauthenticate = () => fcl.unauthenticate();

// Helper function to send transaction
export const sendTransaction = async (code: string, args: any[] = []) => {
  const transactionId = await fcl.mutate({
    cadence: code,
    args: (arg: any, t: any) => args.map(([value, type]) => arg(value, type)),
    limit: 999,
  });

  return fcl.tx(transactionId).onceSealed();
};

// Helper function to execute script
export const executeScript = async (code: string, args: any[] = []) => {
  return fcl.query({
    cadence: code,
    args: (arg: any, t: any) => args.map(([value, type]) => arg(value, type)),
  });
};

// Subscribe to user authentication state
export const subscribeToUser = (callback: (user: any) => void) => {
  return fcl.currentUser.subscribe(callback);
};