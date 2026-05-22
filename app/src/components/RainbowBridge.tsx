'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect } from 'react'

/**
 * RainbowBridge — stores RainbowKit's openConnectModal globally
 * so ConnectWallet can trigger EVM wallet connect from anywhere.
 *
 * Placed once in the provider tree, hidden (renders nothing visible).
 */
export function RainbowBridge() {
  return (
    <ConnectButton.Custom>
      {({ openConnectModal }) => <BridgeHandler openConnectModal={openConnectModal} />}
    </ConnectButton.Custom>
  )
}

function BridgeHandler({ openConnectModal }: { openConnectModal: () => void }) {
  useEffect(() => {
    (window as any).__openEVMConnect = openConnectModal

    // Also listen for the custom event as a fallback
    const handler = () => openConnectModal()
    document.addEventListener('magiclens:connect-evm', handler)
    return () => {
      delete (window as any).__openEVMConnect
      document.removeEventListener('magiclens:connect-evm', handler)
    }
  }, [openConnectModal])

  return null
}
