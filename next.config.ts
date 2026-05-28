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
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
    ],
  },
};

export default nextConfig;
