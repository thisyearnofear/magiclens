import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@rainbow-me/rainbowkit',
    '@wagmi/core',
    'wagmi',
    'viem',
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.VITE_WALLETCONNECT_PROJECT_ID || '1917e42082d0dcb7af56fc4b3aaae79c',
    NEXT_PUBLIC_XLAYER_NETWORK: process.env.VITE_XLAYER_NETWORK || 'testnet',
    NEXT_PUBLIC_FLOW_NETWORK: process.env.VITE_FLOW_NETWORK || 'testnet',
    NEXT_PUBLIC_API_BASE_URL: process.env.VITE_API_BASE_URL || '',
    NEXT_PUBLIC_WORLDCUP_PACK_ADDRESS: process.env.VITE_WORLDCUP_PACK_ADDRESS || '',
    NEXT_PUBLIC_REMIX_NFT_ADDRESS: process.env.VITE_REMIX_NFT_ADDRESS || '',
    NEXT_PUBLIC_FAN_CAST_REWARDS_ADDRESS: process.env.VITE_FAN_CAST_REWARDS_ADDRESS || '',
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
    ],
  },
};

export default nextConfig;
