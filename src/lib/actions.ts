// This file uses server-side code.
'use server';

import { matchProperties as matchPropertiesFlow, type MatchPropertiesInput } from '@/ai/flows/property-matching';

// Uma lista de imóveis hardcoded para a IA usar.
const MOCK_PROPERTY_DETAILS = `
1. Apartamento Sunnyvale: 2 quartos, 2 banheiros, 110 m², cozinha moderna, varanda, perto do centro. Preço: R$ 750.000. Comissão: 2.5%.
2. Casa Greenfield: 4 quartos, 3 banheiros, 230 m², quintal grande, piscina, bairro tranquilo. Preço: R$ 1.200.000. Comissão: 2.0%.
3. Vila Lakeside: 5 quartos, 5 banheiros, 370 m², vista para o lago, doca particular, home theater. Preço: R$ 2.500.000. Comissão: 3.0%.
4. Loft no Centro: 1 quarto, 1 banheiro, 75 m², conceito aberto, tijolos aparentes, a uma curta distância de cafés. Preço: R$ 500.000. Comissão: 2.5%.
5. Casa Familiar Suburbana: 3 quartos, 2.5 banheiros, 185 m², ótimo distrito escolar, garagem para dois carros. Preço: R$ 850.000. Comissão: 2.2%.
6. Cobertura: 3 quartos, 3 banheiros, 200 m², vistas panorâmicas da cidade, terraço na cobertura, comodidades de luxo. Preço: R$ 1.800.000. Comissão: 2.75%.
`;

export async function findMatchingProperties(clientRequirements: string) {
  try {
    if (!clientRequirements) {
      return { success: false, error: 'Os requisitos do cliente não podem estar vazios.' };
    }
    
    const input: MatchPropertiesInput = {
      clientRequirements,
      propertyDetails: MOCK_PROPERTY_DETAILS,
    };
    const result = await matchPropertiesFlow(input);
    return { success: true, data: result.matchingProperties };
  } catch (error) {
    console.error('Erro em findMatchingProperties:', error);
    return { success: false, error: 'Falha ao encontrar imóveis correspondentes devido a um erro no servidor.' };
  }
}
