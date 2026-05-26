import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { xLayerTestnet } from 'wagmi/chains'
import { REMIX_NFT_ABI, REMIX_NFT_ADDRESS } from '@/lib/web3/contracts'
import { toast } from 'sonner'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const METADATA_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export function useMintRemix() {
  const { address } = useAccount()
  const { writeContractAsync, isPending } = useWriteContract()
  const { data: totalSupply } = useReadContract({
    address: REMIX_NFT_ADDRESS as `0x${string}`,
    abi: REMIX_NFT_ABI,
    functionName: 'totalSupply',
    chain: xLayerTestnet,
  })

  const mintRemix = async (
    clipTitle: string,
    overlayIds: string[],
    referrerAddress?: string | null,
  ) => {
    const overlayIdsStr = overlayIds.join(',')
    const nextTokenId = Number(totalSupply ?? 0)
    const uri = `${METADATA_BASE}/api/metadata/RemixNFT/${nextTokenId}`
    const referrer = (referrerAddress || ZERO_ADDRESS) as `0x${string}`

    try {
      const hash = await writeContractAsync({
        address: REMIX_NFT_ADDRESS as `0x${string}`,
        abi: REMIX_NFT_ABI,
        functionName: 'mint',
        args: [uri, overlayIdsStr, [], referrer],
        chain: xLayerTestnet,
        account: address,
      })
      return { hash, nextTokenId, referrer }
    } catch (err: any) {
      toast.error('Mint failed', {
        description: err?.shortMessage || err?.message || 'Transaction rejected',
      })
      return null
    }
  }

  return { mintRemix, isMinting: isPending }
}
