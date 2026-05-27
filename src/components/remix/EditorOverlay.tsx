import React, { useCallback, useRef, useEffect, useState } from 'react';
import { X, Grip } from 'lucide-react';

export interface OverlayStyle {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  text?: string;
  cardColor?: 'yellow' | 'red';
}

export interface EditorOverlayProps {
  overlayId: string;
  style: OverlayStyle;
  onStyleChange: (id: string, style: Partial<OverlayStyle>) => void;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onDoubleClick?: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

type DragMode = null | 'move' | 'rotate' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';

const HANDLE_SIZE = 10;

export function EditorOverlay({
  overlayId,
  style,
  onStyleChange,
  isSelected,
  onSelect,
  onRemove,
  onDoubleClick,
  children,
  className,
}: EditorOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    startScale: number;
    startRotation: number;
  } | null>(null);

  const startDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect(overlayId);

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      dragRef.current = {
        mode,
        startMouseX: clientX,
        startMouseY: clientY,
        startX: style.x,
        startY: style.y,
        startScale: style.scale,
        startRotation: style.rotation,
      };
    },
    [overlayId, onSelect, style],
  );

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const getDelta = (clientX: number, clientY: number) => {
      const d = dragRef.current;
      if (!d) return null;
      const rect = parent.getBoundingClientRect();
      const scaleX = rect.width / 640;
      const scaleY = rect.height / 480;
      const dx = (clientX - d.startMouseX) / scaleX;
      const dy = (clientY - d.startMouseY) / scaleY;
      return { dx, dy, rect, scaleX, scaleY };
    };

    const handleMove = (clientX: number, clientY: number) => {
      const d = dragRef.current;
      if (!d) return;
      const delta = getDelta(clientX, clientY);
      if (!delta) return;

      const { dx, dy, rect } = delta;

      switch (d.mode) {
        case 'move': {
          const newX = Math.max(0, Math.min(rect.width - 50, d.startX + dx));
          const newY = Math.max(0, Math.min(rect.height - 50, d.startY + dy));
          onStyleChange(overlayId, { x: newX, y: newY });
          break;
        }
        case 'rotate': {
          const centerX = d.startX + 60;
          const centerY = d.startY + 10;
          const mouseX = centerX + dx;
          const mouseY = centerY + dy;
          const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
          const newRotation = Math.round(angle / 15) * 15; // snap to 15°
          onStyleChange(overlayId, { rotation: newRotation });
          break;
        }
        case 'resize-se': {
          const newScale = Math.max(0.3, Math.min(3, d.startScale + dx / 150));
          onStyleChange(overlayId, { scale: newScale });
          break;
        }
        case 'resize-nw': {
          const newScale = Math.max(0.3, Math.min(3, d.startScale - dx / 150));
          onStyleChange(overlayId, { scale: newScale });
          break;
        }
        default:
          break;
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onEnd = () => { dragRef.current = null; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [overlayId, onStyleChange]);

  const transform = `translate(${style.x}px, ${style.y}px) rotate(${style.rotation}deg) scale(${style.scale})`;

  return (
    <div
      ref={containerRef}
      className={`absolute pointer-events-auto select-none ${isSelected ? 'z-20' : 'z-10'} ${className ?? ''}`}
      style={{
        transform,
        transformOrigin: '0 0',
        opacity: style.opacity,
        touchAction: 'none',
      }}
      onMouseDown={(e) => startDrag(e, 'move')}
      onTouchStart={(e) => startDrag(e, 'move')}
      onDoubleClick={() => onDoubleClick?.(overlayId)}
    >
      {/* Children */}
      <div className="pointer-events-none">
        {children}
      </div>

      {/* Editor controls — only visible when selected */}
      {isSelected && (
        <div className="absolute -inset-2 rounded-xl border-2 border-yellow-400 pointer-events-none">
          {/* Top grip */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-6 bg-yellow-400 rounded-b-md flex items-center justify-center pointer-events-auto shadow-lg group cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => startDrag(e, 'move')}
            onTouchStart={(e) => startDrag(e, 'move')}
          >
            <Grip className="h-3.5 w-3.5 text-black" />
          </div>

          {/* Rotate handle — top-right */}
          <div
            className="absolute -top-1 -right-1 w-5 h-5 border-2 border-yellow-400 bg-black/80 rounded-full flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing hover:bg-yellow-400 hover:text-black transition-colors"
            onMouseDown={(e) => startDrag(e, 'rotate')}
            onTouchStart={(e) => startDrag(e, 'rotate')}
            title="Rotate"
          >
            <span className="text-[9px]" style={{ color: 'inherit' }}>↻</span>
          </div>

          {/* Delete button — top-left */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(overlayId); }}
            className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center pointer-events-auto hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="h-3 w-3 text-white" />
          </button>

          {/* Resize handle — bottom-right */}
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-sm pointer-events-auto cursor-se-resize hover:bg-yellow-300 transition-colors shadow-lg"
            onMouseDown={(e) => startDrag(e, 'resize-se')}
            onTouchStart={(e) => startDrag(e, 'resize-se')}
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE }}
          />

          {/* Resize handle — bottom-left */}
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-sm pointer-events-auto cursor-sw-resize hover:bg-yellow-300 transition-colors shadow-lg"
            onMouseDown={(e) => startDrag(e, 'resize-nw')}
            onTouchStart={(e) => startDrag(e, 'resize-nw')}
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE }}
          />

          {/* Rotation indicator */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] text-yellow-400 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none font-mono">
            {style.rotation}°
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline text editing overlay */
export function InlineTextEditor({
  text,
  onSave,
  onCancel,
}: {
  text: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gray-900 border border-yellow-400/40 rounded-xl p-4 shadow-2xl w-80">
        <div className="text-xs text-gray-400 mb-2">Edit text</div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(value);
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/50"
          placeholder="Type your text..."
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onCancel} className="text-gray-400 text-xs hover:text-white transition-colors">Cancel</button>
          <button onClick={() => onSave(value)} className="bg-yellow-400 text-black text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-yellow-500 transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
}
