// Flow authentication hook - replaces generic Web3 auth
import { useState, useEffect, useCallback } from 'react';
import { fcl, authenticate, unauthenticate, subscribeToUser } from '../lib/flow/fcl-config';

interface FlowUser {
  addr: string | null;
  loggedIn: boolean;
  cid: string | null;
  expiresAt: number | null;
  services: any[];
}

export function useFlowAuth() {
  const [user, setUser] = useState<FlowUser>({
    addr: null,
    loggedIn: false,
    cid: null,
    expiresAt: null,
    services: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to FCL user state changes
    const unsubscribe = subscribeToUser((currentUser: FlowUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      await authenticate();
      // User state will be updated via subscription
    } catch (error) {
      console.error('Flow wallet connection failed:', error);
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await unauthenticate();
      // User state will be updated via subscription
    } catch (error) {
      console.error('Flow wallet disconnection failed:', error);
    }
  }, []);

  return {
    user,
    isLoggedIn: user.loggedIn,
    walletAddress: user.addr,
    isLoading,
    connectWallet,
    disconnectWallet,
  };
}