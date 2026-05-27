// Flow authentication hook - replaces generic Web3 auth
import { useState, useEffect, useCallback, useRef } from 'react';
import { fcl, authenticate, unauthenticate, subscribeToUser } from '../lib/flow/fcl-config';
import { STORAGE_KEYS } from '@/lib/constants';

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
  const [isGuest, setIsGuest] = useState(false);
  const loggedInRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUser((currentUser: FlowUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => { unsubscribe(); };
  }, []);

  const loginToBackend = useCallback(async (walletAddress: string) => {
    try {
      const message = `MagicLens Login Request\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const messageHex = Array.from(new TextEncoder().encode(message))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      const signature = await fcl.currentUser.signUserMessage(messageHex);
      const response = await fetch('/api/auth/flow/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: JSON.stringify(signature),
          message,
          message_hex: messageHex,
        }),
      });
      if (!response.ok) throw new Error('Failed to login to backend');
      const data = await response.json();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token);
    } catch (error) {
      console.error('Backend login failed:', error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      await authenticate();
    } catch (error) {
      console.error('Flow wallet connection failed:', error);
      setIsLoading(false);
    }
  }, []);

  // Auto-login to backend when Flow auth succeeds (once per address)
  useEffect(() => {
    if (user.loggedIn && user.addr && loggedInRef.current !== user.addr) {
      loggedInRef.current = user.addr;
      loginToBackend(user.addr);
    }
  }, [user.loggedIn, user.addr, loginToBackend]);

  const disconnectWallet = useCallback(async () => {
    try {
      await unauthenticate();
      setIsGuest(false);
      loggedInRef.current = null;
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Flow wallet disconnection failed:', error);
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoggedIn: user.loggedIn || isGuest,
    isGuest,
    walletAddress: user.addr,
    isLoading,
    connectWallet,
    disconnectWallet,
    continueAsGuest,
  };
}