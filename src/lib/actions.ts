

'use server';

import { matchProperties as matchPropertiesFlow, type MatchPropertiesInput } from '@/ai/flows/property-matching';
import { getReportInsights as getReportInsightsFlow, type ReportInsightsInput, type ReportInsightsOutput } from '@/ai/flows/reporting-insights';
import { getProperties, addProperty as addPropertyToDb, type Property } from './data';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

export async function addProperty(formData: FormData) {
    try {
        const userPayload = formData.get('currentUser') as string;
        if (!userPayload) {
            return { success: false, error: 'Usuário não autenticado.' };
        }
        
        const currentUser = JSON.parse(userPayload) as User;

        const newPropertyData: Omit<Property, 'id' | 'imageUrl' | 'displayCode' | 'capturedById' | 'capturedBy' | 'price' | 'commission'> & { price: number; commission: number } = {
            name: formData.get('name') as string,
            address: formData.get('address') as string,
            status: 'Disponível',
            price: Number(formData.get('price')),
            commission: Number(formData.get('commission')),
            imageHint: 'novo imovel',
            description: formData.get('description') as string,
            ownerInfo: formData.get('owner') as string,
            type: formData.get('type') as Property['type'],
        };
        
        const file = formData.get('image') as File | null;

        await addPropertyToDb(newPropertyData, file, currentUser);

        return { success: true };
    } catch (error: any) {
        console.error('Erro na Server Action addProperty:', error);
        return { success: false, error: error.message || 'Falha ao adicionar imóvel.' };
    }
}


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

export async function getReportInsights(salesData: string, captureData: string, teamData: string): Promise<{ success: boolean, data?: ReportInsightsOutput, error?: string}> {
    try {
        if (!salesData && !captureData && !teamData) {
            return { success: false, error: "Dados insuficientes para gerar uma análise."};
        }

        const input: ReportInsightsInput = { salesData, captureData, teamData };
        const result = await getReportInsightsFlow(input);

        return { success: true, data: result };

    } catch (error) {
        console.error('Erro em getReportInsights:', error);
        return { success: false, error: 'Falha ao gerar análise de relatório devido a um erro no servidor.' };
    }
}
