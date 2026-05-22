export interface OverlayData {
  id: string;
  assetUrl: string;
  name: string;
  position: { x: number; y: number; scaleX: number; scaleY: number; angle: number };
  timing: { startTime: number; endTime: number; fadeIn: number; fadeOut: number };
  layerOrder: number;
  visible: boolean;
}