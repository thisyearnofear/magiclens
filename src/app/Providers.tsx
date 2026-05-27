'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/web3/wagmi-config';
import { AuthProvider } from '@/auth/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { RainbowBridge } from '@/components/RainbowBridge';
import { ActionActivityDrawer } from '@/components/ActionActivityDrawer';
import { Toaster } from '@/components/ui/sonner';
import SystemErrorBoundary from '@/SystemErrorBoundary';
import '@/lib/flow/fcl-config';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
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
          <ThemeProvider>
            <AuthProvider>
              <SystemErrorBoundary viewName="App">
                {children}
              </SystemErrorBoundary>
              <RainbowBridge />
              <ActionActivityDrawer />
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
