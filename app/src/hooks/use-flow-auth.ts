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
  const [isGuest, setIsGuest] = useState(false);

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

  const loginToBackend = useCallback(async (walletAddress: string) => {
    try {
      // Create a message to sign
      const message = `MagicLens Login Request\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      // Request signature from the wallet
      const signature = await fcl.currentUser.signUserMessage(message);
      
      // Send wallet address and signature to backend
      const response = await fetch('/api/auth/flow/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: JSON.stringify(signature), // Send the actual signature
          message: message, // Send the message that was signed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to login to backend');
      }

      const data = await response.json();
      
      // Store the JWT token in localStorage
      localStorage.setItem('magiclens_token', data.access_token);
      
      console.log('Successfully logged in to backend with real signature verification');
    } catch (error) {
      console.error('Backend login failed:', error);
      // Even if backend login fails, we can still proceed with Flow auth
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      await authenticate();
      // User state will be updated via subscription
      
      // After successful Flow authentication, login to our backend
      // We'll get the wallet address from the subscription callback
    } catch (error) {
      console.error('Flow wallet connection failed:', error);
      setIsLoading(false);
    }
  }, []);

  // Update the subscription to automatically login to backend
  useEffect(() => {
    if (user.loggedIn && user.addr) {
      // Login to backend when Flow authentication is successful
      loginToBackend(user.addr);
    }
  }, [user.loggedIn, user.addr, loginToBackend]);

  const disconnectWallet = useCallback(async () => {
    try {
      await unauthenticate();
      setIsGuest(false);
      // Remove JWT token from localStorage
      localStorage.removeItem('magiclens_token');
      // User state will be updated via subscription
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