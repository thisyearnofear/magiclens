import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Square, Circle, Triangle, Zap } from 'lucide-react';

interface CVObject {
  id: string;
  type: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

interface CVSurface {
  id: string;
  type: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  normalVector: { x: number; y: number; z: number };
  confidence: number;
}

interface CVMotionPoint {
  id: string;
  centerX: number;
  centerY: number;
  velocity: { x: number; y: number };
  confidence: number;
}

interface ComputerVisionVisualizationProps {
  objects: CVObject[];
  surfaces: CVSurface[];
  motionPoints: CVMotionPoint[];
  videoWidth: number;
  videoHeight: number;
}

export default function ComputerVisionVisualization({
  objects,
  surfaces,
  motionPoints,
  videoWidth,
  videoHeight
}: ComputerVisionVisualizationProps) {
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'person':
        return <Square className="h-4 w-4" />;
      case 'vehicle':
        return <Square className="h-4 w-4" />;
      case 'animal':
        return <Circle className="h-4 w-4" />;
      case 'flat_surface':
        return <Square className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string, confidence: number) => {
    const opacity = Math.min(0.3 + (confidence * 0.7), 1);
    
    switch (type.toLowerCase()) {
      case 'person':
        return `rgba(59, 130, 246, ${opacity})`; // Blue
      case 'vehicle':
        return `rgba(16, 185, 129, ${opacity})`; // Green
      case 'animal':
        return `rgba(245, 158, 11, ${opacity})`; // Yellow
      case 'flat_surface':
        return `rgba(139, 92, 246, ${opacity})`; // Purple
      default:
        return `rgba(239, 68, 68, ${opacity})`; // Red
    }
  };

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <span>Computer Vision Analysis</span>
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
          {/* Visualization overlay */}
          <div className="absolute inset-0">
            {/* Objects */}
            {objects.map((obj) => (
              <div
                key={obj.id}
                className="absolute border-2 rounded"
                style={{
                  left: `${(obj.boundingBox.x / videoWidth) * 100}%`,
                  top: `${(obj.boundingBox.y / videoHeight) * 100}%`,
                  width: `${(obj.boundingBox.width / videoWidth) * 100}%`,
                  height: `${(obj.boundingBox.height / videoHeight) * 100}%`,
                  borderColor: getTypeColor(obj.type, obj.confidence),
                  backgroundColor: `${getTypeColor(obj.type, obj.confidence).replace(')', ', 0.1)').replace('rgb', 'rgba')}`
                }}
              >
                <div className="absolute -top-6 left-0 flex items-center text-xs text-white">
                  {getTypeIcon(obj.type)}
                  <span className="ml-1">{obj.type}</span>
                  <span className="ml-1 text-yellow-400">{(obj.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            
            {/* Surfaces */}
            {surfaces.map((surface) => (
              <div
                key={surface.id}
                className="absolute border-2 border-dashed rounded"
                style={{
                  left: `${(surface.boundingBox.x / videoWidth) * 100}%`,
                  top: `${(surface.boundingBox.y / videoHeight) * 100}%`,
                  width: `${(surface.boundingBox.width / videoWidth) * 100}%`,
                  height: `${(surface.boundingBox.height / videoHeight) * 100}%`,
                  borderColor: getTypeColor(surface.type, surface.confidence),
                  backgroundColor: `${getTypeColor(surface.type, surface.confidence).replace(')', ', 0.05)').replace('rgb', 'rgba')}`
                }}
              >
                <div className="absolute -top-6 left-0 flex items-center text-xs text-white">
                  {getTypeIcon(surface.type)}
                  <span className="ml-1">{surface.type}</span>
                  <span className="ml-1 text-yellow-400">{(surface.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            
            {/* Motion Points */}
            {motionPoints.map((point) => (
              <div
                key={point.id}
                className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(point.centerX / videoWidth) * 100}%`,
                  top: `${(point.centerY / videoHeight) * 100}%`,
                  backgroundColor: `rgba(236, 72, 153, ${point.confidence})`
                }}
              >
                <div className="absolute -top-6 left-0 text-xs text-white">
                  Motion
                  <span className="ml-1 text-yellow-400">{(point.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-blue-500/20 p-2 rounded text-center">
            <div className="text-blue-400 font-medium">{objects.length}</div>
            <div className="text-gray-400">Objects</div>
          </div>
          <div className="bg-purple-500/20 p-2 rounded text-center">
            <div className="text-purple-400 font-medium">{surfaces.length}</div>
            <div className="text-gray-400">Surfaces</div>
          </div>
          <div className="bg-pink-500/20 p-2 rounded text-center">
            <div className="text-pink-400 font-medium">{motionPoints.length}</div>
            <div className="text-gray-400">Motion</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          <p>Computer vision analysis detects objects, surfaces, and motion in your video to help place overlays intelligently.</p>
        </div>
      </CardContent>
    </Card>
  );
}