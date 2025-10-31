import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoServiceGetVideos, videoServiceSearchVideos, videoServiceGetVideoCategories, collaborationServiceStartCollaboration } from '@/lib/sdk';
import { Video } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, Eye, Users, Zap, Sparkles } from 'lucide-react';
import VideoPlayer from '@/components/ui/VideoPlayer';

export default function VideoGallery() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collaborating, setCollaborating] = useState<string | null>(null);

  const categories = ['all', 'urban', 'nature', 'indoor', 'street', 'park', 'office'];

  useEffect(() => {
    loadVideos();
  }, [selectedCategory]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await videoServiceGetVideos({
        body: {
          category: selectedCategory === 'all' ? null : selectedCategory,
          limit: 24,
          offset: 0
        }
      });

      if (response.data) {
        setVideos(response.data);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadVideos();
      return;
    }

    setLoading(true);
    try {
      const response = await videoServiceSearchVideos({
        body: {
          query: searchQuery,
          category: selectedCategory === 'all' ? null : selectedCategory,
          limit: 24
        }
      });

      if (response.data) {
        setVideos(response.data);
      }
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCollaboration = async (videoId: string) => {
    setCollaborating(videoId);
    try {
      const response = await collaborationServiceStartCollaboration({
        body: {
          video_id: videoId,
          revenue_split: 0.7
        }
      });

      if (response.data) {
        navigate(`/collaboration/${response.data.id}`);
      }
    } catch (error) {
      console.error('Error starting collaboration:', error);
      alert('Failed to start collaboration. You may already have an active collaboration on this video.');
    } finally {
      setCollaborating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-yellow-400" />
                <h1 className="text-xl font-bold text-white">Video Gallery</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} className="bg-yellow-400 text-black hover:bg-yellow-500">
              Search
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-600 rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Videos Found</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery ? 'Try adjusting your search terms or filters.' : 'No videos available in this category.'}
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); loadVideos(); }}>
                View All Videos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors group">
                <CardContent className="p-0">
                  {/* Video Preview */}
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                    <VideoPlayer
                      video={video}
                      className="w-full h-full object-cover"
                      muted
                      hoverToPlay
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => navigate(`/ai-enhance/${video.id}`)}
                          className="bg-yellow-400 text-black hover:bg-yellow-500"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Enhance
                        </Button>
                        <Button
                          onClick={() => handleStartCollaboration(video.id!)}
                          disabled={collaborating === video.id}
                          variant="outline"
                          className="text-white border-white/40"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {collaborating === video.id ? 'Starting...' : 'Manual'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2 line-clamp-1">{video.title}</h3>

                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {video.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {video.duration}s
                      </Badge>
                    </div>

                    {video.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{video.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{video.view_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{video.collaboration_count}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {videos.length > 0 && videos.length % 24 === 0 && (
          <div className="text-center mt-8">
            <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              Load More Videos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}