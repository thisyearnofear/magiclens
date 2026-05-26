import type { CrossVMPromotion, IconicMomentCheck } from '@/types/crossvm';
import { DEMO_ICONIC_MOMENTS } from '@/lib/demo-data';
import { STORAGE_KEYS } from '@/lib/constants';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(input, init);
    return res;
  } catch {
    return null;
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
  });
  if (!res) {
    return getFallbackPromotion(params);
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
  });
  if (!res) return DEMO_ICONIC_MOMENTS as CrossVMPromotion[];
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch iconic moments');
  return data.iconic_moments;
}

export async function checkIconicStatus(day: number, tokenId: number): Promise<IconicMomentCheck> {
  const res = await safeFetch(`${API_BASE}/api/crossvm/check/${day}/${tokenId}`, {
    headers: getAuthHeaders(),
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
  });
  return res ? res.json() : { success: false, error: 'Backend unavailable' };
}

export async function triggerAutoPromote(day: number) {
  const res = await safeFetch(`${API_BASE}/api/leaderboard/process-day/${day}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res ? res.json() : { success: false, error: 'Backend unavailable' };
}

export async function getLeaderboardDayStatus(day: number) {
  const res = await safeFetch(`${API_BASE}/api/leaderboard/day-status/${day}`, {
    headers: getAuthHeaders(),
  });
  return res ? res.json() : { success: false, error: 'Backend unavailable' };
}

export async function getPendingPromoteDays() {
  const res = await safeFetch(`${API_BASE}/api/leaderboard/pending-days`, {
    headers: getAuthHeaders(),
  });
  return res ? res.json() : { success: false, pending_days: [] };
}

// ── Fallback ─────────────────────────────────────────────────────────

function getFallbackPromotion(params: {
  xlayerTokenId: number;
  title: string;
  day?: number;
  rank: number;
}): CrossVMPromotion {
  return {
    id: `demo-promo-${Date.now()}`,
    xlayer_token_id: params.xlayerTokenId,
    xlayer_tx_hash: 'demo-' + '0'.repeat(64),
    xlayer_creator_address: '0x0000',
    title: params.title,
    overlay_ids: '',
    day: params.day || 1,
    rank: params.rank,
    flow_nft_id: 9999,
    flow_tx_hash: 'demo-flow-' + '0'.repeat(64),
    flow_minted_at: new Date().toISOString(),
    promoted_by: 'system',
    status: 'minted',
    created_at: new Date().toISOString(),
  };
}
