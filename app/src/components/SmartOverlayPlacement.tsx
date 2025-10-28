import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useComputerVision } from '@/hooks/use-computer-vision';
import { Target, Sparkles, Zap, Loader } from 'lucide-react';
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
}

export default function SmartOverlayPlacement({
  videoRef,
  canvasRef,
  overlays,
  setOverlays,
  selectedOverlay,
  setSelectedOverlay,
  onPlaceOverlay
}: SmartOverlayPlacementProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const frameCaptureRef = useRef<HTMLCanvasElement>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  
  const { analyzeFrame, results, isProcessing, error, getSuggestedPlacement } = useComputerVision();

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    
    try {
      // Create a temporary canvas to capture the current frame
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get 2D context');
      }
      
      tempCanvas.width = videoRef.current.videoWidth;
      tempCanvas.height = videoRef.current.videoHeight;
      
      // Draw the current video frame to the temporary canvas
      ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Analyze the frame
      await analyzeFrame(imageData, previousFrameRef.current);
      
      // Store current frame for next comparison
      previousFrameRef.current = imageData;
      
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error analyzing frame:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const placeSmartOverlay = () => {
    if (!videoRef.current || !results) return;
    
    // For demo purposes, let's assume we're placing a 200x200 overlay
    const overlayWidth = 200;
    const overlayHeight = 200;
    
    const suggestedPosition = getSuggestedPlacement(
      overlayWidth,
      overlayHeight,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight,
      results
    );
    
    onPlaceOverlay(suggestedPosition);
    setShowSuggestions(false);
  };

  const clearAnalysis = () => {
    setShowSuggestions(false);
  };

  // Auto-analyze when enabled
  useEffect(() => {
    if (isEnabled && videoRef.current) {
      const interval = setInterval(() => {
        if (!isAnalyzing && !isProcessing) {
          captureAndAnalyzeFrame();
        }
      }, 2000); // Analyze every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [isEnabled, isAnalyzing, isProcessing]);

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          <span>Smart Placement</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-3">
          <Button
            variant={isEnabled ? "default" : "outline"}
            onClick={() => setIsEnabled(!isEnabled)}
            className={isEnabled ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""}
          >
            {isAnalyzing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                {isEnabled ? "Disable Smart Placement" : "Enable Smart Placement"}
              </>
            )}
          </Button>
          
          {isEnabled && !isAnalyzing && !isProcessing && (
            <Button
              variant="outline"
              onClick={captureAndAnalyzeFrame}
            >
              <Zap className="h-4 w-4 mr-2" />
              Analyze Current Frame
            </Button>
          )}
        </div>
        
        {showSuggestions && results && (
          <div className="space-y-3 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
            <h4 className="text-yellow-400 font-medium text-sm">Smart Placement Suggestions</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Detected Objects:</span>
                <span className="text-white">{results.objects.length}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Flat Surfaces:</span>
                <span className="text-white">{results.surfaces.length}</span>
              </div>
              
              {results.motionPoints.length > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Motion Points:</span>
                  <span className="text-white">{results.motionPoints.length}</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={placeSmartOverlay}
                className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Place Here
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
        
        {error && (
          <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30 text-red-300 text-sm">
            Error: {error}
          </div>
        )}
        
        <div className="text-xs text-gray-400 space-y-1">
          <p>Smart placement automatically analyzes your video to find optimal positions for overlays.</p>
          <p>It detects objects, surfaces, and movement to suggest the best placement.</p>
        </div>
      </CardContent>
      
      {/* Hidden canvas for frame capture */}
      <canvas 
        ref={frameCaptureRef} 
        className="hidden" 
        width="640" 
        height="480"
      />
    </Card>
  );
}