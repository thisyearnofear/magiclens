'use client';

import { useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

import { evalTapeoutCircuit } from '@/lib/tapeout-verify';
import type { CrossVMPromotion } from '@/types/crossvm';
import { cn } from '@/lib/utils';

type VerifyState = 'idle' | 'busy' | 'ok' | 'mismatch' | 'error';

/**
 * TapeOut provenance badge + live re-verification. The badge links to the
 * processor on OKLink; the "Verify" button re-runs the same `eval` eth_call
 * the backend used and compares outputs — the silicon verdict, checkable by
 * anyone, right in the Screening Room.
 */
export function TapeoutBadge({ tapeout, compact = false }: {
  tapeout: NonNullable<CrossVMPromotion['tapeout']>;
  compact?: boolean;
}) {
  const [state, setState] = useState<VerifyState>('idle');

  const verify = async () => {
    if (state === 'busy') return;
    setState('busy');
    try {
      const res = await evalTapeoutCircuit(
        tapeout.processor,
        tapeout.circuit_id,
        tapeout.inputs_hex
      );
      const live = res.outputHex.toLowerCase();
      const recorded = tapeout.output_hex.toLowerCase();
      setState(live === recorded ? 'ok' : 'mismatch');
    } catch {
      setState('error');
    }
  };

  const verdictText =
    tapeout.promote === 1 ? 'Cleared' : 'Audited';
  const statusText =
    state === 'busy'
      ? 'evaluating…'
      : state === 'ok'
        ? 'circuit agrees ✓'
        : state === 'mismatch'
          ? 'output differs!'
          : state === 'error'
            ? 'RPC unreachable'
            : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <a
        href={`https://www.oklink.com/xlayer/address/${tapeout.processor}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-amber-300/90 hover:text-amber-200"
        title={`ICONIC-GATE circuit #${tapeout.circuit_id} on OrderGuard — ${tapeout.promote ? 'promote ✓' : 'promote ✗'}, score ${tapeout.score}/15, inputs ${tapeout.inputs_hex}`}
      >
        <span className="rounded border border-amber-400/40 px-1 py-0 text-[9px] font-bold text-amber-300">
          Si
        </span>
        {!compact && (
          <>
            {verdictText} by TapeOut #{tapeout.circuit_id} · {tapeout.score}/15
          </>
        )}
        <ExternalLink className="h-3 w-3" />
      </a>
      <button
        type="button"
        onClick={verify}
        disabled={state === 'busy'}
        className={cn(
          'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
          state === 'ok'
            ? 'border-emerald-400/40 text-emerald-300'
            : state === 'mismatch' || state === 'error'
              ? 'border-red-400/40 text-red-300'
              : 'border-amber-400/30 text-amber-300/80 hover:border-amber-400/60 hover:text-amber-200'
        )}
        title="Re-run eval() on X Layer mainnet and compare with the recorded verdict"
      >
        <ShieldCheck className="h-3 w-3" />
        {state === 'busy' ? '…' : 'Verify'}
      </button>
      {statusText && (
        <span
          className={cn(
            'text-[10px]',
            state === 'ok' ? 'text-emerald-300/80' : 'text-red-300/80'
          )}
        >
          {statusText}
        </span>
      )}
    </span>
  );
}
