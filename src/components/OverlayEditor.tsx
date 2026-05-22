import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useFabric } from '@/hooks/use-fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Play, Pause, RotateCw, Move, Layers, Eye, EyeOff,
  Trash2, Copy, SkipBack, SkipForward, Volume2
} from 'lucide-react';
import { OverlayData } from '@/types/overlay-types';
import {
  collaborationServiceAddOverlayToCollaboration,
  collaborationServiceGetCollaborationOverlays,
  collaborationServiceUpdateOverlay,
  collaborationServiceDeleteOverlay
} from '@/lib/sdk';

interface OverlayEditorProps {
  videoUrl: string;
  videoDuration: number;
  collaborationId: string;
  initialOverlays?: OverlayData[];
  onOverlayUpdate?: (overlays: OverlayData[]) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function OverlayEditor({
  videoUrl,
  videoDuration,
  collaborationId,
  initialOverlays = [],
  onOverlayUpdate,
  onTimeUpdate
}: OverlayEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });
  const fabricRef = useFabric(canvasRef, canvasSize.width, canvasSize.height);

  const [overlays, setOverlays] = useState<OverlayData[]>(initialOverlays);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const debouncedUpdateOverlay = useCallback(
    async (id: string, position: any, timing: any, layerOrder: number) => {
      await collaborationServiceUpdateOverlay({
        body: {
          overlay_id: id,
          position_data: position,
          timing_data: timing,
          layer_order: layerOrder
        }
      });
    },
    []
  );

  const updateOverlayPosition = (id: string, position: Partial<OverlayData['position']>) => {
    setOverlays(prev => {
      const newOverlays = prev.map(overlay =>
        overlay.id === id ? { ...overlay, position: { ...overlay.position, ...position } } : overlay
      );
      const updatedOverlay = newOverlays.find(o => o.id === id);
      if (updatedOverlay) {
        debouncedUpdateOverlay(id, updatedOverlay.position, updatedOverlay.timing, updatedOverlay.layerOrder);
      }
      return newOverlays;
    });
  };

  const updateOverlayTiming = (id: string, timing: Partial<OverlayData['timing']>) => {
    setOverlays(prev => prev.map(overlay =>
      overlay.id === id ? { ...overlay, timing: { ...overlay.timing, ...timing } } : overlay
    ));
  };

  const toggleOverlayVisibility = (id: string) => {
    setOverlays(prev => prev.map(overlay =>
      overlay.id === id ? { ...overlay, visible: !overlay.visible } : overlay
    ));
  };

  const deleteOverlay = async (id: string) => {
    await collaborationServiceDeleteOverlay({
      body: { overlay_id: id }
    });
    setOverlays(prev => prev.filter(overlay => overlay.id !== id));
  };

  const addOverlay = async (assetId: string, name: string, assetUrl: string) => {
    const newOverlayData = {
      position_data: { x: 100, y: 100, scaleX: 1, scaleY: 1, angle: 0 },
      timing_data: { startTime: 0, endTime: videoDuration / 2, fadeIn: 0.5, fadeOut: 0.5 },
      layer_order: overlays.length + 1,
    };

    const response = await collaborationServiceAddOverlayToCollaboration({
      body: {
        collaboration_id: collaborationId,
        asset_id: assetId,
        position_data: newOverlayData.position_data,
        timing_data: newOverlayData.timing_data,
        layer_order: newOverlayData.layer_order
      }
    });

    const newOverlay: OverlayData = {
      id: response.data?.overlay_id || '',
      assetUrl,
      name,
      position: newOverlayData.position_data,
      timing: newOverlayData.timing_data,
      layerOrder: newOverlayData.layer_order,
      visible: true,
    };

    setOverlays(prev => [...prev, newOverlay]);
  };

  const duplicateOverlay = (id: string) => {
    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;

    const newOverlay: OverlayData = {
      ...overlay,
      id: `${id}_copy_${Date.now()}`,
      position: {
        ...overlay.position,
        x: overlay.position.x + 20,
        y: overlay.position.y + 20
      }
    };

    setOverlays(prev => [...prev, newOverlay]);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const selectedOverlayData = selectedOverlay ? overlays.find(o => o.id === selectedOverlay) : null;

  // Notify parent of overlay changes
  useEffect(() => {
    onOverlayUpdate?.(overlays);
  }, [overlays, onOverlayUpdate]);

  // Fetch overlays on mount
  useEffect(() => {
    const fetchOverlays = async () => {
      const response = await collaborationServiceGetCollaborationOverlays({
        body: { collaboration_id: collaborationId }
      });
      if (response.data) {
        setOverlays(response.data.overlays || []);
      }
    };
    fetchOverlays();
  }, [collaborationId]);

  // Adjust canvas size to video dimensions
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleResize = () => {
        setCanvasSize({
          width: video.clientWidth,
          height: video.clientHeight,
        });
      };
      video.addEventListener('loadedmetadata', handleResize);
      window.addEventListener('resize', handleResize);

      if (video.videoWidth > 0) {
        handleResize();
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleResize);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Render overlays on canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.clear();

    overlays
      .filter(
        (overlay) =>
          overlay.visible &&
          currentTime >= overlay.timing.startTime &&
          currentTime <= overlay.timing.endTime
      )
      .sort((a, b) => a.layerOrder - b.layerOrder)
      .forEach((overlay) => {
        fabric.Image.fromURL(overlay.assetUrl, (img) => {
          img.set({
            left: overlay.position.x,
            top: overlay.position.y,
            angle: overlay.position.angle,
            scaleX: overlay.position.scaleX,
            scaleY: overlay.position.scaleY,
            selectable: selectedOverlay === overlay.id,
            evented: true, // Always listen for events
            data: { id: overlay.id }, // Store id in custom data property
          });
          canvas.add(img);
        }, { crossOrigin: 'anonymous' }); // Handle CORS for images
      });

    canvas.renderAll();
  }, [fabricRef, overlays, currentTime, selectedOverlay]);

  // Handle canvas clicks for selection
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleMouseDown = (options: fabric.IEvent) => {
      if (options.target && options.target.data.id) {
        setSelectedOverlay(options.target.data.id);
      } else {
        setSelectedOverlay(null);
      }
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [fabricRef]);

  // Handle overlay transformations
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleObjectModified = (e: fabric.IEvent) => {
      const target = e.target;
      if (!target || !target.data.id) return;

      const { id } = target.data;
      const { left, top, angle, scaleX, scaleY } = target;

      updateOverlayPosition(id, {
        x: left ?? 0,
        y: top ?? 0,
        angle: angle ?? 0,
        scaleX: scaleX ?? 1,
        scaleY: scaleY ?? 1,
      });
    };

    canvas.on('object:modified', handleObjectModified);

    return () => {
      canvas.off('object:modified', handleObjectModified);
    };
  }, [fabricRef]);

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-3 space-y-4">
        {/* Video Canvas Container */}
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-0">
            <div className="relative">
              {/* Video Player */}
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-auto max-h-[500px] object-contain"
                onTimeUpdate={handleVideoTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              <canvas ref={canvasRef} className="absolute top-0 left-0" />
            </div>
          </CardContent>
        </Card>

        {/* Video Controls */}
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Transport Controls */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeek(Math.max(0, currentTime - 5))}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  onClick={handlePlayPause}
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeek(Math.min(videoDuration, currentTime + 5))}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Timeline Scrubber */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span>{videoDuration.toFixed(1)}s</span>
                </div>

                <Slider
                  value={[currentTime]}
                  onValueChange={(value) => handleSeek(value[0])}
                  max={videoDuration}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Controls */}
      <div className="space-y-4">
        {/* Layer Management */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Layers className="h-5 w-5" />
              <span>Layers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overlays.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No overlays added yet
              </p>
            ) : (
              overlays
                .sort((a, b) => b.layerOrder - a.layerOrder)
                .map((overlay) => (
                  <div
                    key={overlay.id}
                    className={`flex items-center justify-between p-2 rounded ${selectedOverlay === overlay.id
                      ? 'bg-yellow-400/20 border border-yellow-400/40'
                      : 'bg-white/5'
                      }`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOverlayVisibility(overlay.id)}
                        className="p-1 h-6 w-6"
                      >
                        {overlay.visible ?
                          <Eye className="h-3 w-3" /> :
                          <EyeOff className="h-3 w-3" />
                        }
                      </Button>

                      <span className="text-white text-sm flex-1 truncate">
                        {overlay.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateOverlay(overlay.id)}
                        className="p-1 h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteOverlay(overlay.id)}
                        className="p-1 h-6 w-6 text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Selected Overlay Properties */}
        {selectedOverlayData && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-sm">
                {selectedOverlayData.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timing Controls */}
              <div className="space-y-2">
                <Label className="text-white text-xs">Start Time</Label>
                <Slider
                  value={[selectedOverlayData.timing.startTime]}
                  onValueChange={(value) => updateOverlayTiming(selectedOverlay!, { startTime: value[0] })}
                  max={videoDuration}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">
                  {selectedOverlayData.timing.startTime.toFixed(1)}s
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white text-xs">End Time</Label>
                <Slider
                  value={[selectedOverlayData.timing.endTime]}
                  onValueChange={(value) => updateOverlayTiming(selectedOverlay!, { endTime: value[0] })}
                  max={videoDuration}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">
                  {selectedOverlayData.timing.endTime.toFixed(1)}s
                </div>
              </div>

              {/* Fade Controls */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-white text-xs">Fade In</Label>
                  <Slider
                    value={[selectedOverlayData.timing.fadeIn]}
                    onValueChange={(value) => updateOverlayTiming(selectedOverlay!, { fadeIn: value[0] })}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">
                    {selectedOverlayData.timing.fadeIn.toFixed(1)}s
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-white text-xs">Fade Out</Label>
                  <Slider
                    value={[selectedOverlayData.timing.fadeOut]}
                    onValueChange={(value) => updateOverlayTiming(selectedOverlay!, { fadeOut: value[0] })}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">
                    {selectedOverlayData.timing.fadeOut.toFixed(1)}s
                  </div>
                </div>
              </div>

              {/* Transform Info */}
              <div className="text-xs text-gray-400 space-y-1">
                <div>Position: {selectedOverlayData.position.x.toFixed(0)}, {selectedOverlayData.position.y.toFixed(0)}</div>
                <div>Scale: {(selectedOverlayData.position.scaleX * 100).toFixed(0)}%</div>
                <div>Rotation: {selectedOverlayData.position.angle.toFixed(0)}°</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Add sample overlay for demo
                addOverlay('sample_asset_id', 'Sample Overlay', '/placeholder-overlay.png');
              }}
            >
              Add Sample Overlay
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setOverlays([])}
            >
              Clear All Overlays
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}