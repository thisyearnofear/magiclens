import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Box, GitFork, Layers } from 'lucide-react';

interface StatItem {
  icon: React.ReactNode;
  target: number;
  suffix: string;
  prefix?: string;
  label: string;
}

const stats: StatItem[] = [
  {
    icon: <Trophy className="h-6 w-6 text-yellow-400" />,
    target: 8,
    suffix: '',
    label: 'Iconic Moments minted',
  },
  {
    icon: <Box className="h-6 w-6 text-green-400" />,
    target: 6,
    suffix: '',
    label: 'smart contracts deployed',
  },
  {
    icon: <GitFork className="h-6 w-6 text-blue-400" />,
    target: 2,
    suffix: '',
    label: 'blockchain networks',
  },
  {
    icon: <Layers className="h-6 w-6 text-purple-400" />,
    target: 5,
    suffix: '',
    label: 'overlay packs',
  },
];

function Counter({ target, prefix, suffix }: { target: number; prefix?: string; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="text-3xl font-bold text-white">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-6 text-center group hover:bg-white/10 transition-all"
          >
            {/* Glass highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Accent glow */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-yellow-400/10 rounded-full blur-xl group-hover:bg-yellow-400/20 transition-all" />

            <div className="relative z-10">
              <motion.div
                className="flex justify-center mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 + 0.2, type: 'spring', stiffness: 200 }}
              >
                <div className="p-2.5 rounded-full bg-white/10">
                  {stat.icon}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15 + 0.3, duration: 0.3 }}
              >
                <Counter target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />
              </motion.div>

              <p className="text-sm text-gray-300 mt-1 font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
