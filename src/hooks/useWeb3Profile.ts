'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Web3.bio API response shape per platform.
 */
export interface Web3BioProfile {
  address: string;
  identity: string;           // e.g. "vitalik.eth", "dwr.eth"
  platform: 'ens' | 'farcaster' | 'lens' | 'basenames' | 'linea' | 'sns';
  displayName: string;
  avatar: string | null;
  description: string | null;
  header: string | null;
  email: string | null;
  location: string | null;
  contenthash: string | null;
  links: Record<string, { link: string; handle: string; sources: string[] }>;
  social: {
    uid: number | null;
    follower: number;
    following: number;
  };
}

export interface Web3ProfileResult {
  ens: Web3BioProfile | null;
  farcaster: Web3BioProfile | null;
  lens: Web3BioProfile | null;
  basenames: Web3BioProfile | null;
  /** Best display name: ENS > Farcaster > Lens > truncated address */
  displayName: string;
  /** Best avatar: ENS avatar > Farcaster > Lens */
  avatarUrl: string | null;
  /** Best bio: Farcaster > ENS > Lens */
  bio: string | null;
  /** Combined social links */
  links: Record<string, { link: string; handle: string }>;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
}

const WEB3_BIO_API = 'https://api.web3.bio/profile';

const profileCache = new Map<string, Web3ProfileResult>();

function pickBest<T>(items: (T | null)[]): T | null {
  for (const item of items) {
    if (item != null) return item;
  }
  return null;
}

export function useWeb3Profile(addressOrEns: string | null | undefined) {
  const [result, setResult] = useState<Web3ProfileResult>({
    ens: null,
    farcaster: null,
    lens: null,
    basenames: null,
    displayName: '',
    avatarUrl: null,
    bio: null,
    links: {},
    loading: false,
    error: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const id = (addressOrEns ?? '').trim().toLowerCase();

    if (!id) {
      setResult(prev => ({ ...prev, loading: false, error: null }));
      return;
    }

    // Check cache
    const cached = profileCache.get(id);
    if (cached) {
      setResult(cached);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const url = `${WEB3_BIO_API}/${encodeURIComponent(addressOrEns!)}`;
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Web3.bio API responded with ${res.status}`);
        }

        const data: Web3BioProfile[] = await res.json();

        if (cancelled) return;

        // Parse platforms
        const ens = data.find(p => p.platform === 'ens') ?? null;
        const farcaster = data.find(p => p.platform === 'farcaster') ?? null;
        const lens = data.find(p => p.platform === 'lens') ?? null;
        const basenames = data.find(p => p.platform === 'basenames') ?? null;

        // Best-effort display name: ENS > Farcaster > Lens > raw address
        const displayName = pickBest([
          ens?.identity,
          ens?.displayName,
          farcaster?.displayName,
          lens?.displayName,
          basenames?.displayName,
          null,
        ]) || '';

        // Best avatar
        const avatarUrl = pickBest([
          ens?.avatar,
          farcaster?.avatar,
          lens?.avatar,
          basenames?.avatar,
        ]);

        // Best bio
        const bio = pickBest([
          farcaster?.description,
          ens?.description,
          lens?.description,
        ]);

        // Collect links
        const links: Record<string, { link: string; handle: string }> = {};
        for (const p of [ens, farcaster, lens].filter(Boolean)) {
          if (!p) continue;
          for (const [key, val] of Object.entries(p.links)) {
            if (!links[key]) {
              links[key] = { link: val.link, handle: val.handle };
            }
          }
        }

        const profileResult: Web3ProfileResult = {
          ens, farcaster, lens, basenames,
          displayName, avatarUrl, bio, links,
          loading: false, error: null,
        };

        // Cache for 5 minutes
        profileCache.set(id, profileResult);
        setTimeout(() => profileCache.delete(id), 300_000);

        if (mountedRef.current) {
          setResult(profileResult);
        }
      } catch (err: any) {
        if (cancelled) return;
        const errorMsg = err?.name === 'AbortError' ? 'Request timed out' : err?.message ?? 'Unknown error';
        if (mountedRef.current) {
          setResult(prev => ({ ...prev, loading: false, error: errorMsg }));
        }
      }
    };

    fetchProfile();

    return () => { cancelled = true; };
  }, [addressOrEns]);

  return result;
}

/**
 * Get a short display name for use in headers / badges.
 * Falls back to truncated address.
 */
export function getShortDisplayName(addressOrEns: string | null | undefined, web3Name?: string): string {
  const name = web3Name?.trim();
  if (name) return name;
  if (!addressOrEns) return 'Guest';
  const addr = addressOrEns.trim();
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
