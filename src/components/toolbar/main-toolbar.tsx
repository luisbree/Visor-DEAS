"use client";

import type React from 'react';
import {
  Pencil,
  Paintbrush,
  Eraser,
  Palette,
  Download,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react';
import { ToolButton } from './tool-button';
import { AIExpandDialog } from './ai-expand-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from "@/components/ui/slider";
import type { DrawingTool, CanvasConfig } from '@/lib/types';
import type { CanvasHandle } from '@/components/canvas/drawing-canvas';

interface MainToolbarProps {
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  canvasRef: React.RefObject<CanvasHandle>;
  currentCanvasConfig: CanvasConfig;
  onCanvasConfigChange: (newConfig: CanvasConfig) => void;
  onInitialCanvasDataSet: (dataUrl: string) => void;
}

export function MainToolbar({
  activeTool,
  setActiveTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  canvasRef,
  currentCanvasConfig,
  onCanvasConfigChange,
  onInitialCanvasDataSet,
}: MainToolbarProps) {

  const handleExport = (format: 'png' | 'jpeg') => {
    if (format === 'png') {
      const dataUri = canvasRef.current?.getDataUri('image/png');
      if (dataUri) downloadImage(dataUri, 'genesis_canvas.png');
    } else {
      const dataUri = canvasRef.current?.getDataUri('image/jpeg', 0.9);
      if (dataUri) downloadImage(dataUri, 'genesis_canvas.jpeg');
    }
  };

  const downloadImage = (dataUri: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearCanvas = () => {
    canvasRef.current?.clearCanvas('#FFFFFF'); // Clear to white
    const dataUri = canvasRef.current?.getDataUri(); // Get data URI of cleared canvas
    if (dataUri) {
      onInitialCanvasDataSet(dataUri); // Update parent state
    }
  };

  const handleAIExpandComplete = async (newImageDataUri: string, newWidth: number, newHeight: number) => {
    await canvasRef.current?.loadDataUri(newImageDataUri, newWidth, newHeight);
    onCanvasConfigChange({ width: newWidth, height: newHeight });
  };
  
  const getCurrentCanvasData = async (): Promise<string | null> => {
    return canvasRef.current?.getDataUri() || null;
  };


  return (
    <aside className="w-72 p-4 border-r bg-card flex-shrink-0 flex flex-col space-y-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div>
        <Label className="text-sm font-medium mb-2 block">Tools</Label>
        <div className="grid grid-cols-3 gap-2">
          <ToolButton
            icon={Pencil}
            label="Pencil"
            isActive={activeTool === 'pencil'}
            onClick={() => setActiveTool('pencil')}
          />
          <ToolButton
            icon={Paintbrush}
            label="Brush"
            isActive={activeTool === 'brush'}
            onClick={() => setActiveTool('brush')}
          />
          <ToolButton
            icon={Eraser}
            label="Eraser"
            isActive={activeTool === 'eraser'}
            onClick={() => setActiveTool('eraser')}
          />
        </div>
      </div>

      <Separator />

      <div>
        <Label htmlFor="colorPicker" className="text-sm font-medium mb-2 block">Color</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="colorPicker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 p-1 border rounded-md cursor-pointer"
            aria-label="Color Picker"
          />
           <Palette className="h-5 w-5 text-muted-foreground" />
           <span className="text-sm tabular-nums">{color.toUpperCase()}</span>
        </div>
      </div>
      
      <Separator />

      <div>
        <Label htmlFor="brushSize" className="text-sm font-medium mb-2 block">Brush Size: {brushSize}px</Label>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => setBrushSize(Math.max(1, brushSize - 1))} aria-label="Decrease brush size" className="h-8 w-8">
            <Minus className="h-4 w-4" />
          </Button>
          <Slider
            id="brushSize"
            min={1}
            max={50}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            className="flex-grow"
            aria-label="Brush size slider"
          />
          <Button variant="outline" size="icon" onClick={() => setBrushSize(Math.min(50, brushSize + 1))} aria-label="Increase brush size" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-sm font-medium mb-2 block">Actions</Label>
        <div className="space-y-2">
           <AIExpandDialog 
              currentCanvasDataUri={getCurrentCanvasData}
              onExpandComplete={handleAIExpandComplete}
              currentWidth={currentCanvasConfig.width}
              currentHeight={currentCanvasConfig.height}
           />
          <Button variant="outline" className="w-full justify-start" onClick={handleClearCanvas}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear Canvas
          </Button>
        </div>
      </div>
      
      <Separator />

      <div>
        <Label className="text-sm font-medium mb-2 block">Export</Label>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => handleExport('png')}>
            <Download className="mr-2 h-4 w-4" /> Export as PNG
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => handleExport('jpeg')}>
            <Download className="mr-2 h-4 w-4" /> Export as JPEG
          </Button>
        </div>
      </div>
    </aside>
  );
}
