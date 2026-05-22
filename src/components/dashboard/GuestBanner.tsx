import React from 'react';
import { Button } from '@/components/ui/button';

interface GuestBannerProps {
  onConnect: () => void;
}

export function GuestBanner({ onConnect }: GuestBannerProps) {
  return (
    <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-yellow-400/20 to-purple-400/20 border border-yellow-400/30">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">Guest Mode</h3>
          <p className="text-gray-300 text-sm">
            Explore MagicLens features. Connect your Flow wallet to unlock full platform capabilities.
          </p>
        </div>
        <Button
          onClick={onConnect}
          className="bg-yellow-400 text-black hover:bg-yellow-500 whitespace-nowrap"
        >
          Connect Wallet
        </Button>
      </div>
    </div>
  );
}
