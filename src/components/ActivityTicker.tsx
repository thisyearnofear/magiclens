'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Sparkles, User } from 'lucide-react';

type ActivityType = 'mint' | 'vote' | 'promote' | 'join';

interface Activity {
  id: string;
  type: ActivityType;
  user: string;
  target: string;
  timestamp: number;
}

const DEMO_ACTIVITIES: Activity[] = [
  { id: '1', type: 'mint', user: '0xABC...F1D2', target: 'World Cup Final Goal', timestamp: Date.now() - 5000 },
  { id: '2', type: 'vote', user: '0xDEF...A3B4', target: 'Penalty Save Highlight', timestamp: Date.now() - 15000 },
  { id: '3', type: 'promote', user: 'System', target: 'Trophy Lift Ceremony → Flow', timestamp: Date.now() - 30000 },
  { id: '4', type: 'join', user: '0x123...C5D6', target: 'joined the competition', timestamp: Date.now() - 45000 },
  { id: '5', type: 'mint', user: '0x456...E7F8', target: 'Confetti Celebration Remix', timestamp: Date.now() - 60000 },
];

const ACTIVITY_CONFIG = {
  mint: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/15', label: 'Minted' },
  vote: { icon: Trophy, color: 'text-green-400', bg: 'bg-green-400/15', label: 'Voted' },
  promote: { icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-400/15', label: 'Promoted' },
  join: { icon: User, color: 'text-indigo-400', bg: 'bg-indigo-400/15', label: 'Joined' },
};

export function ActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>(DEMO_ACTIVITIES.slice(0, 3));
  const [visible, setVisible] = useState(true);
  const indexRef = useRef(3);

  // Rotate through demo activities every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const next = DEMO_ACTIVITIES[indexRef.current % DEMO_ACTIVITIES.length];
      indexRef.current += 1;
      setActivities((prev) => {
        const updated = [{ ...next, id: `${Date.now()}` }, ...prev.slice(0, 2)];
        return updated;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm hidden md:block">
      <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Live Activity
            </span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-500 hover:text-gray-300 text-xs leading-none"
            aria-label="Hide activity ticker"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => {
              const config = ACTIVITY_CONFIG[activity.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: 40, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -40, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex items-center gap-2 text-xs py-1"
                >
                  <div className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-3 w-3 ${config.color}`} />
                  </div>
                  <span className="text-gray-300 truncate">
                    <span className="text-white font-medium">{activity.user}</span>{' '}
                    {activity.type === 'mint' ? 'minted' :
                     activity.type === 'vote' ? 'voted on' :
                     activity.type === 'promote' ? 'promoted' : ''}{' '}
                    <span className="text-white/80">{activity.target}</span>
                  </span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-500 text-[9px] ml-auto shrink-0"
                  >
                    {formatRelativeTime(activity.timestamp)}
                  </motion.span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return '<1m';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}
