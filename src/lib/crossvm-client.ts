import type { CrossVMPromotion, IconicMomentCheck } from '@/types/crossvm';
import { DEMO_ICONIC_MOMENTS } from '@/lib/demo-data';
import { STORAGE_KEYS } from '@/lib/constants';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const DEFAULT_TIMEOUT_MS = 20_000;

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), init?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const fetchInit = { ...(init ?? {}) };
  delete fetchInit.timeoutMs;
  const signal = fetchInit.signal;
  delete fetchInit.signal;
  try {
    const res = await fetch(input, {
      ...fetchInit,
      signal: signal ?? controller.signal,
    });
    return res;
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function readJson<T extends Record<string, unknown>>(res: Response | null, fallback: T): Promise<any> {
  if (!res) return fallback;
  try {
    const data = await res.json();
    if (!res.ok && typeof data?.error === 'string') {
      return { ...fallback, success: false, error: data.error };
    }
    return data;
  } catch {
    return { ...fallback, success: false, error: 'Invalid backend response' };
  }
}

export async function promoteToIconic(params: {
  xlayerTokenId: number;
  xlayerTxHash: string;
  xlayerCreatorAddress: string;
  title: string;
  overlayIds?: string;
  day?: number;
  rank: number;
  promotedBy?: string;
}): Promise<CrossVMPromotion> {
  const res = await safeFetch(`${API_BASE}/api/crossvm/promote`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      xlayer_token_id: params.xlayerTokenId,
      xlayer_tx_hash: params.xlayerTxHash,
      xlayer_creator_address: params.xlayerCreatorAddress,
      title: params.title,
      overlay_ids: params.overlayIds || '',
      day: params.day || 1,
      rank: params.rank,
      promoted_by: params.promotedBy || 'system',
    }),
    timeoutMs: 120_000,
  });
  if (!res) {
    throw new Error('Backend unavailable');
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Promotion failed');
  return data.iconic_moment;
}

export async function getIconicMoments(day?: number, status?: string): Promise<CrossVMPromotion[]> {
  const params = new URLSearchParams();
  if (day !== undefined) params.set('day', String(day));
  if (status) params.set('status', status);
  const res = await safeFetch(`${API_BASE}/api/crossvm/iconic_moments?${params}`, {
    headers: getAuthHeaders(),
    timeoutMs: 15_000,
  });
  if (!res) return DEMO_ICONIC_MOMENTS as CrossVMPromotion[];
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch iconic moments');
  return data.iconic_moments;
}

export async function checkIconicStatus(day: number, tokenId: number): Promise<IconicMomentCheck> {
  const res = await safeFetch(`${API_BASE}/api/crossvm/check/${day}/${tokenId}`, {
    headers: getAuthHeaders(),
    timeoutMs: 15_000,
  });
  if (!res) return { isIconic: false, iconicMoment: null };
  const data = await res.json();
  if (!data.success) return { isIconic: false, iconicMoment: null };
  return { isIconic: data.is_iconic, iconicMoment: data.iconic_moment };
}

// ── Leaderboard Cycle Management ─────────────────────────────────────

interface LeaderboardEntryInput {
  rank: number;
  title: string;
  creator: string;
  votes: number;
  reward?: string;
  xlayer_token_id: number;
  xlayer_tx_hash: string;
  xlayer_creator_address: string;
}

export async function closeLeaderboardDay(day: number, entries: LeaderboardEntryInput[]) {
  const res = await safeFetch(`${API_BASE}/api/leaderboard/close-day`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ day, entries }),
    timeoutMs: 30_000,
  });
  return readJson(res, { success: false, error: 'Backend unavailable' });
}

export async function triggerAutoPromote(day: number) {
  const res = await safeFetch(`${API_BASE}/api/leaderboard/process-day/${day}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    timeoutMs: 120_000,
  });
  return readJson(res, { success: false, error: 'Backend unavailable' });
}

export async function getLeaderboardDayStatus(day: number): Promise<{
  success: boolean;
  error?: string;
  day_status?: {
    day: number;
    status: 'open' | 'closed' | 'promoting' | 'completed';
    closed_at?: string;
    completed_at?: string;
    entries?: Array<{
      rank: number;
      title: string;
      creator: string;
      votes: number;
      reward?: string;
      xlayer_token_id: number;
      xlayer_tx_hash: string;
      xlayer_creator_address: string;
      iconic_status?: string | null;
      flow_nft_id?: string | null;
      flow_tx_hash?: string | null;
    }>;
  };
}> {
  const res = await safeFetch(`${API_BASE}/api/leaderboard/day-status/${day}`, {
    headers: getAuthHeaders(),
    timeoutMs: 15_000,
  });
  return readJson(res, { success: false, error: 'Backend unavailable' });
}

export async function getPendingPromoteDays() {
  const res = await safeFetch(`${API_BASE}/api/leaderboard/pending-days`, {
    headers: getAuthHeaders(),
    timeoutMs: 15_000,
  });
  return readJson(res, { success: false, pending_days: [] });
}

export async function seedDemoData(): Promise<{
  success: boolean;
  day?: number;
  promoted?: number;
  errors?: string[];
  iconic_moments?: CrossVMPromotion[];
  error?: string;
}> {
  const res = await safeFetch(`${API_BASE}/api/demo/seed`, {
    method: 'POST',
    headers: getAuthHeaders(),
    timeoutMs: 120_000,
  });
  return readJson(res, { success: false, error: 'Backend unavailable' });
}

// ── Fallback ─────────────────────────────────────────────────────────

// ── Referral API ─────────────────────────────────────────────────────

export async function claimReferral(params: {
  referrerAddress: string;
  refereeAddress: string;
  day?: number;
  xlayerTokenId: number;
  xlayerTxHash: string;
}): Promise<{ success: boolean; bonus_votes?: number; total_referrals?: number; error?: string }> {
  const res = await safeFetch(`${API_BASE}/api/referral/claim`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      referrer_address: params.referrerAddress,
      referee_address: params.refereeAddress,
      day: params.day || 1,
      xlayer_token_id: params.xlayerTokenId,
      xlayer_tx_hash: params.xlayerTxHash,
    }),
    timeoutMs: 30_000,
  });
  return readJson(res, { success: false, error: 'Backend unavailable' });
}

export async function getReferralStats(address: string): Promise<{
  success: boolean;
  stats?: {
    total_claims: number;
    days_with_claims: number;
    total_bonus_votes: number;
    times_referred: number;
    recent_claims: Array<{ day: number; referee: string; bonus_votes: number; claimed_at: string | null }>;
  };
  error?: string;
}> {
  const res = await safeFetch(`${API_BASE}/api/referral/stats/${address}`, {
    headers: getAuthHeaders(),
    timeoutMs: 15_000,
  });
  return readJson(res, { success: false, error: 'Backend unavailable' });
}
