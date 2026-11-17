import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Swords, Vote, Crown, Cpu, ArrowRight } from 'lucide-react';
import { getIconicMoments } from '@/lib/crossvm-client';
import type { CrossVMPromotion } from '@/types/crossvm';

const steps = [
  {
    icon: Swords,
    title: 'Enter the battle',
    description: 'Every remix you mint joins today\u2019s leaderboard. Free to enter, new battle every day.',
    accent: 'text-blue-400',
    border: 'border-blue-500/30',
    gradient: 'from-blue-600 to-blue-800',
  },
  {
    icon: Vote,
    title: 'The crowd votes',
    description: 'Fans vote on the day\u2019s remixes. Referrals carry weight \u2014 bring your own voters.',
    accent: 'text-purple-400',
    border: 'border-purple-500/30',
    gradient: 'from-purple-600 to-purple-800',
  },
  {
    icon: Cpu,
    title: 'A circuit decides',
    description: 'Promotion isn\u2019t our server\u2019s word \u2014 ICONIC-GATE, a 46-gate NAND circuit on X Layer mainnet, clears or rejects every winner. Anyone can re-run it.',
    accent: 'text-yellow-400',
    border: 'border-yellow-500/30',
    gradient: 'from-yellow-500 to-amber-700',
  },
];

export function CompeteSection() {
  const [moments, setMoments] = useState<CrossVMPromotion[]>([]);

  useEffect(() => {
    getIconicMoments()
      .then((list) => setMoments((list ?? []).slice(0, 3)))
      .catch(() => setMoments([]));
  }, []);

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h3 className="text-3xl sm:text-4xl font-bold text-white font-display mb-3">
          One crown a day
        </h3>
        <p className="text-gray-300 max-w-xl mx-auto">
          Minted remixes battle on the daily leaderboard. The winner&apos;s
          promotion is gated by silicon, not by us.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className={`relative rounded-2xl border ${step.border} overflow-hidden backdrop-blur-sm h-full bg-white/[0.03]`}
          >
            <div className="relative p-6 sm:p-8 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                >
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <span className={`text-5xl font-black ${step.accent} opacity-20 leading-none`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-white text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed flex-1">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {moments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto mt-12"
        >
          <p className="text-center text-xs uppercase tracking-[0.2em] text-gray-400 mb-4">
            Latest circuit-cleared winners
          </p>
          <div className="space-y-3">
            {moments.map((m) => (
              <Link
                key={m.id}
                href="/screening-room"
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 hover:bg-white/[0.08] transition-colors"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex-shrink-0">
                  <Crown className="h-4 w-4 text-yellow-400" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold truncate">{m.title}</p>
                  <p className="text-xs text-gray-400">
                    Rank #{m.rank} · Day {m.day} · {m.xlayer_creator_address.slice(0, 6)}…{m.xlayer_creator_address.slice(-4)}
                  </p>
                </div>
                {m.tapeout?.verified && (
                  <span className="text-[11px] font-mono text-green-400 border border-green-400/30 rounded-full px-3 py-1 whitespace-nowrap flex-shrink-0">
                    Cleared by TapeOut #{m.tapeout.circuit_id}
                    {typeof m.tapeout.score === 'number' ? ` · ${m.tapeout.score}/15` : ''}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      <div className="text-center mt-10">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          See today&apos;s battle <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
