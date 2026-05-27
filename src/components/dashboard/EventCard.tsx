import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Package, Sparkles } from 'lucide-react';

interface EventCardProps {
  name?: string;
  dateRange?: string;
  packCount?: number;
  iconicCount?: number;
  isActive?: boolean;
}

export function EventCard({
  name = 'FIFA World Cup 2026',
  dateRange = 'Jun 8 — Jul 8, 2026',
  packCount = 5,
  iconicCount = 8,
  isActive = true,
}: EventCardProps) {
  const router = useRouter();

  return (
    <Card className={`${
      isActive
        ? 'bg-white/5 border-yellow-400/40'
        : 'bg-white/5 border-white/10'
    } mb-6`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Event info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className={`h-5 w-5 ${isActive ? 'text-yellow-400' : 'text-gray-500'}`} />
              <h2 className={`text-xl font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {name}
              </h2>
              {isActive && (
                <Badge className="bg-green-500/30 text-green-200 text-xs border border-green-400/40 font-medium">
                  Live Event
                </Badge>
              )}
            </div>
            <p className="text-gray-200 text-sm">{dateRange}</p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Package className={`h-4 w-4 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                <span className="text-gray-200">{packCount} AR packs</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Sparkles className={`h-4 w-4 ${isActive ? 'text-yellow-400' : 'text-gray-500'}`} />
                <span className="text-gray-200">{iconicCount} Iconic Moments</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={() => router.push('/remix')}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <Zap className="h-4 w-4 mr-2" /> Create Remix
            </Button>
            <Button
              onClick={() => router.push('/leaderboard')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Leaderboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
