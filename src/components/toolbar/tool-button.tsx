"use client";

import type { LucideIcon } from 'lucide-react';
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolButtonProps extends ButtonProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
}

export function ToolButton({ icon: Icon, label, isActive, className, ...props }: ToolButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            aria-label={label}
            className={cn("h-10 w-10 rounded-md", isActive && "ring-2 ring-accent", className)}
            {...props}
          >
            <Icon className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
