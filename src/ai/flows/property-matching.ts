// This file uses server-side code.
'use server';

/**
 * @fileOverview An AI agent that matches properties to client requirements.
 *
 * - matchProperties - A function that handles the property matching process.
 * - MatchPropertiesInput - The input type for the matchProperties function.
 * - MatchPropertiesOutput - The return type for the matchProperties function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchPropertiesInputSchema = z.object({
  clientRequirements: z
    .string()
    .describe('The requirements of the client for a property.'),
  propertyDetails: z
    .string()
    .describe('The details of available properties.'),
});
export type MatchPropertiesInput = z.infer<typeof MatchPropertiesInputSchema>;

const MatchPropertiesOutputSchema = z.object({
  matchingProperties: z
    .string()
    .describe(
      'A list of properties that match the client requirements, based on the property details.'
    ),
});
export type MatchPropertiesOutput = z.infer<typeof MatchPropertiesOutputSchema>;

export async function matchProperties(
  input: MatchPropertiesInput
): Promise<MatchPropertiesOutput> {
  return matchPropertiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchPropertiesPrompt',
  input: {schema: MatchPropertiesInputSchema},
  output: {schema: MatchPropertiesOutputSchema},
  prompt: `You are an expert real estate agent specializing in matching clients with properties.

You will receive the client's requirements and a list of property details. Based on these, you will identify properties that best match the client's needs.

Client Requirements: {{{clientRequirements}}}

Property Details: {{{propertyDetails}}}

Return a list of the properties that match the client requirements.`,
});

const matchPropertiesFlow = ai.defineFlow(
  {
    name: 'matchPropertiesFlow',
    inputSchema: MatchPropertiesInputSchema,
    outputSchema: MatchPropertiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
