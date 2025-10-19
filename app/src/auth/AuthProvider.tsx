import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
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
  isGuest: boolean;
  walletAddress: string | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  login: () => Promise<void>;
  continueAsGuest: () => void;
  // Add function to check if token is valid
  isTokenValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const flowAuth = useFlowAuth();
  const [tokenValid, setTokenValid] = useState(true);

  // Log the flowAuth values for debugging
  useEffect(() => {
    console.log('AuthProvider - flowAuth values:', flowAuth);
  }, [flowAuth]);

  // Add login alias for connectWallet
  const authValue = {
    ...flowAuth,
    login: flowAuth.connectWallet,
    isTokenValid: () => {
      const token = localStorage.getItem('magiclens_token');
      if (!token) return false;
      
      try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp > currentTime;
      } catch (error) {
        return false;
      }
    }
  };

  return (
    <AuthContext.Provider value={authValue}>
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