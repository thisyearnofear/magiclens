import { ArrowLeft, Play, Layers, Send, Zap, CircleCheck, Circle } from "lucide-react";
import React, { useState, useEffect } from 'react';
import OverlayEditor from './OverlayEditor';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collaborationServiceGetCollaboration, 
  collaborationServiceGetCollaborationOverlays,
  collaborationServiceUpdateCollaborationStatus,
  videoServiceGetVideo,
  assetServiceGetMyAssets
} from '@/lib/sdk';
import { Collaboration, Overlay, Video, ArtistAsset } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';


export default function CollaborationWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [assets, setAssets] = useState<ArtistAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCollaborationData();
  }, [id]);

  const loadCollaborationData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Load collaboration details
      const collabResponse = await collaborationServiceGetCollaboration({
        body: { collaboration_id: id }
      });
      
      if (collabResponse.data) {
        setCollaboration(collabResponse.data);
        
        // Load associated video
        const videoResponse = await videoServiceGetVideo({
          body: { video_id: collabResponse.data.video_id }
        });
        if (videoResponse.data) {
          setVideo(videoResponse.data);
        }
        
        // Load overlays
        const overlaysResponse = await collaborationServiceGetCollaborationOverlays({
          body: { collaboration_id: id }
        });
        if (overlaysResponse.data) {
          setOverlays(overlaysResponse.data);
        }
      }
      
      // Load user's assets for potential use
      const assetsResponse = await assetServiceGetMyAssets();
      if (assetsResponse.data) {
        setAssets(assetsResponse.data);
      }
    } catch (error) {
      console.error('Error loading collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string, notes?: string, feedbackText?: string) => {
    if (!collaboration) return;
    
    setUpdating(true);
    try {
      const response = await collaborationServiceUpdateCollaborationStatus({
        body: {
          collaboration_id: collaboration.id!,
          status,
          submission_notes: notes || null,
          feedback: feedbackText || null
        }
      });
      
      if (response.data) {
        setCollaboration(response.data);
        if (status === 'submitted') {
          setSubmissionNotes('');
        }
        if (status === 'approved' || status === 'rejected') {
          setFeedback('');
        }
      }
    } catch (error) {
      console.error('Error updating collaboration status:', error);
      alert('Failed to update collaboration status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading collaboration workspace...</div>
      </div>
    );
  }

  if (!collaboration || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 border-white/20 max-w-md text-center">
          <CardContent className="p-8">
            <Circle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Collaboration Not Found</h2>
            <p className="text-gray-300 mb-4">This collaboration doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'submitted': return 'bg-purple-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'claimed': return 'Claimed';
      case 'in_progress': return 'In Progress';
      case 'submitted': return 'Submitted';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
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
                <h1 className="text-xl font-bold text-white">Collaboration Workspace</h1>
              </div>
            </div>
            
            <Badge className={getStatusColor(collaboration.status!)}>
              {getStatusText(collaboration.status!)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>{video.title}</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {video.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4">
                  {video.file_path ? (
                    <video 
                      src={video.file_path}
                      controls
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-white text-center">
                      <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Video preview not available</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <Badge variant="outline">{video.category}</Badge>
                  <span>{video.duration}s duration</span>
                  <span>Revenue split: {((collaboration.revenue_split || 0.7) * 100).toFixed(0)}% artist</span>
                </div>
              </CardContent>
            </Card>

            {/* Overlay Editor */}
            {video && (
              <OverlayEditor
                videoUrl={video.file_path}
                videoDuration={video.duration}
                initialOverlays={overlays.map(overlay => ({
                  id: overlay.id!,
                  assetUrl: '/placeholder-overlay.png', // Would map from asset_id
                  name: `Overlay ${overlay.layer_order}`,
                  position: {
                    x: overlay.position_data.x || 0,
                    y: overlay.position_data.y || 0,
                    scaleX: overlay.position_data.scaleX || 1,
                    scaleY: overlay.position_data.scaleY || 1,
                    angle: overlay.position_data.angle || 0
                  },
                  timing: {
                    startTime: overlay.timing_data.startTime || 0,
                    endTime: overlay.timing_data.endTime || video.duration,
                    fadeIn: overlay.timing_data.fadeIn || 0,
                    fadeOut: overlay.timing_data.fadeOut || 0
                  },
                  layerOrder: overlay.layer_order || 1,
                  visible: true
                }))}
                onOverlayUpdate={(updatedOverlays) => {
                  console.log('Overlays updated:', updatedOverlays);
                  // Here we would sync back to the backend
                }}
                onTimeUpdate={(currentTime) => {
                  console.log('Video time:', currentTime);
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Collaboration Status */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Collaboration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {collaboration.status === 'claimed' && (
                  <Button
                    onClick={() => updateStatus('in_progress')}
                    disabled={updating}
                    className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                  >
                    Start Working
                  </Button>
                )}

                {collaboration.status === 'in_progress' && (
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-white">Submission Notes</Label>
                    <Textarea
                      id="notes"
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="Describe your overlay work..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      rows={3}
                    />
                    <Button
                      onClick={() => updateStatus('submitted', submissionNotes)}
                      disabled={updating}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Review
                    </Button>
                  </div>
                )}

                {collaboration.status === 'submitted' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <p className="text-purple-300 font-medium">Waiting for Review</p>
                      <p className="text-gray-300 text-sm">The videographer will review your submission.</p>
                    </div>
                    
                    {collaboration.submission_notes && (
                      <div>
                        <Label className="text-white">Your Notes:</Label>
                        <p className="text-gray-300 text-sm bg-white/5 p-2 rounded">
                          {collaboration.submission_notes}
                        </p>
                      </div>
                    )}
                    
                    {/* Videographer actions would go here */}
                    <div className="space-y-2">
                      <Label htmlFor="feedback" className="text-white">Feedback (Optional)</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide feedback..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => updateStatus('approved', undefined, feedback)}
                          disabled={updating}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          <CircleCheck className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateStatus('rejected', undefined, feedback)}
                          disabled={updating}
                          variant="destructive"
                          className="flex-1"
                        >
                          <Circle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {collaboration.status === 'approved' && (
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <p className="text-green-300 font-medium flex items-center">
                      <CircleCheck className="h-4 w-4 mr-2" />
                      Approved!
                    </p>
                    <p className="text-gray-300 text-sm">This collaboration has been approved and is ready for rendering.</p>
                  </div>
                )}

                {collaboration.status === 'rejected' && (
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <p className="text-red-300 font-medium flex items-center">
                      <Circle className="h-4 w-4 mr-2" />
                      Rejected
                    </p>
                    <p className="text-gray-300 text-sm">This collaboration was rejected. You can make changes and resubmit.</p>
                  </div>
                )}

                {collaboration.feedback && (
                  <div className="mt-4">
                    <Label className="text-white">Feedback:</Label>
                    <p className="text-gray-300 text-sm bg-white/5 p-2 rounded">
                      {collaboration.feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Asset Library */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">My Assets</CardTitle>
                <CardDescription className="text-gray-300">
                  Drag assets to add overlays
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assets.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {assets.slice(0, 6).map((asset) => (
                      <div
                        key={asset.id}
                        className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-2 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <div className="w-full h-full bg-black/20 rounded flex items-center justify-center">
                          <span className="text-white text-xs text-center">{asset.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    <p>No assets available</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => navigate('/upload-asset')}
                    >
                      Upload Assets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}