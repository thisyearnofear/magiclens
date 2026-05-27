import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Play, Trophy, Flag } from 'lucide-react';
import type { Video } from '@/lib/sdk';

interface ClipPickerProps {
  recentClips: Video[];
  onSelect: (clip: Video) => void;
  onUploadNew: () => void;
}

const DEMO_CLIPS: { id: string; title: string; description: string; icon: React.ReactNode; videoUrl: string }[] = [
  {
    id: 'demo-goal',
    title: 'Match-winning Goal',
    description: 'Last-minute goal celebration — great for confetti + flag halos',
    icon: <Flag className="h-10 w-10 text-green-400" />,
    videoUrl: '/clips/demo1.mp4',
  },
  {
    id: 'demo-trophy',
    title: 'Trophy Lift Ceremony',
    description: 'Captain lifting the trophy — perfect for confetti burst overlay',
    icon: <Trophy className="h-10 w-10 text-yellow-400" />,
    videoUrl: '/clips/demo2.mp4',
  },
  {
    id: 'demo-celebration',
    title: 'Fan Celebration',
    description: 'Crowd erupting — ideal for flag halos and commentary bubbles',
    icon: <Play className="h-10 w-10 text-blue-400" />,
    videoUrl: '/clips/demo3.mp4',
  },
];

export function ClipPicker({ recentClips, onSelect, onUploadNew }: ClipPickerProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Match Moment</h2>
        <p className="text-gray-300">Pick a World Cup clip to remix with AR overlays</p>
      </div>

      {/* Demo clips for hackathon */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Featured Match Moments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_CLIPS.map((clip) => (
            <Card
              key={clip.id}
              className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-400/50 transition-all cursor-pointer group overflow-hidden"
              onClick={() => onSelect({ ...clip, file_path: clip.videoUrl, category: 'sports', duration: 12, uploader_id: 'demo' } as unknown as Video)}
              onMouseEnter={(e) => {
                const video = e.currentTarget.querySelector('video') as HTMLVideoElement | null;
                if (video) { video.currentTime = 0; video.play().catch(() => {}); }
              }}
              onMouseLeave={(e) => {
                const video = e.currentTarget.querySelector('video') as HTMLVideoElement | null;
                if (video) { video.pause(); video.currentTime = 0; }
              }}
            >
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-900 relative">
                  <video
                    src={clip.videoUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform">
                      {clip.icon}
                    </div>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h4 className="text-white font-semibold mb-1">{clip.title}</h4>
                  <p className="text-gray-300 text-xs">{clip.description}</p>
                </div>
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
                    <Play className="h-8 w-8 text-gray-300" />
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
