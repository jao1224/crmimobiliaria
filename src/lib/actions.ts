
'use server';

import { matchProperties as matchPropertiesFlow, type MatchPropertiesInput } from '@/ai/flows/property-matching';
import { getProperties } from './data';

export async function findMatchingProperties(clientRequirements: string) {
  try {
    if (!clientRequirements) {
      return { success: false, error: 'Os requisitos do cliente não podem estar vazios.' };
    }
    
    // Busca os imóveis do Firestore
    const propertiesFromDb = await getProperties();

    // Formata os detalhes dos imóveis para a IA
    const propertyDetails = propertiesFromDb.map((prop, index) => 
        `${index + 1}. ${prop.name} (Tipo: ${prop.type}, Status: ${prop.status}): ${prop.description || ''} Localizado em ${prop.address}. Preço: R$ ${prop.price}.`
    ).join('\n');

    if (!propertyDetails) {
        return { success: true, data: "Nenhum imóvel encontrado no banco de dados para comparar." };
    }

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
