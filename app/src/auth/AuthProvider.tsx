import React, { createContext, useContext, ReactNode } from 'react';
import { useFlowAuth } from '../hooks/use-flow-auth';

interface AuthContextType {
  user: {
    addr: string | null;
    loggedIn: boolean;
    cid: string | null;
    expiresAt: number | null;
    services: any[];
  };
  isLoggedIn: boolean;
  walletAddress: string | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const flowAuth = useFlowAuth();

  return (
    <AuthContext.Provider value={flowAuth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Components for conditional rendering
export function SignedIn({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuthContext();
  return isLoggedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuthContext();
  return !isLoggedIn ? <>{children}</> : null;
}