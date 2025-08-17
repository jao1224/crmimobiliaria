

// Tipos para os dados de CRM
export type Lead = {
    id: string;
    name: string;
    source: string;
    status: string;
    assignedTo: string;
};

export type Deal = {
    id: string;
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

export type AdminProcess = {
    id: string;
    status: ProcessStatus;
    stage: ProcessStage;
    negotiationType: string;
    category: string;
    property: string;
    salesperson: string; // Corretor Vendedor
    realtor: string;     // Corretor Captador
    team: string;
    observations?: string;
}


// export type Property = { id: string; name: string; address: string; price: number; commission: number; };
export type Client = { id: string; name: string; doc: string; };

export type Commission = {
    id: string;
    dealId: string; // ID da negociação para referência
    deal: string; // Descrição do negócio
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
    date: Date;
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


// Dados simulados para os imóveis
let propertiesData: Property[] = [
    { id: "prop1", name: "Apartamento Vista Mar", address: "Av. Beira Mar, 123, Fortaleza", status: "Disponível", price: 950000, commission: 2.5, imageUrl: "https://placehold.co/600x400.png", imageHint: "apartamento luxo", capturedBy: "Carlos Pereira", description: "Lindo apartamento com 3 quartos, 2 suítes, varanda gourmet com vista para o mar, cozinha moderna e 2 vagas de garagem. Condomínio com lazer completo.", ownerInfo: "Ana Vendedora - (85) 98877-6655", type: 'Revenda' },
    { id: "prop2", name: "Casa com Piscina", address: "Rua das Flores, 456, Eusébio", status: "Vendido", price: 1200000, commission: 3.0, imageUrl: "https://placehold.co/600x400.png", imageHint: "casa piscina", capturedBy: "Sofia Lima", description: "Espaçosa casa com 4 suítes, piscina, área gourmet com churrasqueira e um grande quintal gramado. Ideal para famílias que buscam conforto e lazer.", ownerInfo: "Bruno Costa - (85) 99988-7766", type: 'Revenda' },
    { id: "prop3", name: "Terreno Comercial", address: "Av. das Américas, 789, Fortaleza", status: "Disponível", price: 2500000, commission: 4.0, imageUrl: "https://placehold.co/600x400.png", imageHint: "terreno comercial", capturedBy: "Carlos Pereira", description: "Terreno plano de esquina em avenida movimentada, perfeito para construção de lojas, galpões ou centros comerciais. Excelente visibilidade e acesso.", ownerInfo: "Construtora Invest S.A. - (85) 3222-1100", type: 'Terreno' },
    { id: "prop4", name: "Loft Moderno", address: "Centro, Rua Principal, 100, Fortaleza", status: "Alugado", price: 450000, commission: 1.5, imageUrl: "https://placehold.co/600x400.png", imageHint: "loft moderno", capturedBy: "Joana Doe", description: "Loft no coração da cidade, com design industrial, pé-direito duplo, 1 quarto, cozinha integrada e totalmente mobiliado. Perfeito para solteiros ou casais.", ownerInfo: "Maria Investidora - (85) 98765-4321", type: 'Lançamento' },
    { id: "prop5", name: "Sítio Ecológico", address: "Guaramiranga, CE", status: "Disponível", price: 780000, commission: 3.5, imageUrl: "https://placehold.co/600x400.png", imageHint: "sitio ecologico", capturedBy: "Sofia Lima", description: "Belo sítio em meio à natureza, com casa principal, casa de hóspedes, pomar e acesso a uma cachoeira. Ideal para quem busca paz e tranquilidade.", ownerInfo: "Família Verde - (85) 91122-3344", type: 'Casa' },
    { id: "prop6", name: "Apartamento Centro", address: "Rua do Centro, 50, Fortaleza", status: "Disponível", price: 450000, commission: 2.0, imageUrl: "https://placehold.co/600x400.png", imageHint: "apartamento centro", capturedBy: "Joana Doe", description: "Apartamento de 2 quartos no centro da cidade, próximo a tudo. Recém-reformado, com móveis planejados na cozinha.", ownerInfo: "Investidor Anônimo - (85) 95544-3322", type: 'Apartamento' },
];


export const realtors = ['Carlos Pereira', 'Sofia Lima', 'Joana Doe', 'Admin'];
export const propertyTypes: PropertyType[] = ['Lançamento', 'Revenda', 'Terreno', 'Casa', 'Apartamento'];
export const teams = [
    { id: 'team-a', name: 'Equipe A', members: ['Carlos Pereira', 'Sofia Lima'] },
    { id: 'team-b', name: 'Equipe B', members: ['Joana Doe', 'Admin'] },
];

let negotiationsData: Negotiation[] = [
    { id: 'neg1', property: 'Apartamento Vista Mar', propertyId: 'prop1', propertyType: 'Apartamento', client: 'João Comprador', clientId: 'cli1', stage: 'Venda Concluída', type: 'Venda', value: 850000, salesperson: 'Carlos Pereira', realtor: 'Carlos Pereira', contractStatus: 'Assinado', completionDate: '2024-07-15T10:00:00Z', isFinanced: true, status: 'Finalizado', processStage: 'Finalizado', negotiationType: 'Repasse', category: 'Usado', team: 'Equipe A' },
    { id: 'neg2', property: 'Casa com Piscina', propertyId: 'prop2', propertyType: 'Casa', client: 'Maria Investidora', clientId: 'cli2', stage: 'Em Negociação', type: 'Venda', value: 1200000, salesperson: 'Sofia Lima', realtor: 'Sofia Lima', contractStatus: 'Não Gerado', completionDate: null, isFinanced: false, status: 'Ativo', processStage: 'Em andamento', negotiationType: 'Novo', category: 'Usado', team: 'Equipe A', observations: 'Aguardando contra-proposta do cliente.' },
    { id: 'neg3', property: 'Terreno Comercial', propertyId: 'prop3', propertyType: 'Terreno', client: 'Construtora Build S.A.', clientId: 'cli3', stage: 'Contrato Gerado', type: 'Venda', value: 2500000, salesperson: 'Admin', realtor: 'Carlos Pereira', contractStatus: 'Pendente Assinaturas', completionDate: null, isFinanced: true, status: 'Ativo', processStage: 'Pendência', negotiationType: 'Lote', category: 'Novo', team: 'Equipe A', observations: 'Pendente assinatura do contrato pelo vendedor.' },
    { id: 'neg4', property: 'Loft Moderno', propertyId: 'prop4', propertyType: 'Apartamento', client: 'Paulo Inquilino', clientId: 'cli4', stage: 'Aluguel Ativo', type: 'Aluguel', value: 2500, salesperson: 'Sofia Lima', realtor: 'Sofia Lima', contractStatus: 'Assinado', completionDate: '2024-08-01T10:00:00Z', status: 'Finalizado', processStage: 'Finalizado', negotiationType: 'Novo', category: 'Novo', team: 'Equipe A' },
    { id: 'neg5', property: 'Sítio Ecológico', propertyId: 'prop5', propertyType: 'Casa', client: 'Família Verde', clientId: 'cli5', stage: 'Venda Concluída', type: 'Venda', value: 780000, salesperson: 'Joana Doe', realtor: 'Sofia Lima', contractStatus: 'Assinado', completionDate: '2024-08-05T10:00:00Z', isFinanced: false, status: 'Finalizado', processStage: 'Finalizado', negotiationType: 'Novo', category: 'Usado', team: 'Equipe B' },
    { id: 'neg6', property: 'Apartamento Centro', propertyId: 'prop6', propertyType: 'Apartamento', client: 'Investidor Anônimo', clientId: 'cli6', stage: 'Venda Concluída', type: 'Venda', value: 450000, salesperson: 'Joana Doe', realtor: 'Joana Doe', contractStatus: 'Assinado', completionDate: '2024-06-20T10:00:00Z', isFinanced: true, status: 'Cancelado', processStage: 'Finalizado', negotiationType: 'Crédito Associativo', category: 'Novo', team: 'Equipe B', observations: 'Venda cancelada por desistência do comprador.' },
];

export const mockProperties: Property[] = [
    { id: 'prop1', name: 'Apartamento Vista Mar', address: 'Av. Beira Mar, 123', price: 900000, commission: 2.5, type: 'Apartamento', capturedBy: 'Carlos Pereira', imageUrl: '', imageHint: '' },
];

export const mockClients: Client[] = [
     { id: 'cli1', name: 'João Comprador', doc: '111.222.333-44' },
];

// Dados derivados para a nova tabela de Processos Admin
export let initialAdminProcesses: AdminProcess[] = negotiationsData.map(neg => ({
    id: neg.id,
    status: neg.status,
    stage: neg.processStage,
    negotiationType: neg.negotiationType,
    category: neg.category,
    property: neg.property,
    salesperson: neg.salesperson,
    realtor: neg.realtor,
    team: neg.team,
    observations: neg.observations,
}));


let commissionsData: Commission[] = [
    { id: 'comm1', dealId: 'neg1', deal: 'Venda Apartamento Central', amount: 15000, status: 'Pendente', paymentDate: '2024-08-15', involved: 'Carlos Pereira (50%), Sofia Lima (50%)', realtorId: 'Carlos Pereira' },
    { id: 'comm2', dealId: 'neg5', deal: 'Venda Casa de Campo', amount: 22000, status: 'Pago', paymentDate: '2024-07-20', involved: 'Carlos Pereira (100%)', realtorId: 'Carlos Pereira' },
    { id: 'comm3', dealId: 'neg4', deal: 'Aluguel Sala Comercial', amount: 1200, status: 'Vencido', paymentDate: '2024-06-10', involved: 'Imobiliária (100%)', realtorId: 'user2' },
];

// --- DADOS PARA CORRESPONDENTE ---
let financingProcessesData: FinancingProcess[] = [
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

let serviceRequestsData: ServiceRequest[] = [
    { id: 'req1', type: 'credit_approval', realtorName: 'Sofia Lima', clientInfo: 'Maria Investidora - CPF 123.456.789-10', propertyInfo: '', status: 'Concluído', date: '2024-08-01' },
    { id: 'req2', type: 'engineering_report', realtorName: 'Joana Doe', clientInfo: '', propertyInfo: 'Loft Moderno - Rua Principal, Centro', status: 'Pendente', date: '2024-08-10' },
];

let eventsData: Event[] = [
    { id: 'evt1', date: new Date(), title: 'Reunião com João Comprador', type: 'personal', time: '10:00', description: 'Discutir proposta do Apto Vista Mar.' },
    { id: 'evt2', date: new Date(), title: 'Visita ao Terreno Comercial', type: 'team_visit', time: '14:30', description: 'Visita com a equipe de vendas e a Construtora Build S.A.' },
    { id: 'evt3', date: new Date(new Date().setDate(new Date().getDate() + 2)), title: 'Feriado Municipal', type: 'company', time: 'Dia todo', description: 'A imobiliária estará fechada.' },
    { id: 'evt4', date: new Date(new Date().setDate(new Date().getDate() + 5)), title: 'Entrega das Chaves - Apto 701', type: 'team_visit', time: '09:00', description: 'Cliente Maria feliz.' },
];

let paymentsData: PaymentCLT[] = [
    { id: 'pay1', employee: 'Secretária Admin', type: 'Salário', amount: 2500, paymentDate: '2024-08-05', status: 'Pago' },
    { id: 'pay2', employee: 'Gerente de Vendas', type: 'Salário', amount: 6000, paymentDate: '2024-08-05', status: 'Pago' },
];

let expensesData: Expense[] = [
    { id: 'exp1', description: 'Aluguel do Escritório', category: 'Fixa', amount: 3500, dueDate: '2024-08-10', status: 'Pendente' },
    { id: 'exp2', description: 'Marketing Digital (Google Ads)', category: 'Variável', amount: 1200, dueDate: '2024-08-15', status: 'Pago' },
    { id: 'exp3', description: 'Conta de Energia', category: 'Fixa', amount: 450, dueDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], status: 'Pendente' }, // Vencida
];

// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS ---

// No modo simulado, a função `getProperties` simplesmente retorna os dados locais.
// Quando conectado ao Firestore, esta função se tornará assíncrona.
export const getProperties = () => {
    return propertiesData;
};

export const addProperty = (newProperty: Property) => {
    if (!propertiesData.some(p => p.id === newProperty.id)) {
        propertiesData.unshift(newProperty);
    }
};

export const getNegotiations = () => [...negotiationsData];
export const addNegotiation = (newNegotiation: Negotiation) => {
    if (!negotiationsData.some(n => n.id === newNegotiation.id)) {
        negotiationsData.unshift(newNegotiation);
    }
};

export const getCommissions = () => [...commissionsData];
export const addCommission = (newCommission: Commission) => {
    if (!commissionsData.some(c => c.id === newCommission.id)) {
        commissionsData.unshift(newCommission);
    }
};

export const getPayments = () => [...paymentsData];
export const addPayment = (newPayment: PaymentCLT) => {
    if (!paymentsData.some(p => p.id === newPayment.id)) {
        paymentsData.unshift(newPayment);
    }
};

export const getExpenses = () => [...expensesData];
export const addExpense = (newExpense: Expense) => {
    if (!expensesData.some(e => e.id === newExpense.id)) {
        expensesData.unshift(newExpense);
    }
};

export const getServiceRequests = () => [...serviceRequestsData];
export const addServiceRequest = (newRequest: ServiceRequest) => {
    if (!serviceRequestsData.some(r => r.id === newRequest.id)) {
        serviceRequestsData.unshift(newRequest);
    }
};

export const getFinancingProcesses = () => [...financingProcessesData];

export const getEvents = () => [...eventsData];
export const addEvent = (newEvent: Event) => {
    if (!eventsData.some(e => e.id === newEvent.id)) {
        eventsData.unshift(newEvent);
    }
};

// Função para adicionar um novo processo de financiamento
export function addFinancingProcess(newProcess: FinancingProcess) {
    if (!financingProcessesData.some(p => p.id === newProcess.id)) {
        financingProcessesData.unshift(newProcess);
    }
}

/**
 * Centralized function to complete a sale, update negotiation status, and generate commission.
 * @param negotiationId The ID of the negotiation to complete.
 * @param finalizationNote Optional note from the finalization process.
 * @returns An object with success status and a message.
 */
export function completeSaleAndGenerateCommission(negotiationId: string, finalizationNote?: string) {
    const negIndex = negotiationsData.findIndex(n => n.id === negotiationId);

    if (negIndex === -1) {
        return { success: false, message: "Negociação não encontrada." };
    }

    const neg = negotiationsData[negIndex];

    if (neg.stage === 'Venda Concluída' || neg.stage === 'Aluguel Ativo') {
        return { success: false, message: "Esta negociação já foi concluída." };
    }

    // Atualiza a negociação
    negotiationsData[negIndex] = {
        ...neg,
        stage: "Venda Concluída",
        contractStatus: "Assinado",
        completionDate: new Date().toISOString(),
        status: 'Finalizado',
        processStage: 'Finalizado',
        observations: finalizationNote || neg.observations,
    };

    // Simula a geração automática de comissão (se for uma venda)
    if(neg.type === 'Venda') {
        const commissionAmount = neg.value * 0.05; // Simulação de 5%
        const newCommission: Commission = {
            id: `comm-from-${neg.id}`,
            dealId: neg.id,
            deal: `Venda ${neg.property}`,
            amount: commissionAmount,
            status: 'Pendente',
            paymentDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Pagar em 30 dias
            involved: `${neg.salesperson} (Vendedor), ${neg.realtor} (Captador)`,
            realtorId: neg.salesperson, // Simulação para permissão de visualização
        };
        addCommission(newCommission);
    }

    // Atualiza o processo administrativo correspondente
    const processIndex = initialAdminProcesses.findIndex(p => p.id === negotiationId);
    if(processIndex !== -1) {
        initialAdminProcesses[processIndex] = {
            ...initialAdminProcesses[processIndex],
            status: 'Finalizado',
            stage: 'Finalizado',
            observations: finalizationNote || neg.observations,
        }
    }
    
    return { success: true, message: `A comissão para a venda de "${neg.property}" foi gerada no módulo Financeiro.` };
}
