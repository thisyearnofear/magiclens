'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink } from 'lucide-react';
import { type Web3ProfileResult, getShortDisplayName } from '@/hooks/useWeb3Profile';

interface Web3IdentitiesProps {
  web3: Web3ProfileResult;
  walletAddress?: string | null;
  /** Show all identity badges inline (default: compact row) */
  layout?: 'compact' | 'full';
}

const PLATFORM_META: Record<string, { label: string; color: string; icon: string }> = {
  ens:       { label: 'ENS',       color: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30', icon: '𝐄' },
  farcaster: { label: 'Farcaster', color: 'bg-purple-500/20 text-purple-300 border-purple-400/30', icon: '𝐅' },
  lens:      { label: 'Lens',      color: 'bg-green-500/20 text-green-300 border-green-400/30',    icon: '𝐋' },
  basenames: { label: 'Base',      color: 'bg-blue-500/20 text-blue-300 border-blue-400/30',       icon: '𝐁' },
};

export function Web3Identities({ web3, walletAddress, layout = 'compact' }: Web3IdentitiesProps) {
  const platforms = [
    web3.ens && { key: 'ens', profile: web3.ens },
    web3.farcaster && { key: 'farcaster', profile: web3.farcaster },
    web3.lens && { key: 'lens', profile: web3.lens },
    web3.basenames && { key: 'basenames', profile: web3.basenames },
  ].filter(Boolean) as { key: string; profile: NonNullable<Web3ProfileResult['ens']> }[];

  if (platforms.length === 0 && !web3.avatarUrl) return null;

  const shortName = getShortDisplayName(walletAddress, web3.displayName);

  if (layout === 'compact') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {web3.avatarUrl && (
          <Avatar className="h-8 w-8 border-2 border-white/20">
            <AvatarImage src={web3.avatarUrl} alt={shortName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
              {shortName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <span className="text-white font-medium text-sm truncate max-w-[160px]">
          {shortName}
        </span>
        {platforms.map(({ key, profile }) => {
          const meta = PLATFORM_META[key] ?? { label: key, color: 'bg-gray-500/20 text-gray-300 border-gray-400/30', icon: '?' };
          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`${meta.color} text-[10px] px-1.5 py-0 leading-none cursor-help`}>
                    {meta.icon}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 border border-white/10 text-white text-xs">
                  <p className="font-medium">{profile.displayName || profile.identity}</p>
                  <p className="text-gray-400">{meta.label}</p>
                  {Object.entries(profile.links).slice(0, 3).map(([lk, lv]) => (
                    <a key={lk} href={lv.link} target="_blank" rel="noopener noreferrer"
                       className="block text-blue-400 hover:text-blue-300 truncate max-w-[200px]">
                      {lk}: {lv.handle} ↗
                    </a>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }


  // Full layout
  return (
    <div className="space-y-3">
      {/* Avatar + Name row */}
      <div className="flex items-center gap-3">
        {web3.avatarUrl && (
          <Avatar className="h-14 w-14 border-2 border-white/20">
            <AvatarImage src={web3.avatarUrl} alt={shortName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
              {shortName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <p className="text-white font-bold text-lg">{shortName}</p>
          {walletAddress && (
            <p className="text-gray-400 text-xs font-mono">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</p>
          )}
        </div>
      </div>

      {/* Platform cards */}
      <div className="flex flex-wrap gap-2">
        {platforms.map(({ key, profile }) => {
          const meta = PLATFORM_META[key] ?? { label: key, color: 'bg-gray-500/20 text-gray-300 border-gray-400/30', icon: '?' };
          return (
            <div key={key}
                 className={`${meta.color} rounded-lg border px-3 py-2 min-w-[140px]`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-bold">{meta.icon}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">{meta.label}</span>
              </div>
              <p className="text-sm font-medium truncate">{profile.displayName || profile.identity}</p>
              {profile.description && (
                <p className="text-xs opacity-70 mt-0.5 line-clamp-2">{profile.description}</p>
              )}
              {profile.social?.follower > 0 && (
                <p className="text-[10px] opacity-60 mt-1">
                  {profile.social.follower.toLocaleString()} followers
                </p>
              )}
              {Object.entries(profile.links).slice(0, 2).map(([lk, lv]) => (
                <a key={lk} href={lv.link} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mt-0.5">
                  <ExternalLink className="h-3 w-3" />
                  {lk}
                </a>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
