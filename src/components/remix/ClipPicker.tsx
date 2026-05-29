import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Play, Trophy, Flag, Search, Clock, User } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api-base';
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

const SUGGESTED = [
  { label: 'Goal Celebrations', query: 'soccer goal celebration football' },
  { label: 'Stadium Crowds', query: 'football stadium crowd fans cheering' },
  { label: 'Match Action', query: 'soccer match football game playing' },
  { label: 'Trophy Moments', query: 'trophy celebration sports champion' },
  { label: 'Fan Culture', query: 'football fans crowd waving flags' },
];

interface PexelsVideo {
  id: number;
  title: string;
  video_url: string;
  preview_url: string;
  duration: number;
  photographer: string;
  photographer_url: string;
}

export function ClipPicker({ recentClips, onSelect, onUploadNew }: ClipPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PexelsVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
      if (apiKey) {
        const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`, {
          headers: { Authorization: apiKey },
        });
        const data = await res.json();
        const results: PexelsVideo[] = (data.videos || []).map((v: any) => {
          const hd = (v.video_files || []).find((f: any) => f.quality === 'hd') || v.video_files?.[0];
          return {
            id: v.id,
            title: (v.url || '').split('/').at(-2)?.replace(/-/g, ' ')?.replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Pexels Video',
            video_url: hd?.link || '',
            preview_url: v.image,
            duration: v.duration || 0,
            photographer: v.user?.name || 'Unknown',
            photographer_url: v.user?.url || 'https://www.pexels.com',
          };
        }).filter((v: PexelsVideo) => v.video_url);
        setSearchResults(results);
      } else {
        const res = await fetch(`${getApiBaseUrl()}/api/pexels/search?q=${encodeURIComponent(query)}&limit=9`);
        const data = await res.json();
        setSearchResults(data.success ? data.results : []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectPexelsClip = (v: PexelsVideo) => {
    onSelect({
      id: `pexels-${v.id}`,
      title: v.title,
      file_path: v.video_url,
      category: 'sports',
      duration: v.duration,
      uploader_id: 'pexels',
    } as unknown as Video);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Match Moment</h2>
        <p className="text-gray-300">Pick a World Cup clip to remix with AR overlays</p>
      </div>

      {/* Demo clips */}
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

      {/* Stock footage search */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Find Sports Clips</h3>
        <p className="text-gray-400 text-sm mb-4">Search free stock footage from Pexels — royalty-free, no upload needed</p>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch(searchQuery)}
              placeholder="soccer goal, stadium crowd, trophy lift…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-yellow-400/50"
            />
          </div>
          <Button
            onClick={() => doSearch(searchQuery)}
            loading={isSearching}
            className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
          >
            Search
          </Button>
        </div>

        {/* Suggested queries */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED.map((s) => (
            <button
              key={s.label}
              onClick={() => { setSearchQuery(s.label); doSearch(s.query); }}
              className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search results */}
        {isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!isSearching && hasSearched && searchResults.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">No clips found. Try a different search.</p>
        )}

        {!isSearching && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {searchResults.map((v) => (
              <Card
                key={v.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-400/50 transition-all cursor-pointer group overflow-hidden"
                onClick={() => selectPexelsClip(v)}
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
                      src={v.video_url}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {v.duration}s
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-white text-sm font-medium truncate">{v.title}</h4>
                    <a
                      href={v.photographer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 text-xs flex items-center gap-1 mt-1 hover:text-yellow-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <User className="h-3 w-3" /> {v.photographer} / Pexels
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload new */}
      <div className="text-center">
        <Button
          onClick={onUploadNew}
          variant="outline"
          className="border-white/40 text-white bg-white/5 hover:bg-white/15"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Your Own Clip
        </Button>
      </div>
    </div>
  );
}
