'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Share2, Twitter, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';

type CelebrationType = 'mint' | 'promote' | 'vote' | 'achievement' | 'level-up';

interface CelebrationConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  shareText?: string;
  duration: number;
}

const CELEBRATIONS: Record<CelebrationType, CelebrationConfig> = {
  mint: {
    title: 'Remix Minted! 🎉',
    subtitle: 'Your AR remix is now an NFT on X Layer. It automatically enters the daily competition.',
    icon: <Zap className="h-8 w-8 text-yellow-400" />,
    color: 'from-yellow-400/30 via-orange-400/20 to-purple-500/25',
    shareText: 'I+just+minted+a+pose-aware+AR+remix+on+MagicLens!+Check+it+out+→',
    duration: 4000,
  },
  promote: {
    title: 'Promoted to Flow! 🏆',
    subtitle: 'Your remix has graduated to a premium Flow Iconic Moment NFT with gasless transactions.',
    icon: <Trophy className="h-8 w-8 text-blue-400" />,
    color: 'from-blue-400/30 via-purple-400/20 to-pink-500/25',
    shareText: 'My+remix+just+got+promoted+to+a+Flow+Iconic+Moment+on+MagicLens!',
    duration: 5000,
  },
  vote: {
    title: 'Vote Cast!',
    subtitle: 'Your vote has been counted. Keep supporting great remixes.',
    icon: <Sparkles className="h-6 w-6 text-green-400" />,
    color: 'from-green-400/20 via-emerald-400/15 to-teal-500/20',
    duration: 2500,
  },
  achievement: {
    title: 'Achievement Unlocked!',
    subtitle: 'You earned a new milestone on MagicLens.',
    icon: <Sparkles className="h-7 w-7 text-yellow-400" />,
    color: 'from-yellow-400/25 via-amber-400/20 to-red-500/20',
    shareText: 'I+just+unlocked+an+achievement+on+MagicLens!',
    duration: 4000,
  },
  'level-up': {
    title: 'Level Up! ⬆',
    subtitle: 'You reached a new tier. More rewards and recognition await.',
    icon: <Zap className="h-8 w-8 text-purple-400" />,
    color: 'from-purple-400/30 via-indigo-400/20 to-blue-500/25',
    duration: 4000,
  },
};

function createParticles(count: number) {
  const colors = ['#FFD700', '#FF6B6B', '#48D1CC', '#FF69B4', '#00FF88', '#FFA500', '#7B68EE'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: colors[i % colors.length],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    drift: (Math.random() - 0.5) * 60,
  }));
}

interface CelebrationOverlayProps {
  type: CelebrationType;
  show: boolean;
  onClose?: () => void;
  subtitle?: string;
  shareUrl?: string;
}

export function CelebrationOverlay({
  type,
  show,
  onClose,
  subtitle,
  shareUrl,
}: CelebrationOverlayProps) {
  const config = CELEBRATIONS[type];
  const [particles, setParticles] = useState(createParticles(30));
  const sound = useSound();

  useEffect(() => {
    if (show) {
      sound.celebrate();
      setParticles(createParticles(30));
    }
  }, [show]);

  const handleShare = useCallback(() => {
    const text = config.shareText
      ? encodeURIComponent(config.shareText)
      : '';
    const url = shareUrl ? encodeURIComponent(shareUrl) : 'https://magiclens.vercel.app';
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}&via=magiclensx`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [config.shareText, shareUrl]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="celebration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-sm"
                style={{
                  left: `${p.x}%`,
                  width: p.size,
                  height: p.size * 0.6,
                  backgroundColor: p.color,
                  rotate: p.rotation,
                }}
                initial={{ y: `${p.y}vh`, opacity: 1 }}
                animate={{
                  y: '110vh',
                  opacity: [1, 1, 0],
                  x: p.drift,
                  rotate: p.rotation + 360 + Math.random() * 360,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
            className="relative bg-gradient-to-br from-yellow-400/30 via-orange-400/20 to-purple-500/25 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/30 via-orange-400/20 to-purple-500/25 rounded-2xl blur-xl opacity-30 -z-10" />

            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    {config.icon}
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-yellow-400/30"
                  />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-white"
              >
                {config.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-300 text-sm leading-relaxed"
              >
                {subtitle || config.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col gap-2 pt-2"
              >
                {config.shareText && (
                  <Button
                    onClick={handleShare}
                    className="bg-[#1DA1F2] hover:bg-[#1da1f2]/80 text-white text-sm"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Share on X
                    <Share2 className="h-3 w-3 ml-2" />
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-gray-300 hover:text-white"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
