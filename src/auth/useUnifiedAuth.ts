import { useCallback, useMemo } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { useFlowAuth } from '../hooks/use-flow-auth'
import { getTargetChainId } from '../lib/web3'

export type ChainType = 'flow' | 'evm' | 'none'

export interface UnifiedWalletState {
  /** Which chain(s) the user is connected to */
  chain: ChainType
  /** Preferred display address */
  address: string | null
  /** Flow-specific address */
  flowAddress: string | null
  /** EVM-specific address */
  evmAddress: string | null
  /** Whether any wallet is connected */
  isConnected: boolean
  /** Loading state */
  isLoading: boolean
  /** Whether user is browsing as guest */
  isGuest: boolean
  /** Whether EVM wallet is on the wrong network */
  isWrongNetwork: boolean
  /** Switch EVM wallet to the target network */
  switchToTargetNetwork: () => void
  /** Connect Flow wallet */
  connectFlow: () => Promise<void>
  /** Open RainbowKit modal for EVM wallet connect */
  connectEVM: () => void
  /** Disconnect all wallets */
  disconnect: () => Promise<void>
  /** Continue as guest */
  continueAsGuest: () => void
}

/**
 * Unified auth hook — bridges Flow FCL + wagmi EVM (RainbowKit).
 *
 * Usage:
 *   const { chain, address, isConnected, isWrongNetwork, switchToTargetNetwork } = useUnifiedAuth()
 */
export function useUnifiedAuth(): UnifiedWalletState {
  // Flow auth
  const flowAuth = useFlowAuth()

  // EVM auth via wagmi
  const { address: evmAddress, isConnected: evmConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect: evmDisconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const targetChainId = getTargetChainId()

  // Determine if EVM wallet is on wrong network
  const isWrongNetwork = evmConnected && chainId !== targetChainId

  // Determine overall state
  const chain: ChainType = useMemo(() => {
    if (flowAuth.isLoggedIn && flowAuth.user?.loggedIn) return 'flow'
    if (evmConnected && evmAddress) return 'evm'
    return 'none'
  }, [flowAuth.isLoggedIn, flowAuth.user?.loggedIn, evmConnected, evmAddress])

  const address = useMemo(() => {
    if (chain === 'flow') return flowAuth.walletAddress
    if (chain === 'evm') return evmAddress
    return null
  }, [chain, flowAuth.walletAddress, evmAddress])

  const isConnected = chain !== 'none' || flowAuth.isGuest

  const connectFlow = useCallback(async () => {
    await flowAuth.connectWallet()
  }, [flowAuth])

  const connectEVM = useCallback(() => {
    const injectedConnector = connectors.find(c => c.type === 'injected')
    if (injectedConnector) {
      connect({ connector: injectedConnector, chainId: targetChainId })
    }
  }, [connect, connectors, targetChainId])

  const switchToTargetNetwork = useCallback(() => {
    switchChain({ chainId: targetChainId })
  }, [switchChain, targetChainId])

  const disconnect = useCallback(async () => {
    if (flowAuth.isLoggedIn && flowAuth.user?.loggedIn) {
      await flowAuth.disconnectWallet()
    }
    if (evmConnected) {
      evmDisconnect()
    }
  }, [flowAuth, evmConnected, evmDisconnect])

  const continueAsGuest = useCallback(() => {
    flowAuth.continueAsGuest()
  }, [flowAuth])

  return {
    chain,
    address,
    flowAddress: flowAuth.walletAddress,
    evmAddress: evmAddress ?? null,
    isConnected,
    isLoading: flowAuth.isLoading,
    isGuest: flowAuth.isGuest,
    isWrongNetwork,
    switchToTargetNetwork,
    connectFlow,
    connectEVM,
    disconnect,
    continueAsGuest,
  }
}
