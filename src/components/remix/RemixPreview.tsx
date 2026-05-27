import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap } from 'lucide-react';
import type { SelectedOverlay } from '@/hooks/usePack';
import type { OverlayStyle } from '@/components/remix/EditorOverlay';

interface RemixPreviewProps {
  clipTitle: string;
  clipVideoUrl: string;
  selectedOverlays: SelectedOverlay[];
  overlayStyles?: Record<string, OverlayStyle>;
  onBack: () => void;
  onMint: () => void;
  isMinting?: boolean;
}

const OVERLAY_NAMES: Record<string, string> = {
  'flag-halos': 'Flag Halos',
  'goal-lower-third': 'GOAL! Lower-Third',
  'trophy-confetti': 'Trophy Confetti',
  'commentary-bubble': 'Commentary Bubble',
  'stadium-sparkles': 'Stadium Sparkles',
  'ref-card': 'Ref-Card Overlay',
};

export function RemixPreview({ clipTitle, clipVideoUrl, selectedOverlays, overlayStyles = {}, onBack, onMint, isMinting }: RemixPreviewProps) {
  const packNames = selectedOverlays.map(o => OVERLAY_NAMES[o.id] || o.name);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Preview Your Remix</h2>
        <p className="text-gray-400">Review before minting on X Layer</p>
      </div>

      {/* Video preview with overlays */}
      <div className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative mb-6">
        {clipVideoUrl ? (
          <video
            src={clipVideoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40" />
        )}

        {/* Render selected overlays with user's styles */}
        {selectedOverlays.map(overlay => {
          const st = overlayStyles[overlay.id];
          const transform = st
            ? `translate(${st.x}px, ${st.y}px) rotate(${st.rotation}deg) scale(${st.scale})`
            : '';

          switch (overlay.id) {
            case 'flag-halos':
              return (
                <div key="flag-halos" className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
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
                  </div>
                </div>
              );
            case 'goal-lower-third':
              return (
                <div key="goal-lower" className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
                  <div className="px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-2xl shadow-yellow-500/30 border border-yellow-300/50">
                    <span className="text-white font-black text-4xl tracking-[0.15em] whitespace-nowrap">GOAL!</span>
                  </div>
                </div>
              );
            case 'trophy-confetti':
              return (
                <div key="confetti" className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        background: ['#FFD700', '#FF4500', '#FF69B4', '#00FF88', '#00BFFF'][i % 5],
                        animation: `fall ${2 + Math.random() * 2}s ${Math.random() * 2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              );
            case 'commentary-bubble':
              return (
                <div key="commentary" className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
                  <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-yellow-400/30 p-3 shadow-xl max-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">🎙</span>
                      <span className="text-yellow-400 text-xs font-bold">LIVE</span>
                    </div>
                    <p className="text-white text-sm leading-tight">{st?.text || 'What a moment!'}</p>
                    <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-gray-900/80 border-r border-b border-yellow-400/30 rotate-45" />
                  </div>
                </div>
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
                        animation: `pulse 1.5s ${Math.random() * 2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              );
            case 'ref-card':
              return (
                <div key="ref-card" className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
                  <div className={`backdrop-blur-md rounded-xl border p-3 shadow-xl ${
                    st?.cardColor === 'red' ? 'bg-red-900/70 border-red-400/40' : 'bg-gray-900/80 border-yellow-400/40'
                  }`}>
                    <div className={`w-8 h-6 rounded flex items-center justify-center ${
                      st?.cardColor === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                    }`}>
                      <span className="text-black text-xs font-bold">{st?.cardColor === 'red' ? 'RED' : 'YLW'}</span>
                    </div>
                  </div>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>

      {/* Metadata summary */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">{clipTitle}</h3>
              <p className="text-gray-400 text-sm mt-1">
                {packNames.length > 0
                  ? `Using ${packNames.length} overlay pack${packNames.length > 1 ? 's' : ''}: ${packNames.join(', ')}`
                  : 'No overlays selected'}
              </p>
            </div>
            <Badge className="bg-purple-500">X Layer</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> Adjust Overlays
        </Button>
        <Button onClick={onMint} size="lg" disabled={isMinting} className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold disabled:opacity-50">
          <Zap className="h-5 w-5 mr-2" /> {isMinting ? 'Minting...' : 'Mint Remix on X Layer'}
        </Button>
      </div>
    </div>
  );
}
