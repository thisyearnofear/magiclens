'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuthContext } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, User, ChevronDown, ArrowRightLeft, AlertTriangle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ConnectWallet — single button that unifies EVM (RainbowKit) + Flow (FCL) wallet connection.
 *
 * - Disconnected: shows "Connect Wallet" → dropdown with EVM / Flow / Guest options
 * - Connected to one chain: shows wallet address + chain badge
 * - Connected to both: shows primary chain + indicator
 * - Wrong EVM network: shows switch prompt
 */
export function ConnectWallet() {
  const {
    chain,
    address,
    flowAddress,
    evmAddress,
    isConnected,
    isWrongNetwork,
    isLoading,
    isGuest,
    connectFlow,
    disconnect,
    continueAsGuest,
  } = useAuthContext()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Connected state ──────────────────────────────────────────────
  if (isConnected && !isGuest) {
    return (
      <div className="relative" ref={ref}>
        <Button
          onClick={() => setOpen(!open)}
          variant="secondary"
          size="sm"
          className={cn(
            'bg-white/10 text-white hover:bg-white/20 border border-white/20 flex items-center gap-2',
            isWrongNetwork && 'border-red-400/40 bg-red-500/10'
          )}
        >
          {isWrongNetwork ? (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          ) : (
            <Wallet className="h-4 w-4 text-yellow-400" />
          )}
          <span className="hidden sm:inline">
            {formatAddress(address || '')}
          </span>
          <span className={cn(
            'text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded',
            chain === 'flow' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
          )}>
            {chain === 'flow' ? 'FLOW' : 'EVM'}
          </span>
          <ChevronDown className="h-3 w-3 text-white/50" />
        </Button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-16px)] rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs text-gray-400 mb-1">Connected wallets</p>
              <div className="space-y-2">
                {chain === 'evm' || chain === 'flow' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className={cn(
                        'h-4 w-4', chain === 'evm' ? 'text-yellow-400' : 'text-blue-400'
                      )} />
                      <span className="text-sm text-white">
                        {chain === 'evm' ? 'EVM' : 'Flow'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatAddress(address || '')}
                    </span>
                  </div>
                ) : null}

                {/* Show secondary chains: if both EVM+Flow connected but chain shows 'evm' */}
                {chain === 'evm' && flowAddress && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-white">Flow</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatAddress(flowAddress)}
                    </span>
                  </div>
                )}
                {chain === 'flow' && evmAddress && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-white">EVM</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatAddress(evmAddress)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Wrong network warning */}
            {isWrongNetwork && (
              <div className="px-4 py-2 bg-red-500/10 border-b border-red-400/20">
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Switch to X Layer to mint & earn
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="p-2">
              {chain === 'evm' && !flowAddress && (
                <button
                  onClick={() => { connectFlow(); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Connect Flow Wallet (premium NFTs)
                </button>
              )}
              {chain === 'flow' && !evmAddress && (
                <button
                  onClick={() => { handleEVMConnect(); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Connect OKX / EVM Wallet (mint & earn)
                </button>
              )}
              <button
                onClick={() => { disconnect(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Disconnect all wallets
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Guest state ──────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 hidden sm:inline">Guest</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            disconnect()
            continueAsGuest()
          }}
          className="text-white hover:bg-white/10"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // ── Disconnected state ───────────────────────────────────────────
  return (
    <div className="relative" ref={ref}>
      <Button
        onClick={() => setOpen(!open)}
        size="sm"
        className="bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-16px)] rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 space-y-1">
            <WalletOption
              icon={<Zap className="h-4 w-4 text-yellow-400" />}
              label="EVM Wallet"
              description="OKX, MetaMask, WalletConnect"
              hint="Mint remixes on X Layer, earn USDT rewards, climb the leaderboard"
              onClick={() => { handleEVMConnect(); setOpen(false) }}
            />
            <WalletOption
              icon={<Wallet className="h-4 w-4 text-blue-400" />}
              label="Flow Wallet"
              description="Lilico, Blocto, Flow Port"
              hint="Mint premium Iconic Moment NFTs with gasless transactions"
              onClick={() => { connectFlow(); setOpen(false) }}
            />
          </div>
          <div className="border-t border-white/10 p-2">
            <button
              onClick={() => { continueAsGuest(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <User className="h-4 w-4" />
              Continue as Guest
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Small helper: wallet option row inside the dropdown */
function WalletOption({
  icon,
  label,
  description,
  hint,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  hint?: string
  onClick: () => void
}) {
  const [showHint, setShowHint] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
      >
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white">{label}</span>
            {hint && (
              <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors cursor-help">ⓘ</span>
            )}
          </div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
      </button>
      {showHint && hint && (
        <div className="absolute left-0 right-0 top-full mt-1 px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-xs text-gray-300 shadow-xl z-10">
          {hint}
        </div>
      )}
    </div>
  )
}

/**
 * Opens the RainbowKit connect modal for EVM wallets.
 * We use dynamic import to avoid importing RainbowKit statically here.
 */
function handleEVMConnect() {
  // RainbowKit stores its connect function in window via the Provider.
  // The simplest trigger: programmatically click a hidden RainbowKit button.
  // We dispatch a custom event that RainbowKit listens for.
  // Fallback: try window.rainbowKitOpenConnectModal if available.
  if (typeof window !== 'undefined') {
    // Trigger via a globally stored reference set by a RainbowKit.Custom button
    const openFn = (window as any).__openEVMConnect
    if (typeof openFn === 'function') {
      openFn()
      return
    }
    // Fallback: emit a click on any RainbowKit button in the page
    const rkBtn = document.querySelector('[data-rk-wallet-button]')
    if (rkBtn) {
      ;(rkBtn as HTMLButtonElement).click()
      return
    }
    // Last resort: patch — dispatch a custom event handled by a hidden bridge
    document.dispatchEvent(new CustomEvent('magiclens:connect-evm'))
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function formatAddress(addr: string | null): string {
  if (!addr) return ''
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
