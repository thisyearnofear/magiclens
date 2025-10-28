import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Zap, Activity, Clock, Database } from 'lucide-react';

interface PoseAnalysis {
  pose_sequences: number[][][];
  normalized_poses: number[][][];
  confidence_avg: number;
  frame_count: number;
  processing_time_ms: number;
  cached: boolean;
}

interface SmartPlacementResult {
  suggestions: Array<{
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
  }>;
  analysis_metadata: {
    pose_aware: boolean;
    motion_level: string;
    safe_zones_count: number;
  };
}

interface ComputerVisionVisualizationProps {
  poseAnalysis: PoseAnalysis | null;
  smartPlacement: SmartPlacementResult | null;
  videoWidth: number;
  videoHeight: number;
  isLoading?: boolean;
}

export default function ComputerVisionVisualization({
poseAnalysis,
smartPlacement,
videoWidth,
videoHeight,
  isLoading = false
}: ComputerVisionVisualizationProps) {
  const getMotionLevelColor = (motionLevel: string) => {
  switch (motionLevel.toLowerCase()) {
  case 'high':
  return 'text-red-400';
case 'moderate':
  return 'text-yellow-400';
case 'low':
  return 'text-green-400';
default:
  return 'text-gray-400';
}
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
};

// Get pose keypoints for visualization (first frame of first sequence)
const getPoseKeypoints = () => {
if (!poseAnalysis?.pose_sequences?.[0]?.[0]) return [];

const frame = poseAnalysis.pose_sequences[0][0];
const keypoints = [];

// Extract x,y coordinates (every 4 values: x, y, z, visibility)
for (let i = 0; i < frame.length; i += 4) {
if (i + 1 < frame.length) {
keypoints.push({
      x: frame[i] * videoWidth, // Normalize to video dimensions
        y: frame[i + 1] * videoHeight,
          confidence: frame[i + 3] || 0
        });
      }
    }

    return keypoints;
  };

  const poseKeypoints = getPoseKeypoints();

  return (
  <Card className="bg-white/10 border-white/20">
  <CardHeader>
  <CardTitle className="text-white flex items-center space-x-2">
  <Activity className="h-5 w-5 text-green-400" />
  <span>Pose Analysis & Smart Placement</span>
  </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
  <div className="relative bg-black/20 rounded-lg overflow-hidden" style={{
  width: '100%',
  height: '200px',
  backgroundImage: `
  linear-gradient(45deg, #2d3748 25%, transparent 25%),
  linear-gradient(-45deg, #2d3748 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #2d3748 75%),
  linear-gradient(-45deg, transparent 75%, #2d3748 75%)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
  }}>
  {/* Loading overlay */}
  {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Analyzing pose data...</p>
              </div>
            </div>
          )}

          {/* Visualization overlay */}
          <div className="absolute inset-0">
  {/* Pose keypoints */}
  {poseKeypoints.map((keypoint, index) => (
  <div
  key={index}
  className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 border border-white/50"
  style={{
  left: `${(keypoint.x / videoWidth) * 100}%`,
  top: `${(keypoint.y / videoHeight) * 100}%`,
  backgroundColor: keypoint.confidence > 0.5 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
  }}
  />
  ))}

  {/* Smart placement suggestions */}
  {smartPlacement?.suggestions?.map((suggestion, index) => (
  <div
  key={`placement-${index}`}
  className="absolute border-2 border-dashed border-yellow-400 rounded opacity-70"
  style={{
      left: `${(suggestion.position.x / videoWidth) * 100}%`,
        top: `${(suggestion.position.y / videoHeight) * 100}%`,
        width: `${(suggestion.position.width / videoWidth) * 100}%`,
        height: `${(suggestion.position.height / videoHeight) * 100}%`,
        backgroundColor: 'rgba(251, 191, 36, 0.1)'
    }}
  >
  <div className="absolute -top-6 left-0 text-xs text-yellow-400 bg-black/50 px-1 rounded">
    {suggestion.anchor_type} ({(suggestion.confidence * 100).toFixed(0)}%)
  </div>
  </div>
  ))}
  </div>
  </div>

  <div className="grid grid-cols-2 gap-2 text-xs">
  <div className="bg-green-500/20 p-2 rounded text-center">
  <div className={`font-medium ${getConfidenceColor(poseAnalysis?.confidence_avg || 0)}`}>
  {((poseAnalysis?.confidence_avg || 0) * 100).toFixed(1)}%
  </div>
  <div className="text-gray-400">Avg Confidence</div>
  </div>
  <div className="bg-blue-500/20 p-2 rounded text-center">
  <div className={`font-medium ${getMotionLevelColor(smartPlacement?.analysis_metadata?.motion_level || 'unknown')}`}>
    {smartPlacement?.analysis_metadata?.motion_level || 'Unknown'}
  </div>
  <div className="text-gray-400">Motion Level</div>
  </div>
  </div>

  <div className="grid grid-cols-2 gap-2 text-xs">
  <div className="bg-purple-500/20 p-2 rounded text-center">
  <div className="text-purple-400 font-medium flex items-center justify-center space-x-1">
  <Clock className="h-3 w-3" />
  <span>{poseAnalysis?.processing_time_ms || 0}ms</span>
  </div>
  <div className="text-gray-400">Processing Time</div>
  </div>
  <div className="bg-orange-500/20 p-2 rounded text-center">
  <div className="text-orange-400 font-medium flex items-center justify-center space-x-1">
  <Database className="h-3 w-3" />
    <span>{poseAnalysis?.cached ? 'Yes' : 'No'}</span>
    </div>
      <div className="text-gray-400">Cached</div>
    </div>
  </div>

  <div className="text-xs text-gray-400">
  <p>Pose analysis detects human keypoints and suggests optimal overlay placements that avoid blocking important movement areas.</p>
  </div>
  </CardContent>
  </Card>
  );
}