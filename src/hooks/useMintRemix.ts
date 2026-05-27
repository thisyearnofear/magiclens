import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { xLayerTestnet } from 'wagmi/chains'
import { REMIX_NFT_ABI, REMIX_NFT_ADDRESS } from '@/lib/web3/contracts'
import { uploadMetadataToGrove } from '@/lib/grove'
import { toast } from 'sonner'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const FALLBACK_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

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
    overlayNames: string[],
    referrerAddress?: string | null,
  ) => {
    const overlayIdsStr = overlayIds.join(',')
    const nextTokenId = Number(totalSupply ?? 0)
    const referrer = (referrerAddress || ZERO_ADDRESS) as `0x${string}`

    // Upload metadata to Grove; fall back to backend URL on failure
    let uri = `${FALLBACK_BASE}/api/metadata/RemixNFT/${nextTokenId}`
    try {
      uri = await uploadMetadataToGrove({
        name: `MagicLens Remix #${nextTokenId}`,
        description: `AR-enhanced sports remix: "${clipTitle}" with overlays: ${overlayNames.join(', ')}. Minted on X Layer via MagicLens.`,
        image: 'https://magiclens.app/og-image.png',
        externalUrl: `https://magiclens.vercel.app/remix/${nextTokenId}`,
        attributes: [
          { trait_type: 'Clip', value: clipTitle },
          { trait_type: 'Overlays', value: overlayNames.join(', ') },
          { trait_type: 'Platform', value: 'X Layer' },
          { trait_type: 'Token Standard', value: 'ERC-721' },
        ],
      })
    } catch (err) {
      console.warn('Grove upload failed, falling back to backend metadata:', err)
    }

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
