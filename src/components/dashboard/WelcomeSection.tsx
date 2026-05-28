import React from 'react';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/lib/sdk';

interface WelcomeSectionProps {
  isGuest: boolean;
  profile: UserProfile | null;
  /** Web3 display name (ENS, Farcaster, etc.) — used when no MagicLens profile exists */
  web3DisplayName?: string | null;
  /** Web3 avatar URL */
  web3AvatarUrl?: string | null;
}

export function WelcomeSection({ isGuest, profile, web3DisplayName, web3AvatarUrl }: WelcomeSectionProps) {
  if (!profile) return null;

  const userTypeLabel =
    profile.user_type === 'both'
      ? 'Artist & Videographer'
      : profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1);

  const userTypeBadgeClass =
    profile.user_type === 'artist'
      ? 'bg-purple-500'
      : profile.user_type === 'videographer'
        ? 'bg-blue-500'
        : 'bg-gradient-to-r from-purple-500 to-blue-500';

  // When we have web3 identity data and no MagicLens profile, use the ENS name
  const displayName = (!isGuest && web3DisplayName) ? web3DisplayName : profile.username;
  const hasWeb3Fallback = !!web3DisplayName && profile.bio === 'Welcome to MagicLens! Update your profile to get started.';

  return (
    <div className="mb-6 md:mb-8">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
        Welcome{!isGuest && `, ${displayName}`}!
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {hasWeb3Fallback ? (
          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">Connected</Badge>
        ) : (
          <Badge className={userTypeBadgeClass}>{userTypeLabel}</Badge>
        )}
        {isGuest && (
          <Badge className="bg-yellow-500 text-black">Guest Mode</Badge>
        )}
      </div>
    </div>
  );
}

