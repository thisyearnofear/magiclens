import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowLeft, Zap } from 'lucide-react';

interface RemixPreviewProps {
  clipTitle: string;
  packNames: string[];
  onBack: () => void;
  onMint: () => void;
}

export function RemixPreview({ clipTitle, packNames, onBack, onMint }: RemixPreviewProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Preview Your Remix</h2>
        <p className="text-gray-400">Review before minting on X Layer</p>
      </div>

      {/* Video preview with overlays */}
      <div className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            <Play className="h-12 w-12" />
          </Button>
        </div>

        {/* Mock overlays showing what it'll look like */}
        <div className="absolute top-4 left-4">
          <div className="w-12 h-12 rounded-full bg-green-500/40 border-2 border-green-400 flex items-center justify-center text-white text-xs font-bold animate-pulse">
            🇧🇷
          </div>
        </div>
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <div className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-red-500 rounded-lg shadow-2xl">
            <span className="text-white font-black text-3xl tracking-widest">GOAL!</span>
          </div>
        </div>
        <div className="absolute top-4 right-4 space-y-1 text-right">
          <span className="inline-block px-2 py-0.5 bg-black/60 text-white text-xs rounded">BRA 2 — 1 ARG</span>
          <br />
          <span className="inline-block px-2 py-0.5 bg-black/60 text-yellow-400 text-xs rounded">89' Messi ⚽</span>
        </div>
      </div>

      {/* Metadata summary */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">{clipTitle}</h3>
              <p className="text-gray-400 text-sm mt-1">
                Using {packNames.length} overlay pack{packNames.length > 1 ? 's' : ''}: {packNames.join(', ')}
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
        <Button onClick={onMint} size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold">
          <Zap className="h-5 w-5 mr-2" /> Mint Remix on X Layer
        </Button>
      </div>
    </div>
  );
}
