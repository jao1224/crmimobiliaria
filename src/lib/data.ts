

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, limit, where, getDoc, setDoc } from 'firebase/firestore';

// Tipos para os dados de CRM
export type Lead = {
    id: string;
    name: string;
    source: string;
    status: string;
    assignedTo: string;
};

export type Deal = {
    id:string;
    property: string;
    client: string;
    stage: string;
    value: number;
    closeDate: string;
};

export type NegotiationStage = 'Proposta Enviada' | 'Em Negociação' | 'Contrato Gerado' | 'Venda Concluída' | 'Aluguel Ativo';
export type NegotiationType = 'Venda' | 'Aluguel' | 'Leilão';
export type ContractStatus = 'Não Gerado' | 'Pendente Assinaturas' | 'Assinado' | 'Cancelado';
export type PropertyType = 'Lançamento' | 'Revenda' | 'Terreno' | 'Casa' | 'Apartamento';

// Define o tipo para um imóvel
export type Property = {
  id: string;
  name: string;
  address: string;
  status: string;
  price: number;
  type: PropertyType;
  commission: number; // Armazenado como taxa percentual, ex: 2.5
  imageUrl: string;
  imageHint: string;
  capturedBy: string; // Corretor que captou o imóvel
  description?: string;
  ownerInfo?: string;
  team?: string; // CAMPO ADICIONADO PARA GESTÃO DE LOJAS/EQUIPES
};


export type Negotiation = {
    id: string;
    property: string;
    propertyId: string;
    propertyType: PropertyType;
    client: string;
    clientId: string;
    stage: NegotiationStage;
    type: NegotiationType;
    value: number;
    salesperson: string;
    realtor: string;
    contractStatus: ContractStatus;
    completionDate: string | null; // Data de conclusão para relatórios
    isFinanced?: boolean;
    // Novos campos para a tabela de processos
    status: ProcessStatus;
    processStage: ProcessStage;
    negotiationType: string;
    category: string;
    team: string;
    observations?: string;
};

// --- TIPOS PARA GESTÃO DE PROCESSOS ---
export type ProcessStatus = 'Ativo' | 'Suspenso' | 'Cancelado' | 'Finalizado';
export type ProcessStage = 'Em andamento' | 'Pendência' | 'Finalizado';


export type Commission = {
    id: string;
    negotiationId: string;
    propertyValue: number;
    clientName: string;
    realtorName: string; // Captador
    salespersonName: string; // Vendedor
    managerName?: string; // Gerente
    clientSignal?: number; // Sinal do cliente
    commissionValue: number;
    commissionRate: number;
    paymentDate: string;
    status: 'Pago' | 'Pendente' | 'Vencido';
    notes?: string;
};

// --- NOVOS TIPOS PARA CORRESPONDENTE ---
export type FinancingStatus = 'Aprovado' | 'Reprovado' | 'Condicionado' | 'Bloqueado' | 'Pendente';
export type EngineeringStatus = 'Aprovado' | 'Reprovado' | 'Pendência' | 'Não solicitado';
export type GeneralProcessStatus = 'Ativo' | 'Suspenso' | 'Cancelado' | 'Concluído';

export type FinancingProcess = {
    id: string;
    negotiationId: string;
    clientName: string;
    propertyName: string;
    realtorName: string;
    // Status do Cliente
    clientStatus: FinancingStatus;
    clientStatusReason: string;
    approvedValue: number;
    // Consulta Bacen
    bacenInfo: string;
    // Engenharia
    engineeringStatus: EngineeringStatus;
    engineeringReason: string;
    appraisalValue: number;
    appraisalDate: string;
    // Documentação
    docs: {
        propertyRegistration: { updated: boolean, dueDate: string },
        paycheck: { updated: boolean, dueDate: string },
        addressProof: { updated: boolean, dueDate: string },
        clientApproval: { updated: boolean, dueDate: string },
        engineeringReport: { updated: boolean, dueDate: string },
    },
    // Etapas do Processo
    stages: {
        formSignature: boolean,
        compliance: boolean,
        financingResources: boolean,
        bankSignature: string, // data
        registryEntry: string, // data
        warranty: string, // data
    }
    generalStatus: GeneralProcessStatus;
    hasPendency: boolean; // para o ícone de alerta
};

export type ServiceRequestType = 'credit_approval' | 'engineering_report' | 'property_registration' | 'account_opening';

export type ServiceRequest = {
    id: string;
    type: ServiceRequestType;
    realtorName: string;
    clientInfo: string;
    propertyInfo: string;
    status: 'Pendente' | 'Em Análise' | 'Concluído';
    date: string;
};

export type EventType = 'personal' | 'company' | 'team_visit';

export type Event = {
    id: string;
    date: Date | { seconds: number; nanoseconds: number }; // Suporte para Timestamp do Firestore
    title: string;
    type: EventType;
    time: string;
    description: string;
};

export type PaymentCLT = {
    id: string;
    employee: string;
    type: 'Salário' | '13º Salário' | 'Férias' | 'Impostos';
    amount: number;
    paymentDate: string;
    status: 'Agendado' | 'Pago';
};

export type Expense = {
    id: string;
    description: string;
    category: 'Fixa' | 'Variável';
    amount: number;
    dueDate: string;
    status: 'Pendente' | 'Pago';
};

export type Notification = {
    id: string;
    title: string;
    description: string;
    createdAt: { seconds: number, nanoseconds: number };
    read: boolean;
};

// --- TIPO PARA O KANBAN DE ATIVIDADES ---
export type ActivityStatus = 'Ativo' | 'Pendente' | 'Concluído' | 'Cancelado';
export type Activity = {
    id: string; // ID da propriedade ou negociação
    realtorName: string;
    type: 'capture' | 'negotiation';
    name: string; // Nome do imóvel ou negociação
    value: number;
    status: ActivityStatus;
    relatedId: string; // ID original do Firestore (prop ou neg)
};


// --- Dados simulados (para referência e fallback) ---
export const realtors = ['Carlos Pereira', 'Sofia Lima', 'Joana Doe', 'Admin'];
export const propertyTypes: PropertyType[] = ['Lançamento', 'Revenda', 'Terreno', 'Casa', 'Apartamento'];
export const teams = [
    { id: 'team-a', name: 'Equipe A', members: ['Carlos Pereira', 'Sofia Lima'] },
    { id: 'team-b', name: 'Equipe B', members: ['Joana Doe', 'Admin'] },
];

// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (FIRESTORE) ---

export const getProperties = async (): Promise<Property[]> => {
    const propertiesCollection = collection(db, 'properties');
    const snapshot = await getDocs(propertiesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const getPropertiesByRealtor = async (realtorName: string): Promise<Property[]> => {
    const q = query(collection(db, "properties"), where("capturedBy", "==", realtorName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const addProperty = async (newProperty: Omit<Property, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'properties'), newProperty);
    return docRef.id;
};

export const updateProperty = async (id: string, data: Partial<Property>): Promise<void> => {
    const propertyRef = doc(db, "properties", id);
    await updateDoc(propertyRef, data);
};

export const getNegotiations = async (): Promise<Negotiation[]> => {
    const negotiationsCollection = collection(db, 'negotiations');
    const snapshot = await getDocs(negotiationsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
};

export const getNegotiationsByRealtor = async (realtorName: string): Promise<Negotiation[]> => {
    const q = query(collection(db, "negotiations"), where("salesperson", "==", realtorName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
};


export const addNegotiation = async (newNegotiation: Omit<Negotiation, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'negotiations'), newNegotiation);
    return docRef.id;
};

export const updateNegotiation = async (id: string, data: Partial<Negotiation>): Promise<void> => {
    const negotiationRef = doc(db, "negotiations", id);
    await updateDoc(negotiationRef, data);
};

export const getCommissions = async (): Promise<Commission[]> => {
    const commissionsCollection = collection(db, 'commissions');
    const snapshot = await getDocs(commissionsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
};

export const addCommission = async (newCommission: Omit<Commission, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'commissions'), newCommission);
    return docRef.id;
};

export const getPayments = async (): Promise<PaymentCLT[]> => {
    const paymentsCollection = collection(db, 'payments');
    const snapshot = await getDocs(paymentsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentCLT));
};

export const addPayment = async (newPayment: Omit<PaymentCLT, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'payments'), newPayment);
    return docRef.id;
};

export const getExpenses = async (): Promise<Expense[]> => {
    const expensesCollection = collection(db, 'expenses');
    const snapshot = await getDocs(expensesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
};

export const addExpense = async (newExpense: Omit<Expense, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'expenses'), newExpense);
    return docRef.id;
};

export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
    const serviceRequestsCollection = collection(db, 'serviceRequests');
    const snapshot = await getDocs(serviceRequestsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
};

export const addServiceRequest = async (newRequest: Omit<ServiceRequest, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'serviceRequests'), newRequest);
    return docRef.id;
};

export const getFinancingProcesses = async (): Promise<FinancingProcess[]> => {
    const financingProcessesCollection = collection(db, 'financingProcesses');
    const snapshot = await getDocs(financingProcessesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancingProcess));
};

export const addFinancingProcess = async (newProcess: Omit<FinancingProcess, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'financingProcesses'), newProcess);
    return docRef.id;
};

export const updateFinancingProcess = async (id: string, data: Partial<FinancingProcess>): Promise<void> => {
    const processRef = doc(db, 'financingProcesses', id);
    await updateDoc(processRef, data);
};

export const getEvents = async (): Promise<Event[]> => {
    const eventsCollection = collection(db, 'events');
    const snapshot = await getDocs(eventsCollection);
    const events = snapshot.docs.map(doc => {
        const data = doc.data();
        // Converte Timestamp do Firestore para objeto Date do JS
        const date = data.date && typeof data.date.seconds === 'number'
            ? new Date(data.date.seconds * 1000)
            : new Date();
        return { id: doc.id, ...data, date } as Event;
    });
    return events;
};


export const addEvent = async (newEvent: Omit<Event, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'events'), newEvent);
    return docRef.id;
};

// --- Funções de Notificação ---
export const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
        read: false,
    });
    return docRef.id;
};

export const getNotifications = async (): Promise<Notification[]> => {
    const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(notificationsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};


export async function completeSaleAndGenerateCommission(negotiation: Negotiation, finalizationNote?: string) {
    if (negotiation.stage === 'Venda Concluída' || negotiation.stage === 'Aluguel Ativo') {
        return { success: false, message: "Esta negociação já foi concluída." };
    }

    const batch = writeBatch(db);

    // 1. Atualiza a negociação
    const negRef = doc(db, 'negotiations', negotiation.id);
    const updatedNegotiationData = {
        stage: "Venda Concluída",
        contractStatus: "Assinado",
        completionDate: new Date().toISOString(),
        status: 'Finalizado',
        processStage: 'Finalizado',
        observations: finalizationNote || negotiation.observations || "Processo finalizado com sucesso.",
    };
    batch.update(negRef, updatedNegotiationData);

    // 2. Gera a comissão com detalhes aprimorados
    if (negotiation.type === 'Venda') {
        const commissionRate = 5; // Simulação de 5%
        const commissionValue = negotiation.value * (commissionRate / 100);
        
        const newCommissionData: Omit<Commission, 'id'> = {
            negotiationId: negotiation.id,
            propertyValue: negotiation.value,
            commissionValue: commissionValue,
            commissionRate: commissionRate,
            clientName: negotiation.client,
            realtorName: negotiation.realtor, // Captador
            salespersonName: negotiation.salesperson, // Vendedor
            paymentDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Pagar em 30 dias
            status: 'Pendente',
            notes: 'Comissão gerada automaticamente ao concluir a venda.'
        };
        const commissionRef = doc(collection(db, 'commissions'));
        batch.set(commissionRef, newCommissionData);
    }
    
    // 3. Atualiza o status do imóvel para "Vendido"
    if (negotiation.propertyId && negotiation.type === 'Venda') {
        const propertyRef = doc(db, 'properties', negotiation.propertyId);
        batch.update(propertyRef, { status: "Vendido" });
    }

    // 4. Atualiza a atividade no Kanban para "Concluído"
    const activityRef = doc(db, 'activities', negotiation.id);
    batch.update(activityRef, { status: "Concluído" });

    try {
        await batch.commit();
        
        // 5. Cria a notificação após o sucesso do commit
        await addNotification({
            title: "Venda Concluída!",
            description: `O imóvel '${negotiation.property}' foi vendido para ${negotiation.client}.`,
        });

        return { success: true, message: `A comissão para a venda de "${negotiation.property}" foi gerada no módulo Financeiro.` };
    } catch (error) {
        console.error("Erro ao completar a venda:", error);
        return { success: false, message: "Ocorreu um erro ao tentar finalizar a venda." };
    }
}


// --- Funções para o Kanban de Atividades ---

export const getActivitiesForRealtor = async (realtorName: string): Promise<Activity[]> => {
    // 1. Obter todas as atividades existentes para o corretor
    const activitiesQuery = query(collection(db, 'activities'), where('realtorName', '==', realtorName));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    const existingActivitiesMap = new Map(activitiesSnapshot.docs.map(doc => [doc.id, doc.data() as Activity]));

    const batch = writeBatch(db);
    let hasNewActivities = false;

    // 2. Verificar novas captações (properties)
    const propertiesQuery = query(collection(db, 'properties'), where('capturedBy', '==', realtorName));
    const propertiesSnapshot = await getDocs(propertiesQuery);
    propertiesSnapshot.forEach(propDoc => {
        if (!existingActivitiesMap.has(propDoc.id)) {
            const prop = propDoc.data() as Property;
            const newActivity: Activity = {
                id: propDoc.id,
                realtorName: prop.capturedBy,
                type: 'capture',
                name: prop.name,
                value: prop.price,
                status: 'Ativo',
                relatedId: propDoc.id,
            };
            const activityRef = doc(db, 'activities', propDoc.id);
            batch.set(activityRef, newActivity);
            existingActivitiesMap.set(propDoc.id, newActivity); // Adiciona ao mapa para retorno imediato
            hasNewActivities = true;
        }
    });

    // 3. Verificar novas negociações
    const negotiationsQuery = query(collection(db, 'negotiations'), where('salesperson', '==', realtorName));
    const negsSnapshot = await getDocs(negotiationsQuery);
    negsSnapshot.forEach(negDoc => {
        if (!existingActivitiesMap.has(negDoc.id)) {
            const neg = negDoc.data() as Negotiation;
            const newActivity: Activity = {
                id: negDoc.id,
                realtorName: neg.salesperson,
                type: 'negotiation',
                name: neg.property,
                value: neg.value,
                status: 'Ativo',
                relatedId: negDoc.id,
            };
            const activityRef = doc(db, 'activities', negDoc.id);
            batch.set(activityRef, newActivity);
            existingActivitiesMap.set(negDoc.id, newActivity);
            hasNewActivities = true;
        }
    });

    // 4. Se houver novas atividades, commita o batch
    if (hasNewActivities) {
        await batch.commit();
    }

    return Array.from(existingActivitiesMap.values());
};

export const updateActivityStatus = async (activityId: string, newStatus: ActivityStatus): Promise<void> => {
    const activityRef = doc(db, 'activities', activityId);
    await updateDoc(activityRef, { status: newStatus });
};
