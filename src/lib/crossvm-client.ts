import type { CrossVMPromotion, IconicMomentCheck } from '@/types/crossvm';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('magiclens_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
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
  const res = await fetch(`${API_BASE}/api/crossvm/promote`, {
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
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Promotion failed');
  return data.iconic_moment;
}

export async function getIconicMoments(day?: number, status?: string): Promise<CrossVMPromotion[]> {
  const params = new URLSearchParams();
  if (day !== undefined) params.set('day', String(day));
  if (status) params.set('status', status);
  const res = await fetch(`${API_BASE}/api/crossvm/iconic_moments?${params}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch iconic moments');
  return data.iconic_moments;
}

export async function checkIconicStatus(day: number, tokenId: number): Promise<IconicMomentCheck> {
  const res = await fetch(`${API_BASE}/api/crossvm/check/${day}/${tokenId}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to check iconic status');
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
  const res = await fetch(`${API_BASE}/api/leaderboard/close-day`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ day, entries }),
  });
  return res.json();
}

export async function triggerAutoPromote(day: number) {
  const res = await fetch(`${API_BASE}/api/leaderboard/process-day/${day}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function getLeaderboardDayStatus(day: number) {
  const res = await fetch(`${API_BASE}/api/leaderboard/day-status/${day}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function getPendingPromoteDays() {
  const res = await fetch(`${API_BASE}/api/leaderboard/pending-days`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}
