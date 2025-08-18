
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


// --- Dados simulados (para referência e fallback) ---
export const realtors = ['Carlos Pereira', 'Sofia Lima', 'Joana Doe', 'Admin'];
export const propertyTypes: PropertyType[] = ['Lançamento', 'Revenda', 'Terreno', 'Casa', 'Apartamento'];
export const teams = [
    { id: 'team-a', name: 'Equipe A', members: ['Carlos Pereira', 'Sofia Lima'] },
    { id: 'team-b', name: 'Equipe B', members: ['Joana Doe', 'Admin'] },
];

let mockProperties: Property[] = [
    { id: 'prop1', name: 'Apartamento Vista Mar', address: 'Av. Beira Mar, 123, Fortaleza', status: 'Disponível', price: 950000, type: 'Apartamento', commission: 5, imageUrl: 'https://placehold.co/600x400.png', imageHint: "apartamento moderno", capturedBy: 'Carlos Pereira' },
    { id: 'prop2', name: 'Casa com Piscina', address: 'Rua das Flores, 45, Eusébio', status: 'Vendido', price: 1200000, type: 'Casa', commission: 5, imageUrl: 'https://placehold.co/600x400.png', imageHint: "casa piscina", capturedBy: 'Sofia Lima' },
];
let mockNegotiations: Negotiation[] = [
    { id: 'neg1', property: 'Apartamento Vista Mar', propertyId: 'prop1', propertyType: 'Apartamento', client: 'João Cliente', clientId: 'client1', stage: 'Proposta Enviada', type: 'Venda', value: 950000, salesperson: 'Carlos Pereira', realtor: 'Carlos Pereira', contractStatus: 'Não Gerado', completionDate: null, isFinanced: true, status: 'Ativo', processStage: 'Em andamento', negotiationType: 'Novo', category: 'Novo', team: 'Equipe A' },
    { id: 'neg2', property: 'Casa com Piscina', propertyId: 'prop2', propertyType: 'Casa', client: 'Maria Cliente', clientId: 'client2', stage: 'Venda Concluída', type: 'Venda', value: 1200000, salesperson: 'Sofia Lima', realtor: 'Sofia Lima', contractStatus: 'Assinado', completionDate: '2024-05-10T10:00:00Z', isFinanced: false, status: 'Finalizado', processStage: 'Finalizado', negotiationType: 'Revenda', category: 'Revenda', team: 'Equipe A' },
];
let mockCommissions: Commission[] = [];
let mockPayments: PaymentCLT[] = [];
let mockExpenses: Expense[] = [];
let mockFinancingProcesses: FinancingProcess[] = [];
let mockServiceRequests: ServiceRequest[] = [];
let mockEvents: Event[] = [];
let mockNotifications: Notification[] = [];
let mockActivities: Activity[] = [];

// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (SIMULADO) ---

const generateId = () => Math.random().toString(36).substr(2, 9);

export const getProperties = async (): Promise<Property[]> => {
    return Promise.resolve(mockProperties);
};

export const getPropertiesByRealtor = async (realtorName: string): Promise<Property[]> => {
    return Promise.resolve(mockProperties.filter(p => p.capturedBy === realtorName));
};

export const addProperty = async (newProperty: Omit<Property, 'id'>): Promise<string> => {
    const id = generateId();
    mockProperties.push({ id, ...newProperty });
    return Promise.resolve(id);
};

export const updateProperty = async (id: string, data: Partial<Property>): Promise<void> => {
    mockProperties = mockProperties.map(p => p.id === id ? { ...p, ...data } : p);
    return Promise.resolve();
};

export const deleteProperty = async (id: string): Promise<void> => {
    mockProperties = mockProperties.filter(p => p.id !== id);
    return Promise.resolve();
};

export const getNegotiations = async (): Promise<Negotiation[]> => {
    return Promise.resolve(mockNegotiations);
};

export const getNegotiationsByRealtor = async (realtorName: string): Promise<Negotiation[]> => {
    return Promise.resolve(mockNegotiations.filter(n => n.salesperson === realtorName));
};

export const addNegotiation = async (newNegotiation: Omit<Negotiation, 'id'>): Promise<string> => {
    const id = generateId();
    mockNegotiations.push({ id, ...newNegotiation });
    return Promise.resolve(id);
};

export const updateNegotiation = async (id: string, data: Partial<Negotiation>): Promise<void> => {
    mockNegotiations = mockNegotiations.map(n => n.id === id ? { ...n, ...data } : n);
    return Promise.resolve();
};

export const getCommissions = async (): Promise<Commission[]> => {
    return Promise.resolve(mockCommissions);
};

export const addCommission = async (newCommission: Omit<Commission, 'id'>): Promise<string> => {
    const id = generateId();
    mockCommissions.push({ id, ...newCommission });
    return Promise.resolve(id);
};

export const getPayments = async (): Promise<PaymentCLT[]> => {
    return Promise.resolve(mockPayments);
};

export const addPayment = async (newPayment: Omit<PaymentCLT, 'id'>): Promise<string> => {
    const id = generateId();
    mockPayments.push({ id, ...newPayment });
    return Promise.resolve(id);
};

export const getExpenses = async (): Promise<Expense[]> => {
    return Promise.resolve(mockExpenses);
};

export const addExpense = async (newExpense: Omit<Expense, 'id'>): Promise<string> => {
    const id = generateId();
    mockExpenses.push({ id, ...newExpense });
    return Promise.resolve(id);
};

export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
    return Promise.resolve(mockServiceRequests);
};

export const addServiceRequest = async (newRequest: Omit<ServiceRequest, 'id'>): Promise<string> => {
    const id = generateId();
    mockServiceRequests.push({ id, ...newRequest });
    return Promise.resolve(id);
};

export const getFinancingProcesses = async (): Promise<FinancingProcess[]> => {
    return Promise.resolve(mockFinancingProcesses);
};

export const addFinancingProcess = async (newProcess: Omit<FinancingProcess, 'id'>): Promise<string> => {
    const id = generateId();
    mockFinancingProcesses.push({ id, ...newProcess });
    return Promise.resolve(id);
};

export const updateFinancingProcess = async (id: string, data: Partial<FinancingProcess>): Promise<void> => {
    mockFinancingProcesses = mockFinancingProcesses.map(p => p.id === id ? { ...p, ...data } : p);
    return Promise.resolve();
};

export const getEvents = async (): Promise<Event[]> => {
    return Promise.resolve(mockEvents);
};

export const addEvent = async (newEvent: Omit<Event, 'id'>): Promise<string> => {
    const id = generateId();
    mockEvents.push({ id, ...newEvent });
    return Promise.resolve(id);
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> => {
    const id = generateId();
    mockNotifications.unshift({
        id,
        ...notification,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        read: false,
    });
    mockNotifications = mockNotifications.slice(0, 10);
    return Promise.resolve(id);
};

export const getNotifications = async (): Promise<Notification[]> => {
    return Promise.resolve(mockNotifications);
};

export async function completeSaleAndGenerateCommission(negotiation: Negotiation, finalizationNote?: string) {
    if (negotiation.stage === 'Venda Concluída' || negotiation.stage === 'Aluguel Ativo') {
        return { success: false, message: "Esta negociação já foi concluída." };
    }

    // 1. Atualiza a negociação
    const updatedNegotiationData = {
        stage: "Venda Concluída" as const,
        contractStatus: "Assinado" as const,
        completionDate: new Date().toISOString(),
        status: 'Finalizado' as const,
        processStage: 'Finalizado' as const,
        observations: finalizationNote || negotiation.observations || "Processo finalizado com sucesso.",
    };
    mockNegotiations = mockNegotiations.map(n => n.id === negotiation.id ? { ...n, ...updatedNegotiationData } : n);

    // 2. Gera a comissão
    if (negotiation.type === 'Venda') {
        const commissionRate = 5;
        const commissionValue = negotiation.value * (commissionRate / 100);
        const newCommissionData: Commission = {
            id: generateId(),
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
        mockCommissions.push(newCommissionData);
    }
    
    // 3. Atualiza o status do imóvel
    if (negotiation.propertyId && negotiation.type === 'Venda') {
        mockProperties = mockProperties.map(p => p.id === negotiation.propertyId ? { ...p, status: 'Vendido' } : p);
    }
    
    // 4. Atualiza a atividade no Kanban para "Concluído"
    mockActivities = mockActivities.map(a => a.id === negotiation.id ? { ...a, status: 'Concluído' } : a);
    
    // 5. Cria a notificação
    await addNotification({
        title: "Venda Concluída!",
        description: `O imóvel '${negotiation.property}' foi vendido para ${negotiation.client}.`,
    });

    return { success: true, message: `A comissão para a venda de "${negotiation.property}" foi gerada no módulo Financeiro.` };
}

export const getActivitiesForRealtor = async (realtorName: string): Promise<Activity[]> => {
    const existingActivityIds = new Set(mockActivities.map(a => a.id));

    const newCaptures = mockProperties
        .filter(p => p.capturedBy === realtorName && !existingActivityIds.has(p.id))
        .map(p => ({
            id: p.id,
            realtorName: p.capturedBy,
            type: 'capture' as const,
            name: p.name,
            value: p.price,
            status: 'Ativo' as const,
            relatedId: p.id,
        }));
        
    const newNegotiations = mockNegotiations
        .filter(n => n.salesperson === realtorName && !existingActivityIds.has(n.id))
        .map(n => ({
            id: n.id,
            realtorName: n.salesperson,
            type: 'negotiation' as const,
            name: n.property,
            value: n.value,
            status: 'Ativo' as const,
            relatedId: n.id,
        }));

    mockActivities.push(...newCaptures, ...newNegotiations);
    
    return Promise.resolve(mockActivities.filter(a => a.realtorName === realtorName));
};

export const updateActivityStatus = async (activityId: string, newStatus: ActivityStatus): Promise<void> => {
    mockActivities = mockActivities.map(a => a.id === activityId ? { ...a, status: newStatus } : a);
    return Promise.resolve();
};
