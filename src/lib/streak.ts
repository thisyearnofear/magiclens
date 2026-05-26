import type { Remix } from './remix-store';

const MS_PER_DAY = 86400000;

export function getDayId(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

export function computeStreak(remixes: Remix[]): {
  current: number;
  longest: number;
  todayMinted: boolean;
  dayIds: string[];
} {
  if (remixes.length === 0) {
    return { current: 0, longest: 0, todayMinted: false, dayIds: [] };
  }

  const uniqueDays = new Set<string>();
  for (const r of remixes) {
    uniqueDays.add(getDayId(new Date(r.createdAt)));
  }

  const sorted = Array.from(uniqueDays).sort().reverse();
  const today = getDayId();
  const yesterday = getDayId(new Date(Date.now() - MS_PER_DAY));

  let current = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = daysBetween(prev, curr);
      if (diff <= 1) {
        current++;
      } else {
        break;
      }
    }
  }

  let longest = 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    if (daysBetween(prev, curr) <= 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak);

  return {
    current,
    longest,
    todayMinted: sorted[0] === today,
    dayIds: sorted,
  };
}

export const STREAK_BADGES = [
  { days: 3, label: 'Streaker Lv.1', icon: '🔥', color: 'text-orange-400' },
  { days: 7, label: 'Streaker Lv.2', icon: '🔥', color: 'text-orange-500' },
  { days: 14, label: 'Streaker Lv.3', icon: '🔥', color: 'text-red-400' },
  { days: 30, label: 'Streaker Lv.4', icon: '💎', color: 'text-purple-400' },
] as const;

export function getStreakBadge(current: number) {
  let badge = null;
  for (const b of STREAK_BADGES) {
    if (current >= b.days) badge = b;
  }
  return badge;
}
