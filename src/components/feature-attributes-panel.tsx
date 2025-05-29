
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X as LucideX, GripVertical } from 'lucide-react';

interface FeatureAttributesPanelProps {
  featuresAttributes: Record<string, any>[] | null;
  isVisible: boolean;
  onClose: () => void;
  // mapAreaRef prop is no longer needed for drag restriction
}

const FeatureAttributesPanel: React.FC<FeatureAttributesPanelProps> = ({
  featuresAttributes,
  isVisible,
  onClose,
  // mapAreaRef, // Removed as prop
}) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDownOnHeader = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    if ((e.target as HTMLElement).closest('.no-drag')) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: position.x,
      panelY: position.y,
    };
    e.preventDefault(); 
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !panelRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      let newX = dragStartRef.current.panelX + dx;
      let newY = dragStartRef.current.panelY + dy;
      
      // Dragging is no longer restricted to any boundaries
      
      if (!isNaN(newX) && !isNaN(newY)) {
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);


  if (!isVisible || !featuresAttributes || featuresAttributes.length === 0) {
    return null;
  }

  const allKeys = Array.from(
    new Set(featuresAttributes.flatMap(attrs => Object.keys(attrs)))
  ).sort();

  return (
    <div
      ref={panelRef}
      className="absolute bg-card text-card-foreground shadow-2xl rounded-lg border border-gray-700 flex flex-col"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: '250px',
        minHeight: '200px',
        maxWidth: '80vw',
        maxHeight: '70vh',
        zIndex: 40, 
        resize: 'both',
        overflow: 'hidden', 
      }}
      onMouseUpCapture={() => { 
        if (panelRef.current) {
            const newWidth = panelRef.current.offsetWidth;
            const newHeight = panelRef.current.offsetHeight;
            if (newWidth !== size.width || newHeight !== size.height) {
                 setSize({ width: newWidth, height: newHeight });
            }
        }
      }}
    >
      <CardHeader 
        className="flex flex-row items-center justify-between p-3 bg-gray-700/80 cursor-grab rounded-t-lg no-drag"
        onMouseDown={handleMouseDownOnHeader}
      >
        <div className="flex items-center">
            <GripVertical className="h-5 w-5 mr-2 text-gray-400" />
            <CardTitle className="text-base font-semibold text-white">Atributos de Entidad(es)</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white hover:bg-gray-600/80">
          <LucideX className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden"> 
        <ScrollArea className="h-full w-full"> 
          <div className="p-3"> 
          {allKeys.length > 0 ? (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-800/50 hover:bg-gray-800/70">
                  {allKeys.map(key => (
                    <TableHead key={key} className="px-3 py-2 text-xs font-medium text-gray-300 whitespace-nowrap sticky top-0 bg-gray-700/90 backdrop-blur-sm z-10">
                      {key}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuresAttributes.map((attrs, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-700/30">
                    {allKeys.map(key => (
                      <TableCell key={key} className="px-3 py-1.5 text-xs text-gray-200 border-b border-gray-700/50 whitespace-normal break-words">
                        {String(attrs[key] === null || attrs[key] === undefined ? '' : attrs[key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-center text-gray-400">No hay atributos para mostrar.</p>
          )}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  );
};

export default FeatureAttributesPanel;

    
