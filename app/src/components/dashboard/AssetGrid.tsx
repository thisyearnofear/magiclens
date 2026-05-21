import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette } from 'lucide-react';
import { ArtistAsset } from '@/lib/sdk';

interface AssetGridProps {
  assets: ArtistAsset[];
  onNavigate: (path: string) => void;
}

export function AssetGrid({ assets, onNavigate }: AssetGridProps) {
  return (
    <div className="lg:col-span-1 order-2 lg:order-3">
      <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4">Recent Assets</h3>
      <div className="space-y-4">
        {assets.slice(0, 3).map((asset) => (
          <Card key={asset.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Palette className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">{asset.name}</h4>
                  <p className="text-gray-400 text-sm">{asset.category}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {asset.asset_type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {asset.usage_count} uses
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {assets.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">No assets available yet.</p>
              <Button variant="secondary" className="mt-2 bg-white/10 text-white hover:bg-white/20" onClick={() => onNavigate('/assets')}>
                Browse Assets
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
