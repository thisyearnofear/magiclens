'use client';

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TransactionStepStatus = 'pending' | 'active' | 'complete' | 'error';

export type TransactionStep = {
  label: string;
  description?: string;
  status: TransactionStepStatus;
};

const stepIcon = {
  pending: Circle,
  active: Loader2,
  complete: CheckCircle2,
  error: XCircle,
};

const stepColor = {
  pending: 'text-gray-500 border-white/10 bg-white/5',
  active: 'text-blue-300 border-blue-400/30 bg-blue-500/10',
  complete: 'text-green-300 border-green-400/30 bg-green-500/10',
  error: 'text-red-300 border-red-400/30 bg-red-500/10',
};

interface TransactionProgressProps {
  title: string;
  subtitle?: string;
  steps: TransactionStep[];
  className?: string;
}

export function TransactionProgress({ title, subtitle, steps, className }: TransactionProgressProps) {
  return (
    <section className={cn('rounded-lg border border-white/10 bg-black/35 p-4 shadow-lg shadow-black/20', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-gray-300">{subtitle}</p>}
        </div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400">Live status</div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {steps.map((step) => {
          const Icon = stepIcon[step.status];
          return (
            <div
              key={step.label}
              className={cn('min-h-[82px] rounded-md border p-3 transition-colors', stepColor[step.status])}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4 shrink-0', step.status === 'active' && 'animate-spin')} />
                <span className="truncate text-xs font-semibold text-white">{step.label}</span>
              </div>
              {step.description && (
                <p className="mt-2 text-[11px] leading-snug text-gray-300">{step.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
