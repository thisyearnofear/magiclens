import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Play, Edit, Trash2, Sparkles } from 'lucide-react';
import { Video } from '@/lib/sdk';

interface VideoGridProps {
  videos: Video[];
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  onNavigate: (path: string) => void;
}

function VideoThumbnail({ video }: { video: Video }) {
  if (video.file_path) {
    return (
      <video
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => {
          const videoEl = document.createElement('video');
          videoEl.src = video.file_path!;
          videoEl.controls = true;
          videoEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;max-width:90vw;max-height:90vh;background:black;';
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:9998;';
          overlay.onclick = () => { document.body.removeChild(overlay); document.body.removeChild(videoEl); };
          document.body.appendChild(overlay);
          document.body.appendChild(videoEl);
        }}
      >
        <source src={video.file_path} type="video/mp4" />
      </video>
    );
  }

  return (
    <Camera className="h-6 w-6 lg:h-8 lg:w-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
  );
}

export function VideoGrid({ videos, onEdit, onDelete, onNavigate }: VideoGridProps) {
  return (
    <div className="lg:col-span-1 order-1 lg:order-2">
      <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4">Recent Videos</h3>
      <div className="space-y-4">
        {videos.slice(0, 3).map((video) => (
          <Card key={video.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-3 lg:p-4">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
                {/* Video Info Section */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Video Thumbnail/Preview */}
                  <div className="relative w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg overflow-hidden flex-shrink-0">
                    <VideoThumbnail video={video} />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate text-sm lg:text-base">{video.title}</h4>
                    <p className="text-gray-400 text-xs lg:text-sm">{video.category}</p>
                    <div className="flex items-center space-x-1 lg:space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {video.view_count} views
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {video.collaboration_count} collaborations
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onNavigate(`/ai-enhance/${video.id}`)}
                    className="bg-yellow-400 text-black hover:bg-yellow-500 text-xs px-2 py-1 flex-1 lg:flex-none lg:w-20"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Enhance
                  </Button>
                  <div className="flex space-x-1 flex-1 lg:flex-none">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(video.id, video.title)}
                      className="text-xs px-2 py-1 bg-white/10 text-white hover:bg-white/20 flex-1 lg:w-10"
                    >
                      <Edit className="h-3 w-3 lg:mr-0" />
                      <span className="lg:hidden ml-1">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(video.id, video.title)}
                      className="text-xs px-2 py-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 lg:w-10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {videos.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">No videos available yet.</p>
              <Button variant="secondary" className="mt-2 bg-white/10 text-white hover:bg-white/20" onClick={() => onNavigate('/videos')}>
                Browse Videos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
