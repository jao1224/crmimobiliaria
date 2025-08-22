
'use server';

import { matchProperties as matchPropertiesFlow, type MatchPropertiesInput } from '@/ai/flows/property-matching';
import { getReportInsights as getReportInsightsFlow, type ReportInsightsInput, type ReportInsightsOutput } from '@/ai/flows/reporting-insights';
import { addProperty as addPropertyToDb, updateProperty as updatePropertyToDb, getProperties } from './data';


export async function addProperty(formData: FormData) {
    try {
        await addPropertyToDb(formData);
        return { success: true };
    } catch (error: any) {
        console.error('Erro na Server Action addProperty:', error);
        return { success: false, error: error.message || 'Falha ao adicionar imóvel.' };
    }
}

export async function updateProperty(formData: FormData) {
    try {
        await updatePropertyToDb(formData);
        return { success: true };
    } catch (error: any) {
        console.error('Erro na Server Action updateProperty:', error);
        return { success: false, error: error.message || 'Falha ao atualizar imóvel.' };
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
