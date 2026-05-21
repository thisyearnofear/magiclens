import React from 'react';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/lib/sdk';

interface WelcomeSectionProps {
  isGuest: boolean;
  profile: UserProfile | null;
}

export function WelcomeSection({ isGuest, profile }: WelcomeSectionProps) {
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

  return (
    <div className="mb-6 md:mb-8">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
        Welcome{!isGuest && `, ${profile.username}`}!
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={userTypeBadgeClass}>{userTypeLabel}</Badge>
        {isGuest && (
          <Badge className="bg-yellow-500 text-black">Guest Mode</Badge>
        )}
        {!isGuest &&
          profile.bio === 'Welcome to MagicLens! Update your profile to get started.' && (
            <Badge className="bg-orange-500 text-white">
              New User - Update Profile
            </Badge>
          )}
      </div>
    </div>
  );
}
