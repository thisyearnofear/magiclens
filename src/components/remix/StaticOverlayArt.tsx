import React from 'react';
import type { SelectedOverlay } from '@/hooks/usePack';
import type { OverlayStyle } from '@/components/remix/EditorOverlay';

/**
 * Static (editor-placed) overlay art — shared between RemixPreview (mint
 * preview) and PublicRemix (public replay of `mode: 'static'` mints) so the
 * two never drift. Position comes from `style` scaled by `posScale`.
 */
export function StaticOverlayArt({
  overlay,
  style: st,
  posScale,
}: {
  overlay: SelectedOverlay;
  style?: OverlayStyle;
  posScale: number;
}) {
  const sx = st ? st.x * posScale : 0;
  const sy = st ? st.y * posScale : 0;
  const transform = st ? `translate(${sx}px, ${sy}px) rotate(${st.rotation}deg) scale(${st.scale})` : '';
  const wrap = (children: React.ReactNode) => (
    <div key={overlay.id} className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
      {children}
    </div>
  );

  switch (overlay.id) {
    case 'flag-halos':
      return wrap(
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-green-400/50"
            style={{ animation: 'spin 8s linear infinite' }} />
          <div className="absolute inset-1 rounded-full border-2 border-yellow-400/30"
            style={{ animation: 'spin 12s linear infinite', animationDirection: 'reverse' }} />
          {overlay.chosenVariant?.flagUrl ? (
            <img
              src={overlay.chosenVariant.flagUrl}
              alt={overlay.chosenVariant.name}
              className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] rounded-full object-cover border-2 border-white/20 shadow-lg"
            />
          ) : (
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">WC</div>
          )}
        </div>,
      );
    case 'goal-lower-third':
      return wrap(
        <div className="px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-2xl shadow-yellow-500/30 border border-yellow-300/50">
          <span className="text-white font-black text-4xl tracking-[0.15em] whitespace-nowrap">GOAL!</span>
        </div>,
      );
    case 'trophy-confetti':
      return (
        <div key="confetti" className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${(i * 47) % 100}%`,
                background: ['#FFD700', '#FF4500', '#FF69B4', '#00FF88', '#00BFFF'][i % 5],
                animation: `fall ${2 + (i % 5) * 0.4}s ${(i % 7) * 0.3}s infinite`,
              }}
            />
          ))}
        </div>
      );
    case 'commentary-bubble':
      return wrap(
        <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-yellow-400/30 p-3 shadow-xl max-w-[200px] relative">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">🎙</span>
            <span className="text-yellow-400 text-xs font-bold">LIVE</span>
          </div>
          <p className="text-white text-sm leading-tight">{st?.text || 'What a moment!'}</p>
          <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-gray-900/80 border-r border-b border-yellow-400/30 rotate-45" />
        </div>,
      );
    case 'stadium-sparkles':
      return (
        <div key="sparkles" className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full"
              style={{
                left: `${8 + (i * 8)}%`,
                top: `${10 + (i * 7)}%`,
                animation: `pulse 1.5s ${(i % 5) * 0.4}s infinite`,
              }}
            />
          ))}
        </div>
      );
    case 'ref-card':
      return wrap(
        <div className={`backdrop-blur-md rounded-xl border p-3 shadow-xl ${
          st?.cardColor === 'red' ? 'bg-red-900/70 border-red-400/40' : 'bg-gray-900/80 border-yellow-400/40'
        }`}>
          <div className={`w-8 h-6 rounded flex items-center justify-center ${
            st?.cardColor === 'red' ? 'bg-red-500' : 'bg-yellow-400'
          }`}>
            <span className="text-black text-xs font-bold">{st?.cardColor === 'red' ? 'RED' : 'YLW'}</span>
          </div>
        </div>,
      );
    case 'ghost-trail':
      // static preview — decorative echoes; the tracked replay draws real trajectory ghosts
      return (
        <div key="ghost" className="absolute inset-0 pointer-events-none">
          {[0.12, 0.3, 0.55, 0.85].map((o, i) => (
            <div
              key={i}
              className="absolute text-cyan-200"
              style={{ left: `${20 + i * 18}%`, top: `${55 - i * 8}%`, opacity: o, animation: `pulse 1.6s ${i * 0.2}s infinite` }}
            >
              <svg width="28" height="44" viewBox="0 0 28 44" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="14" cy="6" r="4" fill="currentColor" stroke="none" />
                <line x1="14" y1="10" x2="14" y2="26" />
                <line x1="14" y1="14" x2="5" y2="22" />
                <line x1="14" y1="14" x2="23" y2="22" />
                <line x1="14" y1="26" x2="7" y2="40" />
                <line x1="14" y1="26" x2="21" y2="40" />
              </svg>
            </div>
          ))}
        </div>
      );
    case 'player-card': {
      const accent = overlay.chosenVariant?.accent ?? '#FFD700';
      return wrap(
        <div className="bg-gray-900/85 backdrop-blur-md rounded-xl px-3 py-2.5 shadow-xl w-40" style={{ border: `1.5px solid ${accent}66` }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-5 rounded-sm flex items-center justify-center text-[10px] font-black text-black" style={{ background: accent }}>10</div>
            <span className="text-[10px] font-bold" style={{ color: accent }}>RATING</span>
            <span className="ml-auto text-white text-sm font-black">9.4</span>
          </div>
          <p className="text-white text-xs font-bold mt-1.5 leading-tight whitespace-nowrap">{st?.text || 'STAR PLAYER'}</p>
          <div className="mt-1.5 space-y-1">
            <div className="h-1 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-[86%] rounded-full" style={{ background: accent }} /></div>
            <div className="h-1 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-[64%] rounded-full bg-sky-400" /></div>
          </div>
        </div>,
      );
    }
    default:
      return null;
  }
}
