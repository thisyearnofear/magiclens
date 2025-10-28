import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useComputerVision } from '@/hooks/use-computer-vision';
import { useRealtimeCollaboration } from '@/hooks/use-realtime-collaboration';
import { Target, Sparkles, Zap, Loader, Brain, Users } from 'lucide-react';
import { EnhancedOverlayData } from '@/types/enhanced-overlay-types';
import ComputerVisionVisualization from '@/components/ComputerVisionVisualization';

interface SmartOverlayPlacementProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  overlays: EnhancedOverlayData[];
  setOverlays: React.Dispatch<React.SetStateAction<EnhancedOverlayData[]>>;
  selectedOverlay: string | null;
  setSelectedOverlay: React.Dispatch<React.SetStateAction<string | null>>;
  onPlaceOverlay: (position: { x: number; y: number; width: number; height: number; scaleX: number; scaleY: number; angle: number }) => void;
  videoId?: string; // UUID of the video for pose analysis
  collaborationId?: string; // For real-time collaboration
  userId?: string;
  username?: string;
}

export default function SmartOverlayPlacement({
  videoRef,
  canvasRef,
  overlays,
  setOverlays,
  selectedOverlay,
  setSelectedOverlay,
  onPlaceOverlay,
  videoId,
  collaborationId,
  userId,
  username
}: SmartOverlayPlacementProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);

  const { analyzeVideoPoses, getSmartPlacement, results, isProcessing, error, clearResults } = useComputerVision();

  // Real-time collaboration hook
  const {
    isConnected: isCollaborationConnected,
    broadcastPoseAnalysis,
    currentPoseAnalysis
  } = useRealtimeCollaboration(
    collaborationId || '',
    userId || '',
    username || 'Anonymous',
    overlays,
    setOverlays,
    (poseUpdate) => {
      // Handle incoming pose analysis updates from other users
      console.log('Received pose analysis update:', poseUpdate);
    }
  );

  const analyzeVideo = async () => {
    if (!videoId) {
      console.error('No video ID provided for analysis');
      return;
    }

    try {
      // Analyze video poses
      await analyzeVideoPoses(videoId);
      setShowVisualization(true);

      // Broadcast to collaborators if connected
      if (isCollaborationConnected && results?.poseAnalysis) {
        broadcastPoseAnalysis(videoId, results.poseAnalysis);
      }
    } catch (err) {
      console.error('Error analyzing video:', err);
    }
  };

  const getPlacementSuggestions = async () => {
    if (!videoId || !videoRef.current) return;

    try {
      // Get smart placement suggestions for a typical overlay size
      const overlayWidth = 200;
      const overlayHeight = 200;

      await getSmartPlacement(videoId, overlayWidth, overlayHeight);

      // Broadcast to collaborators if connected
      if (isCollaborationConnected && results?.poseAnalysis && results?.smartPlacement) {
        broadcastPoseAnalysis(videoId, results.poseAnalysis, results.smartPlacement);
      }
    } catch (err) {
      console.error('Error getting placement suggestions:', err);
    }
  };

  const placeSmartOverlay = () => {
    if (!results?.smartPlacement?.suggestions?.[0]) return;

    const bestSuggestion = results.smartPlacement.suggestions[0];
    onPlaceOverlay(bestSuggestion.position);
  };

  const clearAnalysis = () => {
    clearResults();
    setShowVisualization(false);
  };

  // Analyze video when enabled and videoId is available
  useEffect(() => {
    if (isEnabled && videoId && !results?.poseAnalysis) {
      analyzeVideo();
    }
  }, [isEnabled, videoId]);

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
      <CardTitle className="text-white flex items-center space-x-2">
      <Brain className="h-5 w-5 text-green-400" />
      <span>Pose Analysis & Smart Placement</span>
        {isCollaborationConnected && (
            <div className="flex items-center space-x-1 text-xs text-green-400">
              <Users className="h-3 w-3" />
              <span>Live</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-3">
        <Button
        variant={isEnabled ? "default" : "outline"}
        onClick={() => setIsEnabled(!isEnabled)}
        className={isEnabled ? "bg-green-400 text-black hover:bg-green-500" : ""}
        >
        {isProcessing ? (
        <>
        <Loader className="h-4 w-4 mr-2 animate-spin" />
        Analyzing...
        </>
        ) : (
        <>
        <Brain className="h-4 w-4 mr-2" />
        {isEnabled ? "Disable Pose Analysis" : "Enable Pose Analysis"}
        </>
        )}
        </Button>

        {isEnabled && videoId && !results?.poseAnalysis && !isProcessing && (
        <Button
        variant="outline"
        onClick={analyzeVideo}
        >
        <Zap className="h-4 w-4 mr-2" />
        Analyze Video Poses
        </Button>
        )}

        {isEnabled && results?.poseAnalysis && !results?.smartPlacement && !isProcessing && (
        <Button
        variant="outline"
        onClick={getPlacementSuggestions}
        >
        <Target className="h-4 w-4 mr-2" />
        Get Smart Placement
        </Button>
        )}

          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              <span className="text-white">Processing pose analysis...</span>
            </div>
          )}
        </div>
        
        {showVisualization && results && (
        <div className="space-y-3">
        <ComputerVisionVisualization
        poseAnalysis={results.poseAnalysis}
        smartPlacement={results.smartPlacement}
        videoWidth={videoRef.current?.videoWidth || 640}
        videoHeight={videoRef.current?.videoHeight || 480}
          isLoading={isProcessing}
            />

        {results.smartPlacement?.suggestions && results.smartPlacement.suggestions.length > 0 && (
        <div className="p-3 bg-green-400/10 rounded-lg border border-green-400/20">
        <h4 className="text-green-400 font-medium text-sm mb-2">Smart Placement Available</h4>

          <div className="flex space-x-2">
            <Button
              size="sm"
            onClick={placeSmartOverlay}
          className="flex-1 bg-green-400 text-black hover:bg-green-500"
        >
            <Sparkles className="h-4 w-4 mr-2" />
              Place Overlay
              </Button>

              <Button
              size="sm"
            variant="outline"
            onClick={clearAnalysis}
          >
              Clear
          </Button>
        </div>
        </div>
        )}
        </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30 text-red-300 text-sm">
            Error: {error}
          </div>
        )}
        
        <div className="text-xs text-gray-400 space-y-1">
        <p>Pose-aware placement analyzes human movement in your video to suggest optimal overlay positions.</p>
        <p>AI detects keypoints and motion patterns to avoid blocking important action areas.</p>
        </div>
        </CardContent>
        </Card>
  );
}