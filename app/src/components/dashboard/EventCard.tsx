import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Users, Package } from 'lucide-react';

interface EventCardProps {
  name: string;
  dateRange: string;
  packCount: number;
  remixCount: number;
  rewardPool: string;
  isActive: boolean;
}

export function EventCard({
  name = 'FIFA World Cup 2026',
  dateRange = 'Jun 8 — Jul 8, 2026',
  packCount = 6,
  remixCount = 1247,
  rewardPool = '$100 USDT',
  isActive = true,
}: EventCardProps) {
  const navigate = useNavigate();

  return (
    <Card className={`bg-gradient-to-r ${
      isActive
        ? 'from-yellow-400/15 to-purple-400/15 border-yellow-400/30'
        : 'from-gray-500/10 to-gray-600/10 border-white/10'
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
                <Badge className="bg-green-500/20 text-green-300 text-xs border border-green-500/30">
                  Live Event
                </Badge>
              )}
            </div>
            <p className="text-gray-400 text-sm">{dateRange}</p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Package className={`h-4 w-4 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                <span className="text-gray-300">{packCount} AR packs</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Users className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                <span className="text-gray-300">{remixCount.toLocaleString()} remixes</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Trophy className={`h-4 w-4 ${isActive ? 'text-yellow-400' : 'text-gray-500'}`} />
                <span className="text-yellow-400 font-medium">{rewardPool} prize pool</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={() => navigate('/remix')}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <Zap className="h-4 w-4 mr-2" /> Create Remix
            </Button>
            <Button
              onClick={() => navigate('/leaderboard')}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Leaderboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
