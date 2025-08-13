

export type NegotiationStage = 'Proposta Enviada' | 'Em Negociação' | 'Contrato Gerado' | 'Venda Concluída' | 'Aluguel Ativo';
export type NegotiationType = 'Venda' | 'Aluguel' | 'Leilão';
export type ContractStatus = 'Não Gerado' | 'Pendente Assinaturas' | 'Assinado' | 'Cancelado';
export type PropertyType = 'Lançamento' | 'Revenda' | 'Terreno';

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
};

export type Property = { id: string; name: string; address: string; price: number; commission: number; };
export type Client = { id: string; name: string; doc: string; };

export type Commission = {
    id: string;
    deal: string;
    amount: number;
    status: 'Pago' | 'Pendente' | 'Vencido';
    paymentDate: string;
    involved: string;
    advance?: number;
    invoiceFile?: File | null;
    realtorId: string;
};

// --- NOVOS TIPOS PARA CORRESPONDENTE ---
export type FinancingStatus = 'Aprovado' | 'Reprovado' | 'Condicionado' | 'Bloqueado' | 'Pendente';
export type EngineeringStatus = 'Aprovado' | 'Reprovado' | 'Pendência' | 'Não solicitado';
export type ProcessStage = 'Análise de Crédito' | 'Engenharia' | 'Documentação' | 'Assinatura Formulários' | 'Conformidade' | 'Recursos para Financiar' | 'Assinatura Banco' | 'Cartório' | 'Garantia' | 'Finalizado';
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

export type ServiceRequestType = 'credit_approval' | 'engineering_report';

export type ServiceRequest = {
    id: string;
    type: ServiceRequestType;
    realtorName: string;
    clientInfo: string;
    propertyInfo: string;
    status: 'Pendente' | 'Em Análise' | 'Concluído';
    date: string;
};


export const realtors = ['Carlos Pereira', 'Sofia Lima', 'Joana Doe', 'Admin'];
export const propertyTypes: PropertyType[] = ['Lançamento', 'Revenda', 'Terreno'];
export const teams = [
    { id: 'team-a', name: 'Equipe A', members: ['Carlos Pereira', 'Sofia Lima'] },
    { id: 'team-b', name: 'Equipe B', members: ['Joana Doe', 'Admin'] },
];

export let initialNegotiations: Negotiation[] = [
    { id: 'neg1', property: 'Apartamento Vista Mar', propertyId: 'prop1', propertyType: 'Revenda', client: 'João Comprador', clientId: 'cli1', stage: 'Venda Concluída', type: 'Venda', value: 850000, salesperson: 'Carlos Pereira', realtor: 'Carlos Pereira', contractStatus: 'Assinado', completionDate: '2024-07-15T10:00:00Z', isFinanced: true },
    { id: 'neg2', property: 'Casa com Piscina', propertyId: 'prop2', propertyType: 'Revenda', client: 'Maria Investidora', clientId: 'cli2', stage: 'Em Negociação', type: 'Venda', value: 1200000, salesperson: 'Sofia Lima', realtor: 'Sofia Lima', contractStatus: 'Não Gerado', completionDate: null, isFinanced: false },
    { id: 'neg3', property: 'Terreno Comercial', propertyId: 'prop3', propertyType: 'Terreno', client: 'Construtora Build S.A.', clientId: 'cli3', stage: 'Contrato Gerado', type: 'Venda', value: 2500000, salesperson: 'Admin', realtor: 'Carlos Pereira', contractStatus: 'Pendente Assinaturas', completionDate: null, isFinanced: true },
    { id: 'neg4', property: 'Loft Moderno', propertyId: 'prop4', propertyType: 'Lançamento', client: 'Paulo Inquilino', clientId: 'cli4', stage: 'Aluguel Ativo', type: 'Aluguel', value: 2500, salesperson: 'Sofia Lima', realtor: 'Sofia Lima', contractStatus: 'Assinado', completionDate: '2024-08-01T10:00:00Z' },
    { id: 'neg5', property: 'Sítio Ecológico', propertyId: 'prop5', propertyType: 'Revenda', client: 'Família Verde', clientId: 'cli5', stage: 'Venda Concluída', type: 'Venda', value: 780000, salesperson: 'Joana Doe', realtor: 'Sofia Lima', contractStatus: 'Assinado', completionDate: '2024-08-05T10:00:00Z', isFinanced: false },
    { id: 'neg6', property: 'Apartamento Centro', propertyId: 'prop6', propertyType: 'Lançamento', client: 'Investidor Anônimo', clientId: 'cli6', stage: 'Venda Concluída', type: 'Venda', value: 450000, salesperson: 'Joana Doe', realtor: 'Joana Doe', contractStatus: 'Assinado', completionDate: '2024-06-20T10:00:00Z', isFinanced: true },
];

export const mockProperties: Property[] = [
    { id: 'prop1', name: 'Apartamento Vista Mar', address: 'Av. Beira Mar, 123', price: 900000, commission: 2.5 },
];

export const mockClients: Client[] = [
     { id: 'cli1', name: 'João Comprador', doc: '111.222.333-44' },
];


export let initialCommissions: Commission[] = [
    { id: 'comm1', deal: 'Venda Apartamento Central', amount: 15000, status: 'Pendente', paymentDate: '2024-08-15', involved: 'Carlos Pereira (50%), Sofia Lima (50%)', realtorId: 'Carlos Pereira' },
    { id: 'comm2', deal: 'Venda Casa de Campo', amount: 22000, status: 'Pago', paymentDate: '2024-07-20', involved: 'Carlos Pereira (100%)', realtorId: 'Carlos Pereira' },
    { id: 'comm3', deal: 'Aluguel Sala Comercial', amount: 1200, status: 'Vencido', paymentDate: '2024-06-10', involved: 'Imobiliária (100%)', realtorId: 'user2' },
];

// --- DADOS PARA CORRESPONDENTE ---
export let initialFinancingProcesses: FinancingProcess[] = [
    { 
        id: 'finproc1', negotiationId: 'neg1', clientName: 'João Comprador', propertyName: 'Apartamento Vista Mar', realtorName: 'Carlos Pereira',
        clientStatus: 'Aprovado', clientStatusReason: '', approvedValue: 700000,
        bacenInfo: 'Nenhuma restrição encontrada.',
        engineeringStatus: 'Aprovado', engineeringReason: '', appraisalValue: 850000, appraisalDate: '2024-07-10',
        docs: {
            propertyRegistration: { updated: true, dueDate: '2024-09-01' }, paycheck: { updated: true, dueDate: '2024-09-01' },
            addressProof: { updated: true, dueDate: '2024-09-01' }, clientApproval: { updated: true, dueDate: '2024-09-01' },
            engineeringReport: { updated: true, dueDate: '2024-09-01' },
        },
        stages: { formSignature: true, compliance: true, financingResources: true, bankSignature: '2024-07-15', registryEntry: '2024-07-20', warranty: '2024-07-25' },
        generalStatus: 'Concluído', hasPendency: false,
    },
    { 
        id: 'finproc2', negotiationId: 'neg3', clientName: 'Construtora Build S.A.', propertyName: 'Terreno Comercial', realtorName: 'Admin',
        clientStatus: 'Condicionado', clientStatusReason: 'Aprovação condicionada à apresentação de balanço atualizado.', approvedValue: 2000000,
        bacenInfo: 'Nenhuma restrição encontrada.',
        engineeringStatus: 'Pendência', engineeringReason: 'Falta ART do engenheiro responsável.', appraisalValue: 0, appraisalDate: '',
        docs: {
            propertyRegistration: { updated: true, dueDate: '2024-09-15' }, paycheck: { updated: false, dueDate: '2024-08-30' },
            addressProof: { updated: true, dueDate: '2024-09-15' }, clientApproval: { updated: false, dueDate: '2024-08-30' },
            engineeringReport: { updated: false, dueDate: '2024-09-01' },
        },
        stages: { formSignature: false, compliance: false, financingResources: false, bankSignature: '', registryEntry: '', warranty: '' },
        generalStatus: 'Ativo', hasPendency: true,
    }
];

export let initialServiceRequests: ServiceRequest[] = [
    { id: 'req1', type: 'credit_approval', realtorName: 'Sofia Lima', clientInfo: 'Maria Investidora - CPF 123.456.789-10', propertyInfo: 'N/A', status: 'Concluído', date: '2024-08-01' },
    { id: 'req2', type: 'engineering_report', realtorName: 'Joana Doe', clientInfo: 'N/A', propertyInfo: 'Loft Moderno - Rua Principal, Centro', status: 'Pendente', date: '2024-08-10' },
];

// Função para adicionar uma nova comissão (simulando a atualização do "banco de dados")
export function addCommission(newCommission: Commission) {
    if (!initialCommissions.some(c => c.id === newCommission.id)) {
        initialCommissions.unshift(newCommission);
    }
}

// Função para adicionar um novo processo de financiamento
export function addFinancingProcess(newProcess: FinancingProcess) {
    if (!initialFinancingProcesses.some(p => p.id === newProcess.id)) {
        initialFinancingProcesses.unshift(newProcess);
    }
}

// Função para adicionar uma nova solicitação de serviço
export function addServiceRequest(newRequest: ServiceRequest) {
    if (!initialServiceRequests.some(r => r.id === newRequest.id)) {
        initialServiceRequests.unshift(newRequest);
    }
}
