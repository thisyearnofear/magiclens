import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useFabric } from '@/hooks/use-fabric';
import { useRealtimeCollaboration } from '@/hooks/use-realtime-collaboration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Play, Pause, RotateCw, Move, Layers, Eye, EyeOff,
  Trash2, Copy, SkipBack, SkipForward, Volume2,
  Grid3x3, Magnet, Target, AlignCenter, AlignLeft, AlignRight,
  Sun, Moon, Sparkles, Zap, Users
} from 'lucide-react';
import { EnhancedOverlayData, SmartPositioning } from '@/types/enhanced-overlay-types';
import {
  collaborationServiceAddOverlayToCollaboration,
  collaborationServiceGetCollaborationOverlays,
  collaborationServiceUpdateOverlay,
  collaborationServiceDeleteOverlay
} from '@/lib/sdk';
import SmartOverlayPlacement from '@/components/SmartOverlayPlacement';
import UserPresenceVisualizer from '@/components/UserPresenceVisualizer';

interface EnhancedOverlayEditorProps {
  videoUrl: string;
  videoDuration: number;
  collaborationId: string;
  userId: string;
  username: string;
  initialOverlays?: EnhancedOverlayData[];
  onOverlayUpdate?: (overlays: EnhancedOverlayData[]) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function EnhancedOverlayEditor({
  videoUrl,
  videoDuration,
  collaborationId,
  userId,
  username,
  initialOverlays = [],
  onOverlayUpdate,
  onTimeUpdate
}: EnhancedOverlayEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });
  const fabricRef = useFabric(canvasRef, canvasSize.width, canvasSize.height);

  const [overlays, setOverlays] = useState<EnhancedOverlayData[]>(initialOverlays);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);

  // Real-time collaboration hook
  const {
    isConnected,
    isSynced,
    users,
    createOverlay,
    updateOverlay,
    deleteOverlay,
    transformOverlay,
    selectOverlay,
    updateCursorPosition,
  } = useRealtimeCollaboration(
    collaborationId,
    userId,
    username,
    overlays,
    setOverlays
  );

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

  const updateOverlayPosition = (id: string, position: Partial<EnhancedOverlayData['position']>) => {
    setOverlays(prev => {
      const newOverlays = prev.map(overlay =>
        overlay.id === id ? {
          ...overlay,
          position: {
            ...overlay.position,
            ...position,
            width: overlay.position.width,
            height: overlay.position.height
          }
        } : overlay
      );
      const updatedOverlay = newOverlays.find(o => o.id === id);
      if (updatedOverlay) {
        debouncedUpdateOverlay(id, updatedOverlay.position, updatedOverlay.timing, updatedOverlay.layerOrder);
      }
      return newOverlays;
    });
  };

  const updateOverlayTiming = (id: string, timing: Partial<EnhancedOverlayData['timing']>) => {
    setOverlays(prev => prev.map(overlay =>
      overlay.id === id ? { ...overlay, timing: { ...overlay.timing, ...timing } } : overlay
    ));
  };

  const updateSmartPositioning = (id: string, smartPositioning: Partial<SmartPositioning>) => {
    setOverlays(prev => prev.map(overlay =>
      overlay.id === id ? {
        ...overlay,
        smartPositioning: {
          ...overlay.smartPositioning,
          ...smartPositioning
        }
      } : overlay
    ));
  };

  const updateEffects = (id: string, effects: Partial<EnhancedOverlayData['effects']>) => {
    setOverlays(prev => prev.map(overlay =>
      overlay.id === id ? {
        ...overlay,
        effects: {
          ...overlay.effects,
          ...effects
        }
      } : overlay
    ));
  };

  const updateAnimations = (id: string, animations: Partial<EnhancedOverlayData['animations']>) => {
    setOverlays(prev => prev.map(overlay =>
      overlay.id === id ? {
        ...overlay,
        animations: {
          ...overlay.animations,
          ...animations
        }
      } : overlay
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
      position_data: { x: 100, y: 100, scaleX: 1, scaleY: 1, angle: 0, width: 100, height: 100 },
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

    const newOverlay: EnhancedOverlayData = {
      id: response.overlay_id,
      assetUrl,
      name,
      position: newOverlayData.position_data,
      timing: newOverlayData.timing_data,
      layerOrder: newOverlayData.layer_order,
      visible: true,
      smartPositioning: {
        snapToGrid: showGrid,
        gridSize: gridSize
      }
    };

    setOverlays(prev => [...prev, newOverlay]);
  };

  const duplicateOverlay = (id: string) => {
    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;

    const newOverlay: EnhancedOverlayData = {
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

  const snapToGrid = (value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const placeSmartOverlay = (position: { x: number; y: number; width: number; height: number; scaleX: number; scaleY: number; angle: number }) => {
    // This would be implemented to place an overlay at the suggested position
    console.log('Placing smart overlay at:', position);

    // For demo purposes, we'll just update the selected overlay's position
    if (selectedOverlay) {
      updateOverlayPosition(selectedOverlay, {
        x: position.x,
        y: position.y,
        scaleX: position.scaleX,
        scaleY: position.scaleY,
        angle: position.angle
      });
    }
  };

  const applySmartPositioning = (overlay: EnhancedOverlayData) => {
    if (overlay.smartPositioning?.snapToGrid && overlay.smartPositioning.gridSize) {
      return {
        ...overlay.position,
        x: snapToGrid(overlay.position.x, overlay.smartPositioning.gridSize),
        y: snapToGrid(overlay.position.y, overlay.smartPositioning.gridSize)
      };
    }
    return overlay.position;
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

  // Draw grid if enabled
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !showGrid) return;

    // Clear previous grid
    canvas.getObjects().forEach(obj => {
      if (obj.type === 'line' && obj.stroke === '#444') {
        canvas.remove(obj);
      }
    });

    // Draw new grid
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    for (let i = 0; i <= width; i += gridSize) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: '#444',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        opacity: 0.5
      });
      canvas.add(line);
    }

    for (let i = 0; i <= height; i += gridSize) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: '#444',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        opacity: 0.5
      });
      canvas.add(line);
    }

    canvas.renderAll();
  }, [fabricRef, showGrid, gridSize]);

  // Render overlays on canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Clear canvas but preserve grid
    const gridLines = canvas.getObjects().filter(obj =>
      obj.type === 'line' && obj.stroke === '#444'
    );

    canvas.clear();

    // Re-add grid lines
    gridLines.forEach(line => canvas.add(line));

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
          const positionedOverlay = applySmartPositioning(overlay);

          img.set({
            left: positionedOverlay.x,
            top: positionedOverlay.y,
            angle: positionedOverlay.angle,
            scaleX: positionedOverlay.scaleX,
            scaleY: positionedOverlay.scaleY,
            selectable: selectedOverlay === overlay.id,
            evented: true,
            data: { id: overlay.id },
            // Apply effects if available
            opacity: overlay.effects?.opacity || 1,
          });

          canvas.add(img);
        }, { crossOrigin: 'anonymous' });
      });

    canvas.renderAll();
  }, [fabricRef, overlays, currentTime, selectedOverlay, showGrid, gridSize]);

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

  // Handle overlay transformations with smart positioning
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleObjectModified = (e: fabric.IEvent) => {
      const target = e.target;
      if (!target || !target.data.id) return;

      const { id } = target.data;
      const { left, top, angle, scaleX, scaleY } = target;

      // Apply smart positioning if enabled
      let finalPosition = { x: left ?? 0, y: top ?? 0, angle: angle ?? 0, scaleX: scaleX ?? 1, scaleY: scaleY ?? 1 };

      const overlay = overlays.find(o => o.id === id);
      if (overlay?.smartPositioning?.snapToGrid && overlay.smartPositioning.gridSize) {
        finalPosition = {
          ...finalPosition,
          x: snapToGrid(finalPosition.x, overlay.smartPositioning.gridSize),
          y: snapToGrid(finalPosition.y, overlay.smartPositioning.gridSize)
        };
      }

      updateOverlayPosition(id, finalPosition);
    };

    canvas.on('object:modified', handleObjectModified);

    return () => {
      canvas.off('object:modified', handleObjectModified);
    };
  }, [fabricRef, overlays]);

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
              {/* Collaboration Status */}
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white text-sm">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {isConnected && (
                  <span className="text-xs text-gray-400">
                    {users.length} {users.length === 1 ? 'user' : 'users'} online
                  </span>
                )}
              </div>

              {/* User Presence */}
              <UserPresenceVisualizer
                users={users}
                currentUser={userId}
                onUserClick={(userId) => console.log('Clicked user:', userId)}
              />

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

              {/* Grid Controls */}
              <div className="flex items-center space-x-4 pt-2">
                <Button
                  variant={showGrid ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                  className={showGrid ? "bg-yellow-400 text-black" : ""}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>

                {showGrid && (
                  <div className="flex items-center space-x-2">
                    <Label className="text-white text-xs">Size:</Label>
                    <Input
                      type="number"
                      value={gridSize}
                      onChange={(e) => setGridSize(Number(e.target.value))}
                      className="w-16 h-8 text-xs"
                      min="5"
                      max="100"
                    />
                  </div>
                )}
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
              <CardTitle className="text-white text-sm flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                {selectedOverlayData.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Smart Positioning */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white text-xs flex items-center">
                    <Magnet className="h-3 w-3 mr-1" />
                    Smart Positioning
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => updateSmartPositioning(selectedOverlay!, {
                      snapToGrid: !selectedOverlayData.smartPositioning?.snapToGrid
                    })}
                  >
                    {selectedOverlayData.smartPositioning?.snapToGrid ?
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div> :
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    }
                  </Button>
                </div>

                {selectedOverlayData.smartPositioning?.snapToGrid && (
                  <div className="space-y-2 pl-2 border-l-2 border-yellow-400/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-white text-xs">Grid Size</Label>
                      <Input
                        type="number"
                        value={selectedOverlayData.smartPositioning.gridSize || 20}
                        onChange={(e) => updateSmartPositioning(selectedOverlay!, {
                          gridSize: Number(e.target.value)
                        })}
                        className="w-16 h-7 text-xs"
                        min="5"
                        max="100"
                      />
                    </div>
                  </div>
                )}
              </div>

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

              {/* Effects Controls */}
              <div className="space-y-3">
                <Label className="text-white text-xs flex items-center">
                  <Sun className="h-3 w-3 mr-1" />
                  Visual Effects
                </Label>

                <div className="space-y-2 pl-2">
                  <div>
                    <Label className="text-white text-xs">Opacity</Label>
                    <Slider
                      value={[selectedOverlayData.effects?.opacity || 1]}
                      onValueChange={(value) => updateEffects(selectedOverlay!, { opacity: value[0] })}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400">
                      {(selectedOverlayData.effects?.opacity || 1).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white text-xs">Brightness</Label>
                    <Slider
                      value={[selectedOverlayData.effects?.brightness || 0]}
                      onValueChange={(value) => updateEffects(selectedOverlay!, { brightness: value[0] })}
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400">
                      {selectedOverlayData.effects?.brightness || 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Animation Controls */}
              <div className="space-y-3">
                <Label className="text-white text-xs flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  Animations
                </Label>

                <div className="space-y-2 pl-2">
                  <div className="grid grid-cols-3 gap-1">
                    {['bounce', 'fade', 'slide', 'spin', 'pulse', 'none'].map((anim) => (
                      <Button
                        key={anim}
                        variant="outline"
                        size="sm"
                        className={`h-8 text-xs ${selectedOverlayData.animations?.type === anim
                          ? 'bg-yellow-400 text-black'
                          : ''
                          }`}
                        onClick={() => updateAnimations(selectedOverlay!, { type: anim as any })}
                      >
                        {anim.charAt(0).toUpperCase() + anim.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {selectedOverlayData.animations?.type !== 'none' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-white text-xs">Duration (s)</Label>
                        <Slider
                          value={[selectedOverlayData.animations?.duration || 1]}
                          onValueChange={(value) => updateAnimations(selectedOverlay!, { duration: value[0] })}
                          max={5}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-400">
                          {(selectedOverlayData.animations?.duration || 1).toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  )}
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

        {/* Smart Overlay Placement */}
        <SmartOverlayPlacement
          videoRef={videoRef}
          canvasRef={canvasRef}
          overlays={overlays}
          setOverlays={setOverlays}
          selectedOverlay={selectedOverlay}
          setSelectedOverlay={setSelectedOverlay}
          onPlaceOverlay={(position) => {
            if (selectedOverlay) {
              updateOverlayPosition(selectedOverlay, {
                x: position.x,
                y: position.y,
                scaleX: position.scaleX,
                scaleY: position.scaleY,
                angle: position.angle
              });
            }
          }}
        />

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