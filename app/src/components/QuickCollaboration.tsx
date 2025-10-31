import { Zap, Clock, ArrowRight, Sparkles, Users, TrendingUp, CircleCheck, Loader, Play, Edit, Check, X } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SmartOverlayRecommendations from './SmartOverlayRecommendations';
import VideoPlayer from '@/components/ui/VideoPlayer';

import {
  videoServiceGetVideo,
  collaborationServiceGetCollaboration,
  renderServiceQueueRender,
  videoServiceUpdateVideo
} from '@/lib/sdk';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuickCollaborationProps {
  videoId: string;
}

interface VideoData {
  id: string;
  title: string;
  description?: string;
  duration: number;
  file_path: string;
  thumbnail_path?: string;
  category: string;
}

interface CollaborationData {
  id: string;
  status: string;
  artist_id: string;
  revenue_split: number;
  overlay_count: number;
}

export default function QuickCollaboration({ videoId }: QuickCollaborationProps) {
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [collaboration, setCollaboration] = useState<CollaborationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [appliedOverlaysCount, setAppliedOverlaysCount] = useState(0);
  const [currentStep, setCurrentStep] = useState<'analyze' | 'select' | 'preview' | 'complete'>('analyze');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => {
    loadVideoData();
  }, [videoId]);

  const loadVideoData = async () => {
    try {
      console.log('QuickCollaboration - Loading video with ID:', videoId);

      if (!videoId || videoId === 'dashboard') {
        console.error('Invalid video ID:', videoId);
        setIsLoading(false);
        return;
      }

      const result = await videoServiceGetVideo({
        body: { video_id: videoId }
      });

      if (result.data) {
        const videoData = result.data as VideoData;
        setVideo(videoData);
        setEditCategory(videoData.category);
        setCurrentStep('select');
      }
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayApplied = (overlayData: any) => {
    setAppliedOverlaysCount(prev => prev + 1);

    // Set collaboration data from the first overlay
    if (!collaboration && overlayData.collaboration) {
      setCollaboration({
        id: overlayData.collaboration.id,
        status: overlayData.collaboration.status,
        artist_id: overlayData.collaboration.artist_id,
        revenue_split: overlayData.collaboration.revenue_split,
        overlay_count: 1
      });
    } else if (collaboration) {
      setCollaboration(prev => prev ? {
        ...prev,
        overlay_count: prev.overlay_count + 1
      } : null);
    }

    // Auto-advance to preview after first overlay
    if (appliedOverlaysCount === 0) {
      setTimeout(() => setCurrentStep('preview'), 1000);
    }
  };

  const handleCategoryUpdate = async () => {
    if (!video || editCategory === video.category) {
      setIsEditingCategory(false);
      return;
    }

    try {
      await videoServiceUpdateVideo({
        body: {
          video_id: videoId,
          category: editCategory
        }
      });

      setVideo(prev => prev ? { ...prev, category: editCategory } : null);
      setIsEditingCategory(false);
    } catch (error) {
      console.error('Failed to update category:', error);
      setEditCategory(video.category); // Reset on error
      setIsEditingCategory(false);
    }
  };

  const handleRenderVideo = async () => {
    if (!collaboration) return;

    setIsRendering(true);
    try {
      const result = await renderServiceQueueRender({
        body: {
          collaboration_id: collaboration.id,
          render_settings: {
            quality: 'high',
            format: 'mp4',
            resolution: '1920x1080'
          }
        }
      });

      if (result.data) {
        setCurrentStep('complete');
        // Navigate to collaboration workspace after a brief delay
        setTimeout(() => {
          navigate(`/collaboration/${collaboration.id}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to queue render:', error);
    } finally {
      setIsRendering(false);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'analyze': return <Sparkles className="h-5 w-5" />;
      case 'select': return <Zap className="h-5 w-5" />;
      case 'preview': return <Play className="h-5 w-5" />;
      case 'complete': return <CircleCheck className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'analyze': return 'AI Analysis';
      case 'select': return 'Select Overlays';
      case 'preview': return 'Preview & Render';
      case 'complete': return 'Complete!';
      default: return 'Processing';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 animate-spin text-yellow-400" />
            <span className="ml-3 text-white">Loading video...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">Video Not Found</h1>
            <Button onClick={() => navigate('/dashboard')} className="bg-yellow-400 text-black">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Enhancement Studio</h1>
            <p className="text-gray-300">Transform your video with intelligent overlay suggestions</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Progress Steps */}
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {['analyze', 'select', 'preview', 'complete'].map((step, index) => (
                <div key={step} className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === step ? 'bg-yellow-400 text-black' :
                    ['select', 'preview', 'complete'].indexOf(currentStep) > ['analyze', 'select', 'preview', 'complete'].indexOf(step) - 1 ?
                      'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                    {getStepIcon(step)}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${currentStep === step ? 'text-yellow-400' : 'text-gray-300'
                      }`}>
                      {getStepTitle(step)}
                    </p>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="h-5 w-5 text-gray-500 ml-6" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">{video.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Player */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <VideoPlayer video={video} controls />
                </div>

                {/* Video Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Category</span>
                    {isEditingCategory ? (
                      <div className="flex items-center space-x-2">
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger className="w-24 h-8 bg-gray-800 border-gray-600 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="urban">Urban</SelectItem>
                            <SelectItem value="nature">Nature</SelectItem>
                            <SelectItem value="indoor">Indoor</SelectItem>
                            <SelectItem value="street">Street</SelectItem>
                            <SelectItem value="park">Park</SelectItem>
                            <SelectItem value="office">Office</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleCategoryUpdate} className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" onClick={() => { setIsEditingCategory(false); setEditCategory(video.category); }} className="h-6 w-6 p-0 bg-gray-600 hover:bg-gray-700">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">{video.category}</Badge>
                        <Button size="sm" onClick={() => setIsEditingCategory(true)} className="h-6 w-6 p-0 bg-gray-700 hover:bg-gray-600">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {appliedOverlaysCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Overlays Applied</span>
                      <Badge className="bg-green-600">{appliedOverlaysCount}</Badge>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {currentStep === 'preview' && collaboration && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <Button
                      onClick={handleRenderVideo}
                      disabled={isRendering}
                      className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                    >
                      {isRendering ? (
                        <><Loader className="h-4 w-4 mr-2 animate-spin" />Rendering...</>
                      ) : (
                        <><Play className="h-4 w-4 mr-2" />Render Final Video</>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => navigate(`/collaboration/${collaboration.id}`)}
                      className="w-full"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Open Full Editor
                    </Button>
                  </div>
                )}

                {currentStep === 'complete' && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="text-center py-4">
                      <CircleCheck className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-white font-medium">Video Enhanced!</p>
                      <p className="text-gray-400 text-sm">Your render is processing</p>
                    </div>

                    <Button
                      onClick={() => navigate(`/collaboration/${collaboration?.id}`)}
                      className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      View Collaboration
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Smart Recommendations */}
          <div className="lg:col-span-2">
            {currentStep !== 'complete' ? (
              <SmartOverlayRecommendations
                videoId={videoId}
                videoDuration={30}
                onOverlayApplied={handleOverlayApplied}
                onCollaborationCreated={(collabId) => {
                  if (!collaboration) {
                    setCollaboration({
                      id: collabId,
                      status: 'active',
                      artist_id: 'unknown',
                      revenue_split: 0.7,
                      overlay_count: 1
                    });
                  }
                }}
              />
            ) : (
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-12 text-center">
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CircleCheck className="h-10 w-10 text-white" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Video Successfully Enhanced!
                      </h2>
                      <p className="text-gray-300">
                        Your video has been enhanced with {appliedOverlaysCount} AI-placed overlay{appliedOverlaysCount !== 1 ? 's' : ''}.
                        The final render is now processing.
                      </p>
                    </div>

                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{appliedOverlaysCount}</div>
                        <div className="text-gray-400 text-sm">Overlays Applied</div>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">~2min</div>
                        <div className="text-gray-400 text-sm">Render Time</div>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">HD</div>
                        <div className="text-gray-400 text-sm">Quality</div>
                      </div>
                    </div>

                    <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-yellow-400" />
                        <div className="text-left">
                          <p className="text-yellow-400 font-medium text-sm">Pro Tip</p>
                          <p className="text-gray-300 text-sm">
                            Share your enhanced video to get more engagement and discover new collaboration opportunities!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}