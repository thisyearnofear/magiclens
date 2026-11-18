// Lightweight funnel instrumentation — console + in-memory ring buffer in
// dev, and a sendBeacon POST when NEXT_PUBLIC_FUNNEL_ENDPOINT is configured.
// No PII: events carry an anonymous per-tab session id only.

export type FunnelEvent =
  | 'clip_armed'
  | 'clip_cleared'
  | 'clip_committed'
  | 'overlay_selected'
  | 'overlay_deselected'
  | 'tracking_ready'
  | 'export_done'
  | 'payoff_shown'
  | 'mint_cta';

type Entry = { t: number; sid: string; event: FunnelEvent; meta?: Record<string, unknown> };

const RING_MAX = 200;
const SID_KEY = 'ml-funnel-sid';

function sessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let sid = sessionStorage.getItem(SID_KEY);
  if (!sid) {
    sid = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(SID_KEY, sid);
  }
  return sid;
}

export function logFunnel(event: FunnelEvent, meta?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const entry: Entry = { t: Date.now(), sid: sessionId(), event, meta };
  try {
    const w = window as unknown as { __mlFunnel?: Entry[] };
    (w.__mlFunnel = w.__mlFunnel ?? []).push(entry);
    if (w.__mlFunnel.length > RING_MAX) w.__mlFunnel.splice(0, w.__mlFunnel.length - RING_MAX);
    if (process.env.NODE_ENV !== 'production') console.debug('[funnel]', event, meta ?? '');
    const endpoint = process.env.NEXT_PUBLIC_FUNNEL_ENDPOINT;
    if (endpoint) navigator.sendBeacon(endpoint, JSON.stringify(entry));
  } catch {
    /* never break UX for telemetry */
  }
}
