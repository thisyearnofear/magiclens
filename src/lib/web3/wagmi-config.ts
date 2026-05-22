import { http, createConfig } from 'wagmi'
import { xLayerTestnet, xLayer } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'magiclens-demo'

// Create wagmi config with X Layer support
// RainbowKit auto-detects OKX Wallet, MetaMask, and other EIP-1193 wallets
export const wagmiConfig = createConfig({
  chains: [xLayerTestnet, xLayer],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [xLayerTestnet.id]: http('https://testrpc.xlayer.tech'),
    [xLayer.id]: http('https://rpc.xlayer.tech'),
  },
  ssr: false,
})

// Target chain for the hackathon (default: X Layer testnet)
export const getTargetChain = () => {
  if (process.env.NEXT_PUBLIC_XLAYER_NETWORK === 'mainnet') {
    return xLayer
  }
  return xLayerTestnet
}

export const getTargetChainId = (): number => getTargetChain().id
