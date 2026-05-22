import { useAccount, useWriteContract } from 'wagmi'
import { xLayerTestnet } from 'wagmi/chains'
import { REMIX_NFT_ABI, REMIX_NFT_ADDRESS } from '@/lib/web3/contracts'
import { toast } from 'sonner'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export function useMintRemix() {
  const { address } = useAccount()
  const { writeContractAsync, isPending } = useWriteContract()

  const mintRemix = async (clipTitle: string, overlayIds: string[]) => {
    const overlayIdsStr = overlayIds.join(',')
    const uri = `ipfs://demo/${clipTitle.toLowerCase().replace(/\s+/g, '-')}`

    try {
      const hash = await writeContractAsync({
        address: REMIX_NFT_ADDRESS as `0x${string}`,
        abi: REMIX_NFT_ABI,
        functionName: 'mint',
        args: [uri, overlayIdsStr, [], ZERO_ADDRESS],
        chain: xLayerTestnet,
        account: address,
      })
      return hash
    } catch (err: any) {
      toast.error('Mint failed', {
        description: err?.shortMessage || err?.message || 'Transaction rejected',
      })
      return null
    }
  }

  return { mintRemix, isMinting: isPending }
}
