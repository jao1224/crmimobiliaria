
'use server';

import { matchProperties as matchPropertiesFlow, type MatchPropertiesInput } from '@/ai/flows/property-matching';

// Dados simulados para a função da IA. Em um cenário real, isso viria do Firestore.
const propertyDetails = `
1. Apartamento Vista Mar: Lindo apartamento com 3 quartos, vista para o mar, cozinha moderna e 2 vagas de garagem. Preço: R$ 950.000.
2. Casa com Piscina: Espaçosa casa com 4 suítes, piscina, área gourmet e grande quintal. Ideal para famílias. Preço: R$ 1.200.000.
3. Terreno Comercial: Terreno de esquina em avenida movimentada, perfeito para construção de lojas. Preço: R$ 2.500.000.
4. Loft Moderno: Loft no centro da cidade, com design industrial, 1 quarto, perfeito para solteiros ou casais. Preço: R$ 450.000.
`;


export async function findMatchingProperties(clientRequirements: string) {
  try {
    if (!clientRequirements) {
      return { success: false, error: 'Os requisitos do cliente não podem estar vazios.' };
    }
    
    // Usa os detalhes dos imóveis simulados.
    const input: MatchPropertiesInput = {
      clientRequirements,
      propertyDetails,
    };

    const result = await matchPropertiesFlow(input);
    return { success: true, data: result.matchingProperties };
  } catch (error) {
    console.error('Erro em findMatchingProperties:', error);
    return { success: false, error: 'Falha ao encontrar imóveis correspondentes devido a um erro no servidor.' };
  }
}
