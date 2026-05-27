import { http, createConfig, type CreateConnectorFn } from 'wagmi'
import { xLayerTestnet, xLayer } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

const connectors: CreateConnectorFn[] = [injected()]
if (projectId && projectId !== 'magiclens-demo') {
  connectors.push(walletConnect({ projectId }))
}

export const wagmiConfig = createConfig({
  chains: [xLayerTestnet, xLayer],
  connectors,
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
