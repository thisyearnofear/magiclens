'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Trophy, Wand2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type JourneyStage = 'create' | 'compete' | 'promote';

const stages: Array<{
  id: JourneyStage;
  label: string;
  description: string;
  href: string;
  icon: typeof Wand2;
}> = [
  { id: 'create', label: 'Create', description: 'Remix a match clip', href: '/remix', icon: Wand2 },
  { id: 'compete', label: 'Compete', description: 'Climb the daily board', href: '/leaderboard', icon: Trophy },
  { id: 'promote', label: 'Promote', description: 'Become a Flow NFT', href: '/iconic-moments', icon: Sparkles },
];

const SEEN_KEY = 'magiclens:journey-seen';

interface ProductJourneyHeaderProps {
  active: JourneyStage;
  title: string;
  subtitle: string;
  metric?: string;
  metricLabel?: string;
  className?: string;
}

export function ProductJourneyHeader({ active, title, subtitle, metric, metricLabel, className }: ProductJourneyHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    if (!stored[active]) {
      stored[active] = true;
      localStorage.setItem(SEEN_KEY, JSON.stringify(stored));
    }
    setSeen(Object.keys(stored).length >= 3);
  }, [active]);

  return (
    <section className={cn('rounded-lg border border-white/10 bg-black/35 p-4 shadow-lg shadow-black/20 sm:p-5', className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300">MagicLens journey</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">{subtitle}</p>
        </div>

        {metric && (
          <div className="w-full rounded-md border border-yellow-400/20 bg-yellow-400/10 p-3 text-left lg:w-40 lg:text-right">
            <div className="text-2xl font-bold text-yellow-300">{metric}</div>
            {metricLabel && <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-yellow-100/80">{metricLabel}</div>}
          </div>
        )}
      </div>

      {seen && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Journey stages — Create → Compete → Promote
        </button>
      )}

      {(!seen || expanded) && (
        <div className="mt-5 grid gap-2 md:grid-cols-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = stage.id === active;
            return (
              <button
                type="button"
                key={stage.id}
                onClick={() => router.push(stage.href)}
                className={cn(
                  'relative rounded-md border p-3 text-left transition-colors hover:border-yellow-400/30 hover:bg-yellow-400/10',
                  isActive
                    ? 'border-yellow-400/40 bg-yellow-400/12'
                    : 'border-white/10 bg-white/[0.03]'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                      isActive ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{stage.label}</span>
                      {index < stages.length - 1 && <ArrowRight className="hidden h-3 w-3 text-gray-500 md:block" />}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{stage.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
