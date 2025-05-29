"use client";

import React, { useRef, useEffect, useImperativeHandle, useState, useCallback } from 'react';
import type { DrawingTool } from '@/lib/types';

interface DrawingCanvasProps {
  width: number;
  height: number;
  tool: DrawingTool;
  color: string;
  brushSize: number;
  initialDataUrl?: string | null;
}

export interface CanvasHandle {
  getDataUri: (type?: 'image/png' | 'image/jpeg', quality?: number) => string;
  loadDataUri: (dataUri: string, newWidth?: number, newHeight?: number) => Promise<void>;
  clearCanvas: (backgroundColor?: string) => void;
}

const DrawingCanvas = React.forwardRef<CanvasHandle, DrawingCanvasProps>(
  ({ width, height, tool, color, brushSize, initialDataUrl }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    const getCanvasContext = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.getContext('2d');
    }, []);
    
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Ensure canvas actual dimensions match props before getting context
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const context = getCanvasContext();
      if (context) {
        setCtx(context);
        // If there's an initialDataUrl, load it. Otherwise, clear to white.
        // This should happen after context is confirmed.
        if (initialDataUrl) {
          const img = new Image();
          img.onload = () => {
            // The image might have different dimensions than props
            canvas.width = img.width;
            canvas.height = img.height;
            const freshCtx = getCanvasContext(); // Re-get context if canvas resized
            if (freshCtx) {
              freshCtx.clearRect(0, 0, img.width, img.height);
              freshCtx.drawImage(img, 0, 0);
              setCtx(freshCtx);
            }
          };
          img.src = initialDataUrl;
        } else {
          // Clear to white for new canvas
          clearCanvasInternal(context, width, height, '#FFFFFF');
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width, height, initialDataUrl, getCanvasContext]); // Dependencies updated


    const clearCanvasInternal = (context: CanvasRenderingContext2D, w: number, h: number, backgroundColor: string = '#FFFFFF') => {
      context.clearRect(0, 0, w, h);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, w, h);
    };

    useImperativeHandle(ref, () => ({
      getDataUri: (type: 'image/png' | 'image/jpeg' = 'image/png', quality: number = 0.95) => {
        return canvasRef.current?.toDataURL(type, quality) || '';
      },
      loadDataUri: async (dataUri: string, newWidth?: number, newHeight?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return Promise.reject(new Error("Canvas not available"));
        
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const w = newWidth ?? img.width;
            const h = newHeight ?? img.height;
            canvas.width = w;
            canvas.height = h;
            const freshCtx = getCanvasContext(); 
            if (freshCtx) {
              freshCtx.clearRect(0, 0, w, h);
              freshCtx.drawImage(img, 0, 0, w, h);
              setCtx(freshCtx);
              resolve();
            } else {
              reject(new Error("Failed to get canvas context after resize"));
            }
          };
          img.onerror = (e) => {
            console.error("Failed to load image for canvas", e);
            reject(new Error("Failed to load image"));
          };
          img.src = dataUri;
        });
      },
      clearCanvas: (backgroundColor: string = '#FFFFFF') => {
        const canvas = canvasRef.current;
        const currentCtx = getCanvasContext();
        if (!canvas || !currentCtx) return;
        
        // Reset to original configured dimensions on clear might be desired by parent.
        // For now, let's use current canvas dimensions as set by props or loadDataUri
        if (canvas.width !== width || canvas.height !== height) {
           canvas.width = width;
           canvas.height = height;
        }
        const freshCtx = getCanvasContext(); // Re-get context if canvas dimensions changed
        if(freshCtx) {
          clearCanvasInternal(freshCtx, canvas.width, canvas.height, backgroundColor);
          setCtx(freshCtx);
        }
      },
    }));

    const applyToolSettings = useCallback((context: CanvasRenderingContext2D) => {
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      if (tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
      } else {
        context.globalCompositeOperation = 'source-over';
      }
    }, [color, brushSize, tool]);
    
    useEffect(() => {
      if (ctx) {
        applyToolSettings(ctx);
      }
    }, [tool, color, brushSize, ctx, applyToolSettings]);

    const getCoordinates = (event: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { offsetX: 0, offsetY: 0 };
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        return {offsetX: 0, offsetY: 0};
      }
      return { offsetX: clientX - rect.left, offsetY: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!ctx) return;
      const { offsetX, offsetY } = getCoordinates(e.nativeEvent);
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      setIsDrawing(true);
      applyToolSettings(ctx); // Apply settings at the start of each stroke
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !ctx) return;
      const { offsetX, offsetY } = getCoordinates(e.nativeEvent);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!ctx) return;
      ctx.closePath();
      setIsDrawing(false);
    };

    return (
      <canvas
        ref={canvasRef}
        // width and height props are set initially in useEffect or by loadDataUri
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-muted shadow-lg rounded-md touch-none bg-white"
        style={{ cursor: 'crosshair' }}
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;
