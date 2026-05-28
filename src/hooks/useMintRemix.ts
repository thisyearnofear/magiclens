import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { xLayerTestnet } from 'wagmi/chains'
import { REMIX_NFT_ABI, REMIX_NFT_ADDRESS } from '@/lib/web3/contracts'
import { uploadMetadataToGrove } from '@/lib/grove'
import { getApiBaseUrl } from '@/lib/api-base'
import { toast } from 'sonner'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const API_BASE = getApiBaseUrl()

async function storeMetadata(tokenId: number, name: string, description: string, image: string, externalUrl: string, attributes: Array<{ trait_type: string; value: string }>) {
  try {
    await fetch(`${API_BASE}/api/metadata/RemixNFT/${tokenId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, image, external_url: externalUrl, attributes }),
    })
  } catch {
    // non-critical — metadata endpoint is a cache, Grove or fallback still works
  }
}

export function useMintRemix() {
  const { address } = useAccount()
  const { writeContractAsync, isPending } = useWriteContract()
  const { data: totalSupply } = useReadContract({
    address: REMIX_NFT_ADDRESS as `0x${string}`,
    abi: REMIX_NFT_ABI,
    functionName: 'totalSupply',
    chainId: xLayerTestnet.id,
  })

  const mintRemix = async (
    clipTitle: string,
    overlayIds: string[],
    overlayNames: string[],
    referrerAddress?: string | null,
    options?: { onStage?: (stage: 'metadata' | 'wallet' | 'submitted') => void },
  ) => {
    const overlayIdsStr = overlayIds.join(',')
    const nextTokenId = Number(totalSupply ?? 0)
    const referrer = (referrerAddress || ZERO_ADDRESS) as `0x${string}`

    const metadataName = `MagicLens Remix #${nextTokenId}`
    const metadataDescription = `AR-enhanced sports remix: "${clipTitle}" with overlays: ${overlayNames.join(', ')}. Minted on X Layer via MagicLens.`
    const metadataImage = 'https://magiclens.app/og-image.png'
    const metadataExternalUrl = `https://magiclens.vercel.app/remix/${nextTokenId}`
    const metadataAttributes = [
      { trait_type: 'Clip', value: clipTitle },
      { trait_type: 'Overlays', value: overlayNames.join(', ') },
      { trait_type: 'Platform', value: 'X Layer' },
      { trait_type: 'Token Standard', value: 'ERC-721' },
    ]

    // Upload metadata to Grove; fall back to backend URL on failure
    let uri = `${API_BASE}/api/metadata/RemixNFT/${nextTokenId}`
    options?.onStage?.('metadata')
    try {
      uri = await uploadMetadataToGrove({
        name: metadataName,
        description: metadataDescription,
        image: metadataImage,
        externalUrl: metadataExternalUrl,
        attributes: metadataAttributes,
      })
    } catch (err) {
      console.warn('Grove upload failed, falling back to backend metadata:', err)
    }

    try {
      options?.onStage?.('wallet')
      const hash = await writeContractAsync({
        address: REMIX_NFT_ADDRESS as `0x${string}`,
        abi: REMIX_NFT_ABI,
        functionName: 'mint',
        args: [uri, overlayIdsStr, [], referrer],
        chain: xLayerTestnet,
        account: address,
      })
      options?.onStage?.('submitted')

      // Persist metadata to backend regardless of Grove success
      storeMetadata(nextTokenId, metadataName, metadataDescription, metadataImage, metadataExternalUrl, metadataAttributes)

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
