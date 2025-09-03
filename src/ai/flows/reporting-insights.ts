// This file uses server-side code.
'use server';

/**
 * @fileOverview Um agente de IA que analisa dados de relatórios imobiliários e gera insights.
 * 
 * - getReportInsights - Uma função que lida com o processo de análise de relatórios.
 * - ReportInsightsInput - O tipo de entrada para a função.
 * - ReportInsightsOutput - O tipo de retorno para a função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReportInsightsInputSchema = z.object({
  salesData: z.string().describe('Um resumo dos dados de vendas do período.'),
  captureData: z.string().describe('Um resumo dos dados de captação de imóveis do período.'),
  teamData: z.string().describe('Um resumo dos dados de desempenho das equipes no período.'),
});
export type ReportInsightsInput = z.infer<typeof ReportInsightsInputSchema>;

const ReportInsightsOutputSchema = z.object({
  summary: z.string().describe('Um resumo conciso e geral da análise dos dados fornecidos.'),
  highlights: z.string().describe('Uma lista (usando marcadores como "-" ou "*") dos pontos positivos e negativos mais importantes encontrados nos dados. Seja direto.'),
  suggestions: z.string().describe('Uma lista (usando marcadores como "-" ou "*") de ações práticas e sugestões para melhorar o desempenho com base nos dados analisados.'),
});
export type ReportInsightsOutput = z.infer<typeof ReportInsightsOutputSchema>;

export async function getReportInsights(
  input: ReportInsightsInput
): Promise<ReportInsightsOutput> {
  return reportInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportInsightsPrompt',
  input: { schema: ReportInsightsInputSchema },
  output: { schema: ReportInsightsOutputSchema },
  prompt: `Você é um analista de negócios sênior em uma empresa imobiliária. Sua tarefa é analisar os dados de desempenho fornecidos e gerar insights valiosos.

Seja claro, objetivo e forneça recomendações práticas.

**Dados para Análise:**
- Desempenho de Vendas: {{{salesData}}}
- Desempenho de Captações: {{{captureData}}}
- Desempenho das Equipes: {{{teamData}}}

**Sua Resposta Deve Conter:**
1.  **Resumo (summary):** Um parágrafo curto resumindo a situação geral.
2.  **Destaques (highlights):** Uma lista com os principais pontos positivos (ex: "Alto volume de vendas no mês X") e negativos (ex: "Baixa captação de Apartamentos").
3.  **Sugestões (suggestions):** Uma lista de ações recomendadas (ex: "Focar captação em terrenos na Zona Sul" ou "Treinar a Equipe B em técnicas de fechamento").

Analise os dados e retorne a resposta no formato JSON especificado.`,
});

const reportInsightsFlow = ai.defineFlow(
  {
    name: 'reportInsightsFlow',
    inputSchema: ReportInsightsInputSchema,
    outputSchema: ReportInsightsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
