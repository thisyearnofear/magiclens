import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { xLayerTestnet } from 'wagmi/chains'
import { parseEventLogs } from 'viem'
import { REMIX_NFT_ABI, REMIX_NFT_ADDRESS } from '@/lib/web3/contracts'
import { uploadMetadataToGrove } from '@/lib/grove'
import { getApiBaseUrl } from '@/lib/api-base'
import { toast } from 'sonner'
import { consumePendingThumbnail } from '@/lib/capture-thumbnail'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const API_BASE = getApiBaseUrl()

export type MintResult =
  | { ok: true; hash: string; tokenId: number; referrer: string }
  | { ok: false; hash?: string; error: string }

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
  const publicClient = usePublicClient({ chainId: xLayerTestnet.id })
  const { writeContractAsync, isPending } = useWriteContract()

  const mintRemix = async (
    clipTitle: string,
    overlayIds: string[],
    overlayNames: string[],
    referrerAddress?: string | null,
    options?: { onStage?: (stage: 'metadata' | 'wallet' | 'submitted' | 'confirming') => void },
  ): Promise<MintResult> => {
    const overlayIdsStr = overlayIds.join(',')
    const referrer = (referrerAddress || ZERO_ADDRESS) as `0x${string}`

    // Upload metadata to Grove; fall back to backend URL on failure
    options?.onStage?.('metadata')
    const placeholderTokenId = Date.now()
    let uri = `${API_BASE}/api/metadata/RemixNFT/${placeholderTokenId}`
    try {
      uri = await uploadMetadataToGrove({
        name: `MagicLens Remix`,
        description: `AR-enhanced sports remix: "${clipTitle}" with overlays: ${overlayNames.join(', ')}. Minted on X Layer via MagicLens.`,
        image: (await consumePendingThumbnail()) || 'https://magiclens.app/og-image.png',
        externalUrl: `https://magiclens.vercel.app/remix/pending`,
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

    let hash: string
    try {
      options?.onStage?.('wallet')
      hash = await writeContractAsync({
        address: REMIX_NFT_ADDRESS as `0x${string}`,
        abi: REMIX_NFT_ABI,
        functionName: 'mint',
        args: [uri, overlayIdsStr, [], referrer],
        chain: xLayerTestnet,
        account: address,
      })
      options?.onStage?.('submitted')
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || 'Transaction rejected'
      toast.error('Mint failed', { description: msg })
      return { ok: false, error: msg }
    }

    // Wait for on-chain confirmation — this is the critical step
    // that was previously missing. The tx can revert after submission.
    options?.onStage?.('confirming')
    try {
      if (!publicClient) {
        throw new Error('No public client available for the target network')
      }
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        timeout: 120_000,
      })

      if (receipt.status === 'reverted') {
        toast.error('Mint reverted on-chain', {
          description: 'The transaction was mined but failed. No NFT was minted. You can try again.',
        })
        return { ok: false, hash, error: 'Transaction reverted on-chain' }
      }

      // Extract the actual tokenId from the Transfer event (mint emits Transfer(0x0 → to, tokenId))
      let tokenId = -1
      try {
        const transferLogs = parseEventLogs({
          abi: REMIX_NFT_ABI,
          logs: receipt.logs as any,
          eventName: 'Transfer',
        })
        for (const log of transferLogs) {
          const args = log.args as { from: string; to: string; tokenId: bigint }
          if (args.from === ZERO_ADDRESS) {
            tokenId = Number(args.tokenId)
            break
          }
        }
      } catch {
        // parseEventLogs may fail if ABI doesn't include Transfer event;
        // fall through with tokenId = -1
      }

      // Store metadata with the real tokenId now that the mint is confirmed
      if (tokenId >= 0) {
        const metadataName = `MagicLens Remix #${tokenId}`
        const metadataDescription = `AR-enhanced sports remix: "${clipTitle}" with overlays: ${overlayNames.join(', ')}. Minted on X Layer via MagicLens.`
        const customImageUrl = (await consumePendingThumbnail()) || 'https://magiclens.app/og-image.png'
        const metadataExternalUrl = `https://magiclens.vercel.app/remix/${tokenId}`
        const metadataAttributes = [
          { trait_type: 'Clip', value: clipTitle },
          { trait_type: 'Overlays', value: overlayNames.join(', ') },
          { trait_type: 'Platform', value: 'X Layer' },
          { trait_type: 'Token Standard', value: 'ERC-721' },
        ]

        storeMetadata(tokenId, metadataName, metadataDescription, customImageUrl, metadataExternalUrl, metadataAttributes)

        // Update Grove URI with real tokenId in externalUrl (best-effort)
        try {
          await uploadMetadataToGrove({
            name: metadataName,
            description: metadataDescription,
            image: customImageUrl,
            externalUrl: metadataExternalUrl,
            attributes: metadataAttributes,
          })
        } catch {
          // Grove already has the initial upload; this is a best-effort update
        }
      }

      return { ok: true, hash, tokenId, referrer: referrer as string }
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || 'Failed to confirm transaction'
      toast.error('Could not confirm mint', {
        description: 'The transaction was submitted but we could not verify it. Check the transaction link.',
      })
      return { ok: false, hash, error: msg }
    }
  }

  return { mintRemix, isMinting: isPending }
}
