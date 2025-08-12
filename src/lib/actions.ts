
'use server';

import { matchProperties as matchPropertiesFlow, type MatchPropertiesInput } from '@/ai/flows/property-matching';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Função para buscar imóveis do Firestore e formatá-los para a IA.
async function getPropertyDetailsFromFirestore() {
  try {
    const propertiesCollection = collection(db, 'properties');
    const querySnapshot = await getDocs(propertiesCollection);
    
    if (querySnapshot.empty) {
      return 'Nenhum imóvel disponível na base de dados.';
    }

    const properties = querySnapshot.docs.map((doc, index) => {
      const data = doc.data();
      // Formata os detalhes de cada imóvel em uma string legível para a IA.
      return `${index + 1}. (ID: ${doc.id}) ${data.name}: ${data.description || 'Sem descrição'}. Endereço: ${data.address}. Preço: R$ ${new Intl.NumberFormat('pt-BR').format(data.price)}. Comissão: ${data.commission}%. Status: ${data.status}.`;
    });

    return properties.join('\n');
  } catch (error) {
    console.error("Erro ao buscar imóveis do Firestore:", error);
    // Retorna uma string de erro que pode ser passada para a IA ou tratada.
    return "Erro ao acessar a lista de imóveis.";
  }
}


export async function findMatchingProperties(clientRequirements: string) {
  try {
    if (!clientRequirements) {
      return { success: false, error: 'Os requisitos do cliente não podem estar vazios.' };
    }
    
    // Busca dinamicamente os detalhes dos imóveis do Firestore.
    const propertyDetails = await getPropertyDetailsFromFirestore();

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

    