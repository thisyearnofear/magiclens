export const REMIX_NFT_ADDRESS =
  (process.env.NEXT_PUBLIC_REMIX_NFT_ADDRESS as `0x${string}`) ||
  '0x910d4383313814CC47db6ffeD56aC2F2CBE764Cf'

export const WORLDCUP_PACK_ADDRESS =
  (process.env.NEXT_PUBLIC_WORLDCUP_PACK_ADDRESS as `0x${string}`) ||
  '0xff52Adf73e19fCd2B79784154CFf23b218CCEdfB'

export const REMIX_NFT_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'uri', type: 'string' },
      { internalType: 'string', name: 'overlayIds', type: 'string' },
      { internalType: 'uint256[]', name: 'packTokenIds', type: 'uint256[]' },
      { internalType: 'address', name: 'referrer', type: 'address' },
    ],
    name: 'mint',
    outputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const WORLDCUP_PACK_ABI = [
  {
    inputs: [],
    name: 'claimStarterPack',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'hasClaimedStarter',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
