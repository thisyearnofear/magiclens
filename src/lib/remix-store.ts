import { STORAGE_KEYS } from '@/lib/constants';

const STORAGE_KEY = STORAGE_KEYS.USER_REMIXES;

export interface Remix {
  title: string;
  txHash: string;
  creator: string;
  votes: number;
  createdAt: number;
}

export function addRemix(remix: { title: string; txHash: string; creator: string }): void {
  const existing = getUserRemixes();
  const newRemix: Remix = {
    ...remix,
    votes: Math.floor(Math.random() * 1501) + 500, // 500-2000
    createdAt: Date.now(),
  };
  existing.push(newRemix);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage may be unavailable (SSR, private mode, quota)
  }
}

export function getUserRemixes(): Remix[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Remix[];
  } catch {
    return [];
  }
}
