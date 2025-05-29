"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import DrawingCanvas, { type CanvasHandle } from '@/components/canvas/drawing-canvas';
import { MainToolbar } from '@/components/toolbar/main-toolbar';
import type { DrawingTool, CanvasConfig } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";


const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

export default function HomePage() {
  const [activeTool, setActiveTool] = useState<DrawingTool>('pencil');
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(5);
  
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({ 
    width: DEFAULT_CANVAS_WIDTH, 
    height: DEFAULT_CANVAS_HEIGHT 
  });
  const [initialCanvasDataUrl, setInitialCanvasDataUrl] = useState<string | null>(null);
  const [canvasKey, setCanvasKey] = useState<string>(`canvas-${Date.now()}`);


  const canvasRef = useRef<CanvasHandle>(null);
  const { toast } = useToast();

  const handleCanvasConfigChange = useCallback((newConfig: CanvasConfig) => {
    setCanvasConfig(newConfig);
    // A new key will force DrawingCanvas to re-evaluate its initial setup with new dimensions
    setCanvasKey(`canvas-${newConfig.width}-${newConfig.height}-${Date.now()}`);
    toast({ title: "Canvas Resized", description: `New dimensions: ${newConfig.width}x${newConfig.height}` });
  }, [toast]);

  const handleInitialCanvasDataSet = useCallback((dataUrl: string) => {
    setInitialCanvasDataUrl(dataUrl);
    // Update key to reflect new data URL, ensuring canvas re-renders if it was previously blank
    setCanvasKey(`canvas-data-${Date.now()}`); 
  }, []);

  // Effect to initialize canvas with a blank white state and get its data URI
  useEffect(() => {
    if (canvasRef.current && !initialCanvasDataUrl) {
      canvasRef.current.clearCanvas('#FFFFFF');
      const dataUri = canvasRef.current.getDataUri();
      setInitialCanvasDataUrl(dataUri);
    }
  }, [initialCanvasDataUrl]); // Runs once when initialCanvasDataUrl is null
  

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-1 overflow-hidden pt-14"> {/* pt-14 to offset fixed header */}
        <MainToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          canvasRef={canvasRef}
          currentCanvasConfig={canvasConfig}
          onCanvasConfigChange={handleCanvasConfigChange}
          onInitialCanvasDataSet={handleInitialCanvasDataSet}
        />
        <div className="flex-1 p-6 md:p-8 overflow-auto flex items-center justify-center bg-muted/30">
          <DrawingCanvas
            ref={canvasRef}
            key={canvasKey} 
            width={canvasConfig.width}
            height={canvasConfig.height}
            tool={activeTool}
            color={color}
            brushSize={brushSize}
            initialDataUrl={initialCanvasDataUrl} 
          />
        </div>
      </main>
    </div>
  );
}
