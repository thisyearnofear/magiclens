import { useState, useCallback } from 'react';
import { client } from '@/lib/sdk/client.gen';

// Types for pose-aware computer vision
interface PoseSequence {
  frames: number[][];
  normalized: boolean;
}

interface PoseAnalysis {
  pose_sequences: number[][][];
  normalized_poses: number[][][];
  confidence_avg: number;
  frame_count: number;
  processing_time_ms: number;
  cached: boolean;
}

interface PlacementSuggestion {
  position: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    width: number;
    height: number;
  };
  confidence: number;
  reason: string;
  anchor_type: string;
}

interface SmartPlacementResult {
  suggestions: PlacementSuggestion[];
  analysis_metadata: {
    pose_aware: boolean;
    motion_level: string;
    safe_zones_count: number;
  };
}

interface ComputerVisionResult {
  poseAnalysis: PoseAnalysis | null;
  smartPlacement: SmartPlacementResult | null;
}

export const useComputerVision = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ComputerVisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Analyze poses in a video using real backend API
  const analyzeVideoPoses = useCallback(async (videoId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await client.POST('/api/computer_vision/analyze_video_poses', {
        body: { video_id: videoId }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to analyze video poses');
      }

      const poseAnalysis: PoseAnalysis = {
        pose_sequences: response.data.pose_sequences || [],
        normalized_poses: response.data.normalized_poses || [],
        confidence_avg: response.data.confidence_avg || 0,
        frame_count: response.data.frame_count || 0,
        processing_time_ms: response.data.processing_time_ms || 0,
        cached: response.data.cached || false
      };

      const result: ComputerVisionResult = {
        poseAnalysis,
        smartPlacement: null
      };

      setResults(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Get smart overlay placement suggestions from backend
  const getSmartPlacement = useCallback(async (
    videoId: string,
    overlayWidth: number,
    overlayHeight: number,
    frameTimestamp?: number
  ) => {
    try {
      const response = await client.POST('/api/computer_vision/get_smart_placement', {
        body: {
          video_id: videoId,
          overlay_width: overlayWidth,
          overlay_height: overlayHeight,
          frame_timestamp: frameTimestamp || 0
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to get smart placement');
      }

      const smartPlacement: SmartPlacementResult = {
        suggestions: response.data.suggestions || [],
        analysis_metadata: response.data.analysis_metadata || {
          pose_aware: false,
          motion_level: 'unknown',
          safe_zones_count: 0
        }
      };

      // Update results with smart placement data
      setResults(prev => prev ? { ...prev, smartPlacement } : { poseAnalysis: null, smartPlacement });

      return smartPlacement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get smart placement';
      setError(errorMessage);
      throw err;
    }
  }, []);



  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    results,
    error,
    analyzeVideoPoses,
    getSmartPlacement,
    clearResults
  };
};