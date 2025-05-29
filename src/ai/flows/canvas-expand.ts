'use server';

/**
 * @fileOverview Expands the canvas beyond its current boundaries using generative AI.
 *
 * - expandCanvas - A function that handles the canvas expansion process.
 * - ExpandCanvasInput - The input type for the expandCanvas function.
 * - ExpandCanvasOutput - The return type for the expandCanvas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandCanvasInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The current state of the canvas, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  expandDirection: z
    .enum(['top', 'bottom', 'left', 'right'])
    .describe('The direction in which to expand the canvas.'),
  expandAmount: z
    .number()
    .int()
    .positive()
    .describe('The number of pixels to expand the canvas by.'),
  prompt: z
    .string()
    .optional()
    .describe('Optional prompt to guide the image generation.'),
});
export type ExpandCanvasInput = z.infer<typeof ExpandCanvasInputSchema>;

const ExpandCanvasOutputSchema = z.object({
  expandedCanvasDataUri: z
    .string()
    .describe(
      'The expanded canvas as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type ExpandCanvasOutput = z.infer<typeof ExpandCanvasOutputSchema>;

export async function expandCanvas(input: ExpandCanvasInput): Promise<ExpandCanvasOutput> {
  return expandCanvasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandCanvasPrompt',
  input: {schema: ExpandCanvasInputSchema},
  output: {schema: ExpandCanvasOutputSchema},
  prompt: `You are an AI that expands an image canvas in a specified direction.

You are given the current canvas image, the direction to expand, the amount to expand by, and an optional prompt to guide the expansion.

Expand the canvas in the {{{expandDirection}}} direction by {{{expandAmount}}} pixels.

{{#if prompt}}
Use the following prompt to guide the image generation: {{{prompt}}}
{{/if}}

Current Canvas Image: {{media url=photoDataUri}}
`,
});

const expandCanvasFlow = ai.defineFlow(
  {
    name: 'expandCanvasFlow',
    inputSchema: ExpandCanvasInputSchema,
    outputSchema: ExpandCanvasOutputSchema,
  },
  async input => {
    const {
      photoDataUri,
      expandDirection,
      expandAmount,
      prompt: generationPrompt,
    } = input;

    // Construct the prompt for image generation.
    let fullPrompt = `Expand the canvas in the ${expandDirection} direction by ${expandAmount} pixels.`;
    if (generationPrompt) {
      fullPrompt += ` Use the following prompt to guide the image generation: ${generationPrompt}`;
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        {media: {url: photoDataUri}},
        {text: fullPrompt},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {expandedCanvasDataUri: media.url!};
  }
);
