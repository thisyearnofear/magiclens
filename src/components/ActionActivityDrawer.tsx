'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, ChevronUp, Clock, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ActivityStatus = 'active' | 'success' | 'error';

type ActivityItem = {
  action: string;
  actionId: string;
  status: ActivityStatus;
  durationMs?: number;
  error?: string;
  updatedAt: number;
};

function actionLabel(action: string) {
  return action
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function durationLabel(ms?: number) {
  if (ms == null) return 'In progress';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ActionActivityDrawer() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail as Partial<ActivityItem> | undefined;
      if (!detail?.action || !detail.actionId) return;

      const status: ActivityStatus = event.type.endsWith('action_error')
        ? 'error'
        : event.type.endsWith('action_success')
          ? 'success'
          : 'active';

      setItems((current) => {
        const nextItem: ActivityItem = {
          action: detail.action,
          actionId: detail.actionId,
          status,
          durationMs: detail.durationMs,
          error: detail.error,
          updatedAt: Date.now(),
        };
        const rest = current.filter((item) => item.actionId !== detail.actionId);
        return [nextItem, ...rest].slice(0, 8);
      });

      if (status === 'active') setOpen(true);
    };

    window.addEventListener('magiclens:action_start', handleEvent);
    window.addEventListener('magiclens:action_success', handleEvent);
    window.addEventListener('magiclens:action_error', handleEvent);

    return () => {
      window.removeEventListener('magiclens:action_start', handleEvent);
      window.removeEventListener('magiclens:action_success', handleEvent);
      window.removeEventListener('magiclens:action_error', handleEvent);
    };
  }, []);

  const activeCount = useMemo(() => items.filter((item) => item.status === 'active').length, [items]);
  const latest = items[0];

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/40 backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-yellow-400 text-black">
            {activeCount > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {activeCount > 0 ? `${activeCount} action${activeCount > 1 ? 's' : ''} running` : actionLabel(latest.action)}
            </p>
            <p className="truncate text-xs text-gray-400">
              {latest.status === 'error' ? latest.error : durationLabel(latest.durationMs)}
            </p>
          </div>
          <ChevronUp className={cn('h-4 w-4 text-gray-400 transition-transform', !open && 'rotate-180')} />
        </button>

        {open && (
          <div className="max-h-80 overflow-y-auto border-t border-white/10 p-2">
            {items.map((item) => {
              const Icon = item.status === 'active' ? Loader2 : item.status === 'success' ? CheckCircle2 : XCircle;
              return (
                <div key={item.actionId} className="rounded-md px-2 py-2 hover:bg-white/5">
                  <div className="flex items-start gap-2">
                    <Icon
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        item.status === 'active' && 'animate-spin text-blue-300',
                        item.status === 'success' && 'text-green-300',
                        item.status === 'error' && 'text-red-300'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{actionLabel(item.action)}</p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="h-3 w-3" />
                        {durationLabel(item.durationMs)}
                      </div>
                      {item.error && <p className="mt-1 text-[11px] leading-snug text-red-300">{item.error}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="px-2 pb-2 pt-1">
              <Button variant="ghost" size="sm" className="h-7 w-full text-xs text-gray-300" onClick={() => setItems([])}>
                Clear activity
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
