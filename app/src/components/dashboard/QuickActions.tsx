import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, Palette, Eye, TrendingUp, Zap } from 'lucide-react';

interface QuickActionsProps {
  isGuest: boolean;
  userType: string;
  onNavigate: (path: string) => void;
  onShowGallery: () => void;
}

export function QuickActions({ isGuest, userType, onNavigate, onShowGallery }: QuickActionsProps) {
  const isVideographer = userType === 'videographer' || userType === 'both';
  const isArtist = userType === 'artist' || userType === 'both';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 md:mb-8">
      {/* Create Remix — always visible, primary CTA */}
      <Card
        className="bg-yellow-400/10 border-yellow-400/40 hover:bg-yellow-400/20 transition-colors cursor-pointer group col-span-1"
        onClick={() => onNavigate('/remix')}
      >
        <CardContent className="p-6 text-center">
          <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold">Create Remix</h3>
          <p className="text-gray-300 text-sm">Add AR overlays & mint</p>
          <Badge className="mt-2 bg-yellow-400 text-black text-xs font-bold">
            World Cup 2026
          </Badge>
        </CardContent>
      </Card>

      {!isGuest && (
        <Card
          className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer group"
          onClick={() => onNavigate('/upload-video')}
        >
          <CardContent className="p-6 text-center relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <kbd className="px-2 py-1 text-xs bg-black/50 text-white rounded">⌘V</kbd>
            </div>
            <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold">Upload Video</h3>
            <p className="text-gray-300 text-sm">Share your environmental footage</p>
            {userType === 'artist' && (
              <Badge className="mt-2 bg-blue-500/20 text-blue-300 text-xs">
                Recommended for you
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {!isGuest && userType === 'videographer' && (
        <Card
          className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer group"
          onClick={onShowGallery}
        >
          <CardContent className="p-6 text-center relative">
            <Camera className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold">Get Inspired</h3>
            <p className="text-gray-300 text-sm">Browse environmental footage examples</p>
            <Badge className="mt-2 bg-green-500/20 text-green-300 text-xs">
              Professional Examples
            </Badge>
          </CardContent>
        </Card>
      )}

      {!isGuest && (
        <Card
          className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer group"
          onClick={() => onNavigate('/upload-asset')}
        >
          <CardContent className="p-6 text-center relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <kbd className="px-2 py-1 text-xs bg-black/50 text-white rounded">⌘A</kbd>
            </div>
            <Palette className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold">Upload Asset</h3>
            <p className="text-gray-300 text-sm">Add new overlay animations</p>
            {userType === 'videographer' && (
              <Badge className="mt-2 bg-purple-500/20 text-purple-300 text-xs">
                Recommended for you
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <Card
        className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer group"
        onClick={() => onNavigate('/videos')}
      >
        <CardContent className="p-6 text-center relative">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <kbd className="px-2 py-1 text-xs bg-black/50 text-white rounded">⌘B</kbd>
          </div>
          <Eye className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold">Browse Videos</h3>
          <p className="text-gray-300 text-sm">Discover collaboration opportunities</p>
        </CardContent>
      </Card>

      <Card
        className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer group"
        onClick={() => onNavigate('/assets')}
      >
        <CardContent className="p-6 text-center relative">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <kbd className="px-2 py-1 text-xs bg-black/50 text-white rounded">⌘L</kbd>
          </div>
          <TrendingUp className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold">Asset Library</h3>
          <p className="text-gray-300 text-sm">Explore overlay options</p>
        </CardContent>
      </Card>
    </div>
  );
}
