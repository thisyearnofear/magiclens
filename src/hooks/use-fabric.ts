import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

export const useFabric = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  width: number,
  height: number
) => {
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
      });
      fabricRef.current = canvas;
    }

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [canvasRef, width, height]);

  return fabricRef;
};