// This file uses server-side code.
'use server';

/**
 * @fileOverview Um agente de IA que combina imóveis com os requisitos do cliente.
 *
 * - matchProperties - Uma função que lida com o processo de correspondência de imóveis.
 * - MatchPropertiesInput - O tipo de entrada para a função matchProperties.
 * - MatchPropertiesOutput - O tipo de retorno para a função matchProperties.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchPropertiesInputSchema = z.object({
  clientRequirements: z
    .string()
    .describe('Os requisitos do cliente para um imóvel.'),
  propertyDetails: z
    .string()
    .describe('Os detalhes dos imóveis disponíveis.'),
});
export type MatchPropertiesInput = z.infer<typeof MatchPropertiesInputSchema>;

const MatchPropertiesOutputSchema = z.object({
  matchingProperties: z
    .string()
    .describe(
      'Uma lista de imóveis que correspondem aos requisitos do cliente, com base nos detalhes do imóvel.'
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
  prompt: `Você é um corretor de imóveis especialista em combinar clientes com imóveis.

Você receberá os requisitos do cliente e uma lista de detalhes de imóveis. Com base nisso, você identificará os imóveis que melhor atendem às necessidades do cliente.

Requisitos do Cliente: {{{clientRequirements}}}

Detalhes dos Imóveis: {{{propertyDetails}}}

Retorne uma lista dos imóveis que correspondem aos requisitos do cliente.`,
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
