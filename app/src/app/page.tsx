'use client';

import { useAuthContext } from '@/auth/AuthProvider';
import LandingPage from '@/components/LandingPage';
import Dashboard from '@/components/Dashboard';
import { WrongNetworkBanner } from '@/components/WrongNetworkBanner';

export default function Home() {
  const { isConnected, isGuest } = useAuthContext();

  if (!isConnected && !isGuest) return <LandingPage />;

  return (
    <>
      <WrongNetworkBanner />
      <Dashboard />
    </>
  );
}
