import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Zap, DollarSign } from 'lucide-react';
import { getUserRemixes } from '@/lib/remix-store';

const DEMO_LEADERBOARD = [
  { rank: 1, title: 'Argentina Goal Messi', creator: '@fan42', votes: 2847, reward: '$30 USDT', color: 'text-yellow-400' },
  { rank: 2, title: 'Mbappé Hat-trick Celebration', creator: '@edit_pro', votes: 2102, reward: '$20 USDT', color: 'text-gray-300' },
  { rank: 3, title: 'Trophy Lift Celebration', creator: '@arlab', votes: 1893, reward: '$12 USDT', color: 'text-amber-600' },
  { rank: 4, title: 'Goalkeeper Save Compilation', creator: '@goal_den', votes: 1456, reward: '$8 USDT', color: 'text-gray-400' },
  { rank: 5, title: 'Free Kick Masterclass', creator: '@kick_master', votes: 1234, reward: '$7 USDT', color: 'text-gray-400' },
  { rank: 6, title: 'Fan Celebration in Streets', creator: '@fan_cam', votes: 987, reward: '$6 USDT', color: 'text-gray-400' },
  { rank: 7, title: 'Penalty Shootout Drama', creator: '@drama_edit', votes: 876, reward: '$5 USDT', color: 'text-gray-400' },
  { rank: 8, title: 'Half-time Show Highlights', creator: '@showtime', votes: 765, reward: '$5 USDT', color: 'text-gray-400' },
  { rank: 9, title: 'Referee Call Analysis', creator: '@ref_review', votes: 654, reward: '$3.50 USDT', color: 'text-gray-400' },
  { rank: 10, title: 'Post-match Interview Remix', creator: '@interview', votes: 543, reward: '$3.50 USDT', color: 'text-gray-400' },
];

const RANK_BADGES: Record<number, { icon: React.ReactNode; className: string }> = {
  1: { icon: <Trophy className="h-5 w-5" />, className: 'bg-yellow-400 text-black' },
  2: { icon: <Medal className="h-5 w-5" />, className: 'bg-gray-300 text-black' },
  3: { icon: <Medal className="h-5 w-5" />, className: 'bg-amber-600 text-white' },
};

interface LeaderboardEntry {
  rank: number;
  title: string;
  creator: string;
  votes: number;
  reward: string;
  color: string;
  isUser?: boolean;
}

export default function Leaderboard() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>(DEMO_LEADERBOARD);

  useEffect(() => {
    const userRemixes = getUserRemixes();
    if (userRemixes.length === 0) {
      setEntries(DEMO_LEADERBOARD);
      return;
    }

    const userEntries: LeaderboardEntry[] = userRemixes.map((r) => ({
      rank: 0,
      title: r.title,
      creator: r.creator,
      votes: r.votes,
      reward: '',
      color: 'text-gray-400',
      isUser: true,
    }));

    // Merge and sort by votes descending
    const merged = [...DEMO_LEADERBOARD, ...userEntries]
      .sort((a, b) => b.votes - a.votes)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    setEntries(merged);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Today's Leaderboard</h1>
          </div>
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm">Back</button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Prize pool banner */}
        <Card className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 border-yellow-400/30 mb-6">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">World Cup 2026 — Day 1</h2>
              <p className="text-gray-300 text-sm mt-1">Top 10 remixes win USDT rewards. Top 3 become Flow Iconic Moments.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">$100</div>
              <div className="text-gray-400 text-xs">Prize Pool</div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard table */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {entries.map((entry) => {
                const badge = RANK_BADGES[entry.rank];
                return (
                  <div
                    key={`${entry.title}-${entry.rank}`}
                    className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                      entry.rank <= 3 ? 'bg-yellow-400/5' : ''
                    } ${entry.isUser ? 'ring-1 ring-green-400/40 bg-green-400/5' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-10 text-center">
                      {badge ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${badge.className}`}>
                          {badge.icon}
                        </div>
                      ) : (
                        <span className="text-gray-500 font-mono text-lg">{entry.rank}</span>
                      )}
                    </div>

                    {/* Remix info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{entry.title}</h3>
                        {entry.isUser && (
                          <Badge className="bg-green-500/20 text-green-300 text-xs border border-green-500/30">
                            You
                          </Badge>
                        )}
                        {entry.rank <= 3 && (
                          <Zap className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-500 text-xs">{entry.creator}</p>
                    </div>

                    {/* Votes */}
                    <div className="text-right">
                      <div className="text-white font-mono text-sm">{entry.votes.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">votes</div>
                    </div>

                    {/* Reward */}
                    <div className="w-24 text-right">
                      {entry.reward && (
                        <div className="text-yellow-400 font-semibold text-sm flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3" />
                          {entry.reward}
                        </div>
                      )}
                    </div>

                    {/* Flow badge for top 3 */}
                    {entry.rank <= 3 && (
                      <Badge className="bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                        Iconic
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/remix')}
            className="px-8 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors inline-flex items-center gap-2"
          >
            <Zap className="h-5 w-5" /> Create Your Remix
          </button>
        </div>
      </div>
    </div>
  );
}
