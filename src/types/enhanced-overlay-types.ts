export interface AnchorPoint {
  type: 'top-left' | 'top-center' | 'top-right' | 
        'middle-left' | 'center' | 'middle-right' | 
        'bottom-left' | 'bottom-center' | 'bottom-right';
  offsetX: number; // Percentage offset from anchor point
  offsetY: number; // Percentage offset from anchor point
}

export interface SmartPositioning {
  anchorPoint?: AnchorPoint;
  snapToGrid?: boolean;
  gridSize?: number; // Grid size in pixels
  constraints?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
  rotationCenter?: {
    x: number; // Rotation center X (percentage of overlay width)
    y: number; // Rotation center Y (percentage of overlay height)
  };
}

export interface EnhancedOverlayData {
  id: string;
  assetUrl: string;
  name: string;
  position: { 
    x: number; 
    y: number; 
    scaleX: number; 
    scaleY: number; 
    angle: number;
    // Enhanced positioning properties
    width?: number;
    height?: number;
  };
  timing: { 
    startTime: number; 
    endTime: number; 
    fadeIn: number; 
    fadeOut: number;
    // Enhanced timing properties
    loop?: boolean;
    loopCount?: number;
  };
  layerOrder: number;
  visible: boolean;
  // Enhanced positioning system
  smartPositioning?: SmartPositioning;
  // Effects
  effects?: {
    opacity?: number;
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
  // Animation properties
  animations?: {
    type: 'bounce' | 'fade' | 'slide' | 'spin' | 'pulse' | 'none';
    duration?: number;
    delay?: number;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
}