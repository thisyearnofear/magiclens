import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { xLayerTestnet } from 'wagmi/chains'
import { formatEther } from 'viem'
import { CREATOR_PASS_ABI, CREATOR_PASS_ADDRESS } from '@/lib/web3/contracts'

/**
 * Creator Pass entitlement: holding token id 1 of the CreatorPass
 * ERC-1155 on X Layer testnet = Pro. Unlocks watermark-free + longer
 * exports. See docs/MONETIZATION.md.
 */
export function useIsPro() {
  const { address } = useAccount()

  const { data: isPro, refetch: refetchPro } = useReadContract({
    address: CREATOR_PASS_ADDRESS,
    abi: CREATOR_PASS_ABI,
    functionName: 'isPro',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: priceWei } = useReadContract({
    address: CREATOR_PASS_ADDRESS,
    abi: CREATOR_PASS_ABI,
    functionName: 'price',
  })

  const { writeContractAsync, isPending, data: txHash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const buyPass = async () => {
    if (!address || !priceWei) return
    const hash = await writeContractAsync({
      address: CREATOR_PASS_ADDRESS,
      abi: CREATOR_PASS_ABI,
      functionName: 'mint',
      value: priceWei,
      chain: xLayerTestnet,
      account: address,
    })
    return hash
  }

  return {
    isPro: !!isPro,
    priceEth: priceWei ? formatEther(priceWei) : null,
    buyPass,
    isPending,
    isConfirming,
    isConfirmed,
    refetchPro,
    connected: !!address,
  }
}
