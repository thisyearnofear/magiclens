import { useAccount, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { xLayerTestnet } from 'wagmi/chains'
import { REMIX_NFT_ABI, REMIX_NFT_ADDRESS } from '@/lib/web3/contracts'
import { toast } from '@/hooks/use-toast'

/**
 * Hook that wraps wagmi useWriteContract for minting a RemixNFT.
 */
export function useMintRemix() {
  const { address } = useAccount()
  const { writeContractAsync, isPending } = useWriteContract()

  const mintRemix = async (clipTitle: string, overlayIds: string[]) => {
    const matchTimestamp = BigInt(Math.floor(Date.now() / 1000))
    const matchId = clipTitle.toLowerCase().replace(/\s+/g, '-')
    const videoCid = 'demo-video-cid'
    const thumbnailCid = 'demo-thumb-cid'
    const packTokenIds = overlayIds.map((_, i) => BigInt(i + 1))
    const uri = `ipfs://demo/${matchId}`

    try {
      const hash = await writeContractAsync({
        address: REMIX_NFT_ADDRESS as `0x${string}`,
        abi: REMIX_NFT_ABI,
        functionName: 'mintRemix',
        args: [matchTimestamp, matchId, videoCid, thumbnailCid, packTokenIds, uri],
        value: parseEther('0'),
        chain: xLayerTestnet,
        account: address,
      })
      return hash
    } catch (err: any) {
      toast({
        title: 'Mint failed',
        description: err?.shortMessage || err?.message || 'Transaction rejected',
        variant: 'destructive',
      })
      return null
    }
  }

  return { mintRemix, isMinting: isPending }
}
