import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Zap, Trophy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PublicRemix() {
  const { txHash } = useParams();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Remix on MagicLens</h1>
        <p className="text-gray-400 mb-6">
          This World Cup moment was remixed with AR overlays and minted on X Layer.
        </p>

        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-gray-600" />
            </div>
            <p className="text-gray-300 text-sm font-mono break-all">
              TX: {txHash?.slice(0, 16)}...{txHash?.slice(-8)}
            </p>
            {txHash && (
              <a
                href={`https://www.oklink.com/xlayer-testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 text-xs hover:underline inline-flex items-center gap-1 mt-2"
              >
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={() => router.push('/')}
          className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
        >
          Create Your Own Remix
        </Button>
      </div>
    </div>
  );
}
