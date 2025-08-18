
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, limit, where, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

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


// --- Dados estáticos ---
export const realtors = ['Carlos Pereira', 'Sofia Lima', 'Joana Doe', 'Admin'];
export const propertyTypes: PropertyType[] = ['Lançamento', 'Revenda', 'Terreno', 'Casa', 'Apartamento'];
export const teams = [
    { id: 'team-a', name: 'Equipe A', members: ['Carlos Pereira', 'Sofia Lima'] },
    { id: 'team-b', name: 'Equipe B', members: ['Joana Doe', 'Admin'] },
];

// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (FIRESTORE) ---

export const getProperties = async (): Promise<Property[]> => {
    const snapshot = await getDocs(collection(db, 'properties'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const getPropertiesByRealtor = async (realtorName: string): Promise<Property[]> => {
    const q = query(collection(db, 'properties'), where('capturedBy', '==', realtorName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const addProperty = async (newProperty: Omit<Property, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'properties'), newProperty);
    return docRef.id;
};

export const updateProperty = async (id: string, data: Partial<Property>): Promise<void> => {
    await updateDoc(doc(db, 'properties', id), data);
};

export const deleteProperty = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'properties', id));
};

export const getNegotiations = async (): Promise<Negotiation[]> => {
    const snapshot = await getDocs(collection(db, 'negotiations'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
};

export const getNegotiationsByRealtor = async (realtorName: string): Promise<Negotiation[]> => {
    const q = query(collection(db, 'negotiations'), where('salesperson', '==', realtorName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
};

export const addNegotiation = async (newNegotiation: Omit<Negotiation, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'negotiations'), newNegotiation);
    return docRef.id;
};

export const updateNegotiation = async (id: string, data: Partial<Negotiation>): Promise<void> => {
    await updateDoc(doc(db, 'negotiations', id), data);
};

export const getCommissions = async (): Promise<Commission[]> => {
    const snapshot = await getDocs(collection(db, 'commissions'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
};

export const addCommission = async (newCommission: Omit<Commission, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'commissions'), newCommission);
    return docRef.id;
};

export const getPayments = async (): Promise<PaymentCLT[]> => {
    const snapshot = await getDocs(collection(db, 'payments'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentCLT));
};

export const addPayment = async (newPayment: Omit<PaymentCLT, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'payments'), newPayment);
    return docRef.id;
};

export const getExpenses = async (): Promise<Expense[]> => {
    const snapshot = await getDocs(collection(db, 'expenses'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
};

export const addExpense = async (newExpense: Omit<Expense, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'expenses'), newExpense);
    return docRef.id;
};

export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
    const snapshot = await getDocs(collection(db, 'serviceRequests'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
};

export const addServiceRequest = async (newRequest: Omit<ServiceRequest, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'serviceRequests'), newRequest);
    return docRef.id;
};

export const getFinancingProcesses = async (): Promise<FinancingProcess[]> => {
    const snapshot = await getDocs(collection(db, 'financingProcesses'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancingProcess));
};

export const addFinancingProcess = async (newProcess: Omit<FinancingProcess, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'financingProcesses'), newProcess);
    return docRef.id;
};

export const updateFinancingProcess = async (id: string, data: Partial<FinancingProcess>): Promise<void> => {
    await updateDoc(doc(db, 'financingProcesses', id), data);
};

export const getEvents = async (): Promise<Event[]> => {
    const snapshot = await getDocs(collection(db, 'events'));
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: data.date.toDate(), // Converte Timestamp para Date
        } as Event;
    });
};

export const addEvent = async (newEvent: Omit<Event, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'events'), newEvent);
    return docRef.id;
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
        read: false,
    });
    return docRef.id;
};

export const getNotifications = async (): Promise<Notification[]> => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

export async function completeSaleAndGenerateCommission(negotiation: Negotiation, finalizationNote?: string) {
    if (negotiation.stage === 'Venda Concluída' || negotiation.stage === 'Aluguel Ativo') {
        return { success: false, message: "Esta negociação já foi concluída." };
    }
    
    const batch = writeBatch(db);

    // 1. Atualiza a negociação
    const negotiationRef = doc(db, 'negotiations', negotiation.id);
    const updatedNegotiationData = {
        stage: "Venda Concluída" as const,
        contractStatus: "Assinado" as const,
        completionDate: new Date().toISOString(),
        status: 'Finalizado' as const,
        processStage: 'Finalizado' as const,
        observations: finalizationNote || negotiation.observations || "Processo finalizado com sucesso.",
    };
    batch.update(negotiationRef, updatedNegotiationData);

    // 2. Gera a comissão se for uma venda
    if (negotiation.type === 'Venda') {
        const commissionRate = 5;
        const commissionValue = negotiation.value * (commissionRate / 100);
        const newCommissionRef = doc(collection(db, 'commissions'));
        const newCommissionData: Omit<Commission, 'id'> = {
            negotiationId: negotiation.id,
            propertyValue: negotiation.value,
            commissionValue: commissionValue,
            commissionRate: commissionRate,
            clientName: negotiation.client,
            realtorName: negotiation.realtor,
            salespersonName: negotiation.salesperson,
            paymentDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            status: 'Pendente',
            notes: 'Comissão gerada automaticamente ao concluir a venda.'
        };
        batch.set(newCommissionRef, newCommissionData);
    }
    
    // 3. Atualiza o status do imóvel se for uma venda
    if (negotiation.propertyId && negotiation.type === 'Venda') {
        const propertyRef = doc(db, 'properties', negotiation.propertyId);
        batch.update(propertyRef, { status: 'Vendido' });
    }
    
     // 4. Atualiza a atividade no Kanban para "Concluído"
    const activityRef = doc(db, 'activities', negotiation.id);
    batch.update(activityRef, { status: 'Concluído' });
    
    // 5. Cria a notificação
    await addNotification({
        title: "Venda Concluída!",
        description: `O imóvel '${negotiation.property}' foi vendido para ${negotiation.client}.`,
    });
    
    // 6. Executa todas as operações em lote
    await batch.commit();

    return { success: true, message: `A comissão para a venda de "${negotiation.property}" foi gerada no módulo Financeiro.` };
}

export const getActivitiesForRealtor = async (realtorName: string): Promise<Activity[]> => {
    // Busca todas as atividades existentes para esse corretor
    const activitiesQuery = query(collection(db, 'activities'), where('realtorName', '==', realtorName));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    const existingActivities = activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
    const existingActivityIds = new Set(existingActivities.map(a => a.relatedId));

    // Busca captações que ainda não viraram atividades
    const capturesQuery = query(collection(db, 'properties'), where('capturedBy', '==', realtorName));
    const capturesSnapshot = await getDocs(capturesQuery);
    const newCaptures = capturesSnapshot.docs.filter(doc => !existingActivityIds.has(doc.id));

    // Busca negociações que ainda não viraram atividades
    const negotiationsQuery = query(collection(db, 'negotiations'), where('salesperson', '==', realtorName));
    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    const newNegotiations = negotiationsSnapshot.docs.filter(doc => !existingActivityIds.has(doc.id));

    // Cria as novas atividades em lote
    const batch = writeBatch(db);
    const createdActivities: Activity[] = [];

    newCaptures.forEach(doc => {
        const prop = { id: doc.id, ...doc.data() } as Property;
        const newActivity: Omit<Activity, 'id'> = {
            realtorName: prop.capturedBy,
            type: 'capture',
            name: prop.name,
            value: prop.price,
            status: 'Ativo',
            relatedId: prop.id,
        };
        const activityRef = doc(db, 'activities', prop.id); // Usa o mesmo ID do imóvel
        batch.set(activityRef, newActivity);
        createdActivities.push({ id: activityRef.id, ...newActivity });
    });

    newNegotiations.forEach(doc => {
        const neg = { id: doc.id, ...doc.data() } as Negotiation;
        const newActivity: Omit<Activity, 'id'> = {
            realtorName: neg.salesperson,
            type: 'negotiation',
            name: neg.property,
            value: neg.value,
            status: 'Ativo',
            relatedId: neg.id,
        };
        const activityRef = doc(db, 'activities', neg.id); // Usa o mesmo ID da negociação
        batch.set(activityRef, newActivity);
        createdActivities.push({ id: activityRef.id, ...newActivity });
    });

    if (newCaptures.length > 0 || newNegotiations.length > 0) {
        await batch.commit();
    }

    return [...existingActivities, ...createdActivities];
};

export const updateActivityStatus = async (activityId: string, newStatus: ActivityStatus): Promise<void> => {
    const activityRef = doc(db, "activities", activityId);
    await updateDoc(activityRef, { status: newStatus });
};

