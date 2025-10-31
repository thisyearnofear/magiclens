// Flow blockchain configuration for MagicLens
// Supports emulator, testnet, and mainnet

export const FLOW_NETWORKS = {
  emulator: {
    accessNode: 'http://localhost:8889',
    discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn', // Use testnet discovery for local dev
    discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/testnet/authn',
  },
  testnet: {
    accessNode: 'https://rest-testnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
    discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/testnet/authn',
  },
  mainnet: {
    accessNode: 'https://rest-mainnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
    discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/authn',
  },
} as const;

export type FlowNetwork = keyof typeof FLOW_NETWORKS;

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  emulator: {
    ARAssetNFT: '0xf8d6e0586b0a20c7',
    CollaborationHub: '0xf8d6e0586b0a20c7',
    ForteAutomation: '0xf8d6e0586b0a20c7',
    NonFungibleToken: '0xf8d6e0586b0a20c7',
    MetadataViews: '0xf8d6e0586b0a20c7',
    FungibleToken: '0xf8d6e0586b0a20c7',
    FlowToken: '0xf8d6e0586b0a20c7',
  },
  testnet: {
    ARAssetNFT: 'YOUR_TESTNET_ADDRESS', // Update after deployment
    CollaborationHub: 'YOUR_TESTNET_ADDRESS',
    ForteAutomation: 'YOUR_TESTNET_ADDRESS',
    NonFungibleToken: '0x631e88ae7f1d7c20',
    MetadataViews: '0x631e88ae7f1d7c20',
    FungibleToken: '0x9a0766d93b6608b7',
    FlowToken: '0x7e60df042a9c0868',
  },
  mainnet: {
    ARAssetNFT: 'YOUR_MAINNET_ADDRESS', // Update after deployment
    CollaborationHub: 'YOUR_MAINNET_ADDRESS',
    ForteAutomation: 'YOUR_MAINNET_ADDRESS',
    NonFungibleToken: '0x1d7e57aa55817448',
    MetadataViews: '0x1d7e57aa55817448',
    FungibleToken: '0xf233dcee88fe0abe',
    FlowToken: '0x1654653399040a61',
  },
} as const;

// Get current network from environment
export const getCurrentNetwork = (): FlowNetwork => {
  const network = import.meta.env.VITE_FLOW_NETWORK || 'emulator';
  if (network in FLOW_NETWORKS) {
    return network as FlowNetwork;
  }
  return 'emulator';
};

// Get contract address for current network
export const getContractAddress = (contractName: keyof typeof CONTRACT_ADDRESSES.testnet): string => {
  const network = getCurrentNetwork();
  return CONTRACT_ADDRESSES[network][contractName];
};

// Flow configuration
export const flowConfig = {
  network: getCurrentNetwork(),
  ...FLOW_NETWORKS[getCurrentNetwork()],
  contractAddresses: CONTRACT_ADDRESSES[getCurrentNetwork()],
};