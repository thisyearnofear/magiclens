import React from 'react'
import { useAuthContext } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

/**
 * WrongNetworkBanner — shown when the user's EVM wallet is connected
 * to a chain other than the configured X Layer network.
 */
export function WrongNetworkBanner() {
  const { isWrongNetwork, switchToTargetNetwork, chain } = useAuthContext()

  if (!isWrongNetwork || chain !== 'evm') return null

  return (
    <div className="w-full bg-red-500/10 border-b border-red-500/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            Wrong network detected. Please switch to{' '}
            <strong>X Layer{import.meta.env.VITE_XLAYER_NETWORK === 'mainnet' ? ' Mainnet' : ' Testnet'}</strong>
            {' '}to mint remixes and claim rewards.
          </span>
        </div>
        <Button
          onClick={switchToTargetNetwork}
          size="sm"
          variant="outline"
          className="border-red-400/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 whitespace-nowrap"
        >
          Switch Network
        </Button>
      </div>
    </div>
  )
}
