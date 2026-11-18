import React, { useCallback, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  /** Snap targets in container px — evaluated once at drag start
   *  (e.g. tracked-player landmarks) so guides follow live data */
  getSnapPoints?: () => { x: number; y: number }[];
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
  getSnapPoints,
  children,
  className,
}: EditorOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<{ vx: number | null; hy: number | null; pt: { x: number; y: number } | null } | null>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    startScale: number;
    startRotation: number;
    startPointerAngle: number;
    centerX: number;
    centerY: number;
    elW: number;
    elH: number;
    snapPoints: { x: number; y: number }[];
  } | null>(null);

  const startDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect(overlayId);

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const rect = containerRef.current?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : clientX;
      const centerY = rect ? rect.top + rect.height / 2 : clientY;

      dragRef.current = {
        mode,
        startMouseX: clientX,
        startMouseY: clientY,
        startX: style.x,
        startY: style.y,
        startScale: style.scale,
        startRotation: style.rotation,
        startPointerAngle: Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI),
        centerX,
        centerY,
        elW: rect?.width ?? 0,
        elH: rect?.height ?? 0,
        snapPoints: getSnapPoints?.() ?? [],
      };
    },
    [overlayId, onSelect, style, getSnapPoints],
  );

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    // Styles are stored in container pixels — deltas stay in the same
    // space so the overlay tracks the pointer 1:1 at any render size.
    const handleMove = (clientX: number, clientY: number) => {
      const d = dragRef.current;
      if (!d) return;
      const rect = parent.getBoundingClientRect();
      const dx = clientX - d.startMouseX;
      const dy = clientY - d.startMouseY;

      switch (d.mode) {
        case 'move': {
          // Keep at least 40px of the overlay reachable inside the frame.
          let newX = Math.max(-d.elW + 40, Math.min(rect.width - 40, d.startX + dx));
          let newY = Math.max(-d.elH + 40, Math.min(rect.height - 40, d.startY + dy));

          // ── smart guides: frame center/edges, then landmark points ──
          const FRAME_SNAP = 6, POINT_SNAP = 12, INSET = 8;
          let vx: number | null = null, hy: number | null = null;
          let pt: { x: number; y: number } | null = null;
          // [value-moving, snap-target] — center first, then edges
          const xTargets = [
            [newX + d.elW / 2, rect.width / 2],
            [newX, INSET],
            [newX + d.elW, rect.width - INSET],
          ] as const;
          for (const [v, t] of xTargets) {
            if (Math.abs(t - v) <= FRAME_SNAP) { newX += t - v; vx = t; break; }
          }
          const yTargets = [
            [newY + d.elH / 2, rect.height / 2],
            [newY, INSET],
            [newY + d.elH, rect.height - INSET],
          ] as const;
          for (const [v, t] of yTargets) {
            if (Math.abs(t - v) <= FRAME_SNAP) { newY += t - v; hy = t; break; }
          }
          // Landmark snap — stronger pull, snaps the overlay center
          if (vx === null) {
            for (const p of d.snapPoints) {
              const off = p.x - (newX + d.elW / 2);
              if (Math.abs(off) <= POINT_SNAP) { newX += off; vx = p.x; pt = p; break; }
            }
          }
          if (hy === null) {
            for (const p of d.snapPoints) {
              const off = p.y - (newY + d.elH / 2);
              if (Math.abs(off) <= POINT_SNAP) { newY += off; hy = p.y; pt = p; break; }
            }
          }
          setGuides(vx !== null || hy !== null ? { vx, hy, pt } : null);

          onStyleChange(overlayId, { x: newX, y: newY });
          break;
        }
        case 'rotate': {
          const cx = d.centerX;
          const cy = d.centerY;
          const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) - d.startPointerAngle + d.startRotation;
          onStyleChange(overlayId, { rotation: Math.round(angle) });
          break;
        }
        case 'resize-nw':
        case 'resize-ne':
        case 'resize-sw':
        case 'resize-se': {
          // Corner sign: which direction pulls the corner away from center.
          const sx = d.mode.endsWith('e') ? 1 : -1;
          const sy = d.mode.includes('s') ? 1 : -1;
          const pull = (dx * sx + dy * sy) / 2;
          const newScale = Math.max(0.3, Math.min(3, d.startScale + pull / 150));
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
    const onEnd = () => { dragRef.current = null; setGuides(null); };

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
    <>
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

          {/* Resize handles — all four corners */}
          {([
            ['nw', '-top-1 -left-1', 'cursor-nw-resize'],
            ['ne', '-top-1 -right-8', 'cursor-ne-resize'],
            ['sw', '-bottom-1 -left-1', 'cursor-sw-resize'],
            ['se', '-bottom-1 -right-1', 'cursor-se-resize'],
          ] as const).map(([corner, pos, cursor]) => (
            <div
              key={corner}
              className={`absolute ${pos} bg-yellow-400 rounded-sm pointer-events-auto ${cursor} hover:bg-yellow-300 transition-colors shadow-lg`}
              onMouseDown={(e) => startDrag(e, `resize-${corner}`)}
              onTouchStart={(e) => startDrag(e, `resize-${corner}`)}
              style={{ width: HANDLE_SIZE, height: HANDLE_SIZE }}
            />
          ))}

          {/* Rotation indicator */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] text-yellow-400 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none font-mono">
            {style.rotation}°
          </div>
        </div>
      )}
    </div>

    {/* Smart-guide lines — rendered in container space via portal so
        they aren't warped by this overlay's rotate/scale transform */}
    {guides && containerRef.current?.parentElement && createPortal(
      <>
        {guides.vx !== null && (
          <div className="absolute top-0 bottom-0 w-px bg-cyan-400/80 pointer-events-none z-40" style={{ left: guides.vx }} />
        )}
        {guides.hy !== null && (
          <div className="absolute left-0 right-0 h-px bg-cyan-400/80 pointer-events-none z-40" style={{ top: guides.hy }} />
        )}
        {guides.pt && (
          <div className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full bg-cyan-300 ring-2 ring-cyan-400/40 pointer-events-none z-40" style={{ left: guides.pt.x, top: guides.pt.y }} />
        )}
      </>,
      containerRef.current.parentElement,
    )}
    </>
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
