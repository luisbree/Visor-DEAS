"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { expandCanvas, type ExpandCanvasInput } from '@/ai/flows/canvas-expand';
import type { ExpandDirection } from '@/lib/types';
import { Loader2, Wand2 } from 'lucide-react';

const expandSchema = z.object({
  expandDirection: z.enum(['top', 'bottom', 'left', 'right'], {
    required_error: "Expansion direction is required."
  }),
  expandAmount: z.coerce.number().int().positive({ message: "Amount must be a positive number." }).min(10, {message: "Minimum expansion is 10px"}).max(512, {message: "Maximum expansion is 512px"}),
  prompt: z.string().optional(),
});

type ExpandFormValues = z.infer<typeof expandSchema>;

interface AIExpandDialogProps {
  currentCanvasDataUri: () => Promise<string | null>;
  onExpandComplete: (newImageDataUri: string, newWidth: number, newHeight: number) => Promise<void>;
  currentWidth: number;
  currentHeight: number;
}

export function AIExpandDialog({ currentCanvasDataUri, onExpandComplete, currentWidth, currentHeight }: AIExpandDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const { toast } = useToast();

  const form = useForm<ExpandFormValues>({
    resolver: zodResolver(expandSchema),
    defaultValues: {
      expandDirection: 'right',
      expandAmount: 100,
      prompt: '',
    },
  });

  const onSubmit = async (values: ExpandFormValues) => {
    setIsExpanding(true);
    try {
      const photoDataUri = await currentCanvasDataUri();
      if (!photoDataUri) {
        toast({
          title: "Error",
          description: "Could not get current canvas data. Please draw something first or ensure the canvas is initialized.",
          variant: "destructive",
        });
        setIsExpanding(false);
        return;
      }

      const input: ExpandCanvasInput = {
        photoDataUri,
        expandDirection: values.expandDirection as ExpandDirection,
        expandAmount: values.expandAmount,
        prompt: values.prompt,
      };
      
      const result = await expandCanvas(input);

      if (result.expandedCanvasDataUri) {
        const img = new Image();
        img.onload = async () => {
          // Use actual image dimensions from loaded image for safety
          await onExpandComplete(result.expandedCanvasDataUri, img.width, img.height);
          toast({
            title: "Canvas Expanded",
            description: "The canvas has been expanded successfully.",
          });
          setIsOpen(false);
          form.reset();
        };
        img.onerror = () => {
           toast({ title: "Error", description: "Failed to load expanded image.", variant: "destructive" });
        }
        img.src = result.expandedCanvasDataUri;
      } else {
        throw new Error("Expansion failed: No image data returned.");
      }
    } catch (error) {
      console.error("Expansion error:", error);
      toast({
        title: "Expansion Failed",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Wand2 className="mr-2 h-4 w-4" />
          AI Expand
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generative Expand Canvas</DialogTitle>
          <DialogDescription>
            Use AI to expand and 'hallucinate' details on an edge of the canvas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expandDirection" className="text-right">
              Direction
            </Label>
            <Select
              defaultValue="right"
              onValueChange={(value) => form.setValue('expandDirection', value as ExpandDirection)}
            >
              <SelectTrigger id="expandDirection" className="col-span-3">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.expandDirection && (
              <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.expandDirection.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expandAmount" className="text-right">
              Amount (px)
            </Label>
            <Input
              id="expandAmount"
              type="number"
              defaultValue={100}
              className="col-span-3"
              {...form.register('expandAmount')}
            />
            {form.formState.errors.expandAmount && (
              <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.expandAmount.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="prompt" className="text-right pt-2 self-start">
              Prompt
            </Label>
            <Textarea
              id="prompt"
              placeholder="Optional: e.g., 'a mystical forest scene'"
              className="col-span-3 min-h-[80px]"
              {...form.register('prompt')}
            />
             {form.formState.errors.prompt && (
              <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.prompt.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isExpanding}>
              {isExpanding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Expand Canvas
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
