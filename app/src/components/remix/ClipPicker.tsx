import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Play, SoccerBall, Trophy } from 'lucide-react';
import type { Video } from '@/lib/sdk';

interface ClipPickerProps {
  recentClips: Video[];
  onSelect: (clip: Video) => void;
  onUploadNew: () => void;
}

const DEMO_CLIPS: { id: string; title: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'demo-goal',
    title: 'Match-winning Goal',
    description: 'Last-minute goal celebration — great for confetti + flag halos',
    icon: <SoccerBall className="h-10 w-10 text-green-400" />,
  },
  {
    id: 'demo-trophy',
    title: 'Trophy Lift Ceremony',
    description: 'Captain lifting the trophy — perfect for confetti burst overlay',
    icon: <Trophy className="h-10 w-10 text-yellow-400" />,
  },
  {
    id: 'demo-celebration',
    title: 'Fan Celebration',
    description: 'Crowd erupting — ideal for flag halos and commentary bubbles',
    icon: <Play className="h-10 w-10 text-blue-400" />,
  },
];

export function ClipPicker({ recentClips, onSelect, onUploadNew }: ClipPickerProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Match Moment</h2>
        <p className="text-gray-400">Pick a World Cup clip to remix with AR overlays</p>
      </div>

      {/* Demo clips for hackathon */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Featured Match Moments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_CLIPS.map((clip) => (
            <Card
              key={clip.id}
              className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-400/50 transition-all cursor-pointer group"
              onClick={() => onSelect(clip as unknown as Video)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">{clip.icon}</div>
                <h4 className="text-white font-semibold mb-1">{clip.title}</h4>
                <p className="text-gray-400 text-sm">{clip.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent clips from user */}
      {recentClips.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Clips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentClips.map((clip) => (
              <Card
                key={clip.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-400/50 transition-all cursor-pointer group"
                onClick={() => onSelect(clip)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                    <Play className="h-8 w-8 text-gray-500" />
                  </div>
                  <h4 className="text-white font-medium text-sm truncate">{clip.title || 'Untitled'}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload new */}
      <div className="text-center">
        <Button
          onClick={onUploadNew}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Your Own Clip
        </Button>
      </div>
    </div>
  );
}
