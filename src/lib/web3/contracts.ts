/**
 * RemixNFT contract ABI and address for X Layer testnet.
 */

export const REMIX_NFT_ADDRESS =
  (process.env.NEXT_PUBLIC_REMIX_NFT_ADDRESS as `0x${string}`) ||
  '0x7e33f6b572A37792dAEacd902060528070b378D3'

export const REMIX_NFT_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'matchTimestamp', type: 'uint256' },
      { internalType: 'string', name: 'matchId', type: 'string' },
      { internalType: 'string', name: 'videoCid', type: 'string' },
      { internalType: 'string', name: 'thumbnailCid', type: 'string' },
      { internalType: 'uint256[]', name: 'packTokenIds', type: 'uint256[]' },
      { internalType: 'string', name: 'uri', type: 'string' },
    ],
    name: 'mintRemix',
    outputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const
