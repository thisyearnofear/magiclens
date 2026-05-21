import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from './wagmi-config'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

interface Web3ProviderProps {
  children: React.ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme(),
            darkMode: darkTheme({
              accentColor: '#7c3aed',
              accentColorForeground: 'white',
              borderRadius: 'small',
              fontStack: 'system',
              overlayBlur: 'small',
            }),
          }}
          coolMode
          appInfo={{
            appName: 'MagicLens',
            learnMoreUrl: 'https://magiclens.app',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
