

import { db, storage } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, limit, where, getDoc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  displayCode: string;
  name: string;
  address: string;
  status: string;
  price: number;
  type: PropertyType;
  commission: number; // Armazenado como taxa percentual, ex: 2.5
  imageUrl: string;
  imageHint: string;
  capturedBy: string; // Nome do corretor que captou
  capturedById: string; // ID do corretor que captou
  description?: string;
  ownerInfo?: string; // Pode conter múltiplos proprietários, separados por nova linha
  team?: string; 
};


export type Negotiation = {
    id: string;
    property: string;
    propertyId: string;
    propertyDisplayCode: string;
    propertyType: PropertyType;
    client: string;
    clientId: string;
    stage: NegotiationStage;
    type: NegotiationType;
    value: number;
    salesperson: string;
    salespersonId: string;
    realtor: string;
    realtorId: string;
    contractStatus: ContractStatus;
    completionDate: string | null;
    createdAt: string;
    isFinanced?: boolean;
    processoId?: string; // Link para o processo
    contratoId?: string; // Link para o contrato
    isArchived?: boolean;
    isDeleted?: boolean;
};

// --- TIPOS PARA GESTÃO DE PROCESSOS ---
export type ProcessStatus = 'Ativo' | 'Suspenso' | 'Cancelado' | 'Finalizado';
export type ProcessStage = 'Em andamento' | 'Pendência' | 'Finalizado';

export type Processo = {
    id: string;
    negotiationId: string;
    propertyDisplayCode: string;
    propertyName: string;
    clientName: string;
    salespersonName: string;
    realtorName: string;
    team: string;
    status: ProcessStatus;
    stage: ProcessStage;
    observations?: string;
};

// --- TIPO PARA CONTRATO ---
export type Party = { name: string; doc: string; address: string; };

export type ContractDetails = {
    sellers: Party[];
    buyers: Party[];
    propertyArea: string;
    propertyRegistration: string;
    propertyRegistryOffice: string;
    paymentTerms: string;
    commissionClause: string;
    generalClauses: string;
    additionalClauses: string;
    city: string;
    date: string;
};

export type Contrato = {
    id: string;
    negotiationId: string;
    details: ContractDetails;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
};



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
    id: string; // ID da atividade, que será o mesmo do relatedId
    realtorName: string;
    type: 'capture' | 'negotiation';
    name: string; // Nome do imóvel ou negociação
    value: number;
    status: ActivityStatus;
    relatedId: string; // ID original do Firestore (propriedade ou negociação)
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};


// --- Dados estáticos ---
export const propertyTypes: PropertyType[] = ['Lançamento', 'Revenda', 'Terreno', 'Casa', 'Apartamento'];

// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (FIRESTORE) ---

export const getUsers = async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getProperties = async (): Promise<Property[]> => {
    const snapshot = await getDocs(collection(db, 'imoveis'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const getPropertiesByRealtor = async (realtorName: string): Promise<Property[]> => {
    const q = query(collection(db, 'imoveis'), where('capturedBy', '==', realtorName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const addProperty = async (newPropertyData: Omit<Property, 'id' | 'displayCode'>, file?: File | null): Promise<string> => {
    const propertyCollection = collection(db, 'imoveis');
    
    let newImageUrl = "https://placehold.co/600x400.png";
    if (file) {
        const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        newImageUrl = await getDownloadURL(storageRef);
    }
    
    console.log("Objeto completo a ser salvo:", newPropertyData);

    let newId = '';
    await runTransaction(db, async (transaction) => {
        // Obter o último número do contador de imóveis
        let nextNumber = 1001; // Começa em 1001
        
        const propertiesSnapshot = await getDocs(query(propertyCollection, orderBy('displayCode', 'desc'), limit(1)));
        if (!propertiesSnapshot.empty) {
            const lastProperty = propertiesSnapshot.docs[0].data() as Property;
            const lastNumberStr = lastProperty.displayCode.split('-').pop();
            if (lastNumberStr) {
                const lastNumber = parseInt(lastNumberStr, 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
        }
        
        const propertyNamePrefix = newPropertyData.name.substring(0, 3).toUpperCase();
        const realtorNamePrefix = newPropertyData.capturedBy.substring(0, 3).toUpperCase();
        const displayCode = `${propertyNamePrefix}-${realtorNamePrefix}-${nextNumber}`;

        const newProperty: Omit<Property, 'id'> = {
            ...newPropertyData,
            displayCode: displayCode,
            imageUrl: newImageUrl,
        };

        const newPropertyRef = doc(propertyCollection);
        transaction.set(newPropertyRef, newProperty);
        newId = newPropertyRef.id;
    });

    return newId;
};


export const updateProperty = async (id: string, data: Partial<Property>, file?: File | null): Promise<void> => {
    const propertyRef = doc(db, 'imoveis', id);
    let updatedData = { ...data };

    if (file) {
        const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const newImageUrl = await getDownloadURL(storageRef);
        updatedData.imageUrl = newImageUrl;
    }

    await updateDoc(propertyRef, updatedData);
};

export const deleteProperty = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'imoveis', id));
};

export const getNegotiations = async (): Promise<Negotiation[]> => {
    const snapshot = await getDocs(collection(db, 'negociacoes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
};

export const getNegotiationsByRealtor = async (realtorName: string): Promise<Negotiation[]> => {
    const q = query(collection(db, 'negociacoes'), where('salesperson', '==', realtorName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
};

export const addNegotiation = async (newNegotiation: Omit<Negotiation, 'id'>): Promise<string> => {
    const batch = writeBatch(db);

    // 1. Cria a negociação
    const negotiationRef = doc(collection(db, 'negociacoes'));
    batch.set(negotiationRef, newNegotiation);

    // 2. Cria o processo administrativo correspondente
    const processoRef = doc(collection(db, 'processos'));
    const newProcesso: Omit<Processo, 'id'> = {
        negotiationId: negotiationRef.id,
        propertyDisplayCode: newNegotiation.propertyDisplayCode,
        propertyName: newNegotiation.property,
        clientName: newNegotiation.client,
        salespersonName: newNegotiation.salesperson,
        realtorName: newNegotiation.realtor,
        team: 'Equipe A', // Simulado, pode ser melhorado
        status: 'Ativo',
        stage: 'Em andamento',
        observations: 'Processo iniciado automaticamente com a negociação.'
    };
    batch.set(processoRef, newProcesso);

    // 3. Atualiza a negociação com o ID do processo
    batch.update(negotiationRef, { processoId: processoRef.id });

    // Executa as operações
    await batch.commit();

    return negotiationRef.id;
};

export const updateNegotiation = async (id: string, data: Partial<Negotiation>): Promise<void> => {
    await updateDoc(doc(db, 'negociacoes', id), data);
};

export const deleteNegotiation = async (negotiation: Negotiation): Promise<void> => {
    const codePart = negotiation.propertyDisplayCode ? `(${negotiation.propertyDisplayCode})` : '';
    const description = `Imóvel: ${negotiation.property} ${codePart}. Cliente: ${negotiation.client}. Vendedor: ${negotiation.salesperson}.`;
    
    await addNotification({
        title: "Negociação Excluída",
        description: description,
    });

    await deleteDoc(doc(db, "negociacoes", negotiation.id));
};

export const markAsDeleted = async (id: string, deletedStatus: boolean): Promise<void> => {
    const negRef = doc(db, "negociacoes", id);
    const negSnap = await getDoc(negRef);

    if (negSnap.exists()) {
        const negotiation = negSnap.data() as Negotiation;
        await updateDoc(negRef, { isDeleted: deletedStatus });

        const codePart = negotiation.propertyDisplayCode ? `(${negotiation.propertyDisplayCode})` : '';
        const description = `Imóvel: ${negotiation.property} ${codePart}. Vendedor: ${negotiation.salesperson}, Captador: ${negotiation.realtor}.`;

        if (deletedStatus) {
            await addNotification({
                title: "Negociação Excluída",
                description: description,
            });
        } else {
             await addNotification({
                title: "Negociação Restaurada",
                description: `A negociação ${codePart} foi restaurada do histórico de exclusão.`,
            });
        }
    }
};

export const archiveNegotiation = async (id: string, archiveStatus: boolean = true): Promise<void> => {
    const negRef = doc(db, "negociacoes", id);
    const negSnap = await getDoc(negRef);

    if (negSnap.exists()) {
        const negotiation = negSnap.data() as Negotiation;
        await updateDoc(negRef, { isArchived: archiveStatus });

        const codePart = negotiation.propertyDisplayCode ? `(${negotiation.propertyDisplayCode})` : '';
        const description = `Imóvel: ${negotiation.property} ${codePart}. Vendedor: ${negotiation.salesperson}, Captador: ${negotiation.realtor}.`;

        if (archiveStatus) {
            await addNotification({
                title: "Negociação Arquivada",
                description: description,
            });
        } else {
             await addNotification({
                title: "Negociação Restaurada",
                description: description,
            });
        }
    }
};

// --- NOVAS FUNÇÕES PARA PROCESSOS ---
export const getProcessos = async (): Promise<Processo[]> => {
    const snapshot = await getDocs(collection(db, 'processos'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Processo));
};

export const updateProcesso = async (id: string, data: Partial<Processo>): Promise<void> => {
    await updateDoc(doc(db, 'processos', id), data);
};

// --- NOVAS FUNÇÕES PARA CONTRATOS ---
export const getContrato = async (id: string): Promise<Contrato | null> => {
    const docRef = doc(db, 'contratos', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Contrato : null;
};

export const saveContrato = async (contratoData: Contrato): Promise<void> => {
    const contratoRef = doc(db, 'contratos', contratoData.id);
    await setDoc(contratoRef, contratoData, { merge: true });
};

export const createOrUpdateContrato = async (negotiationId: string, details: Partial<Contrato>): Promise<string> => {
    const q = query(collection(db, 'contratos'), where('negotiationId', '==', negotiationId), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        // Cria um novo
        const newContratoRef = await addDoc(collection(db, 'contratos'), {
            negotiationId,
            ...details,
        });
        // Atualiza a negociação com o ID do contrato
        await updateDoc(doc(db, 'negociacoes', negotiationId), { contratoId: newContratoRef.id });
        return newContratoRef.id;
    } else {
        // Atualiza o existente
        const contratoDoc = snapshot.docs[0];
        await updateDoc(contratoDoc.ref, details);
        return contratoDoc.id;
    }
};


export const getCommissions = async (): Promise<Commission[]> => {
    const snapshot = await getDocs(collection(db, 'comissoes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
};

export const addCommission = async (newCommission: Omit<Commission, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'comissoes'), newCommission);
    return docRef.id;
};

export const updateCommission = async (id: string, data: Partial<Commission>): Promise<void> => {
    const commissionRef = doc(db, 'comissoes', id);
    await updateDoc(commissionRef, data);
};

export const getPayments = async (): Promise<PaymentCLT[]> => {
    const snapshot = await getDocs(collection(db, 'pagamentos'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentCLT));
};

export const addPayment = async (newPayment: Omit<PaymentCLT, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'pagamentos'), newPayment);
    return docRef.id;
};

export const getExpenses = async (): Promise<Expense[]> => {
    const snapshot = await getDocs(collection(db, 'despesas'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
};

export const addExpense = async (newExpense: Omit<Expense, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'despesas'), newExpense);
    return docRef.id;
};

export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
    const snapshot = await getDocs(collection(db, 'solicitacoesServico'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
};

export const addServiceRequest = async (newRequest: Omit<ServiceRequest, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'solicitacoesServico'), newRequest);
    return docRef.id;
};

export const getFinancingProcesses = async (): Promise<FinancingProcess[]> => {
    const snapshot = await getDocs(collection(db, 'processosFinanciamento'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancingProcess));
};

export const addFinancingProcess = async (newProcess: Omit<FinancingProcess, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'processosFinanciamento'), newProcess);

    await addNotification({
        title: "Processo de Financiamento Criado",
        description: `Um novo processo para ${newProcess.clientName} (Vendedor: ${newProcess.realtorName}) foi iniciado.`,
    });

    return docRef.id;
};

export const updateFinancingProcess = async (id: string, data: Partial<FinancingProcess>): Promise<void> => {
    await updateDoc(doc(db, 'processosFinanciamento', id), data);
};

export const getEvents = async (): Promise<Event[]> => {
    const snapshot = await getDocs(collection(db, 'eventos'));
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
    const docRef = await addDoc(collection(db, 'eventos'), newEvent);
    return docRef.id;
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'notificacoes'), {
        ...notification,
        createdAt: serverTimestamp(),
        read: false,
    });
    return docRef.id;
};

export const getNotifications = async (): Promise<Notification[]> => {
    const q = query(collection(db, 'notificacoes'), orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

export async function completeSaleAndGenerateCommission(negotiation: Negotiation, finalizationNote?: string) {
    if (negotiation.stage === 'Venda Concluída' || negotiation.stage === 'Aluguel Ativo') {
        return { success: false, message: "Esta negociação já foi concluída." };
    }
    
    const batch = writeBatch(db);

    // 1. Atualiza a negociação
    const negotiationRef = doc(db, 'negociacoes', negotiation.id);
    const updatedNegotiationData = {
        stage: "Venda Concluída" as const,
        contractStatus: "Assinado" as const,
        completionDate: new Date().toISOString(),
    };
    batch.update(negotiationRef, updatedNegotiationData);

    // 1.1 Atualiza o processo
    if (negotiation.processoId) {
        const processoRef = doc(db, 'processos', negotiation.processoId);
        batch.update(processoRef, {
             status: 'Finalizado' as const,
             stage: 'Finalizado' as const,
             observations: finalizationNote || "Processo finalizado com sucesso via conclusão de venda.",
        });
    }

    // 2. Gera a comissão se for uma venda
    if (negotiation.type === 'Venda') {
        const commissionRate = 5;
        const commissionValue = negotiation.value * (commissionRate / 100);
        const newCommissionRef = doc(collection(db, 'comissoes'));
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
        const propertyRef = doc(db, 'imoveis', negotiation.propertyId);
        batch.update(propertyRef, { status: 'Vendido' });
    }
    
     // 4. Atualiza a atividade no Kanban para "Concluído", se existir
    const activityRef = doc(db, 'atividades', negotiation.id);
    const activitySnap = await getDoc(activityRef);
    if (activitySnap.exists()) {
        batch.update(activityRef, { status: 'Concluído' });
    }
    
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
    const allActivities: Activity[] = [];
    
    // Helper para determinar o status da atividade com base no status do imóvel/negociação
    const determineActivityStatus = (itemStatus: string): ActivityStatus => {
        if (itemStatus === 'Vendido' || itemStatus === 'Alugado' || itemStatus === 'Finalizado') {
            return 'Concluído';
        }
        if (itemStatus === 'Cancelado') {
            return 'Cancelado';
        }
        if (itemStatus === 'Pendente') { // Exemplo, pode ser outro status
            return 'Pendente';
        }
        return 'Ativo';
    };

    // 1. Busca captações (imóveis capturados pelo corretor)
    const capturesQuery = query(collection(db, 'imoveis'), where('capturedBy', '==', realtorName));
    const capturesSnapshot = await getDocs(capturesQuery);
    capturesSnapshot.docs.forEach(doc => {
        const prop = { id: doc.id, ...doc.data() } as Property;
        allActivities.push({
            id: prop.id,
            relatedId: prop.id,
            realtorName: prop.capturedBy,
            type: 'capture',
            name: prop.name,
            value: prop.price,
            status: determineActivityStatus(prop.status),
        });
    });

    // 2. Busca negociações (vendas realizadas pelo corretor)
    const negotiationsQuery = query(collection(db, 'negociacoes'), where('salesperson', '==', realtorName));
    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    negotiationsSnapshot.docs.forEach(doc => {
        const neg = { id: doc.id, ...doc.data() } as Negotiation;
        allActivities.push({
            id: neg.id,
            relatedId: neg.id,
            realtorName: neg.salesperson,
            type: 'negotiation',
            name: neg.property,
            value: neg.value,
            status: 'Ativo', // O status da negociação é mais complexo, simplificando aqui
        });
    });

    return allActivities;
};


export const updateActivityStatus = async (activityId: string, newStatus: ActivityStatus): Promise<void> => {
    // Como a atividade é uma representação, precisamos atualizar o item original
    // Primeiro, tentamos atualizar um documento na coleção 'negotiations'
    const negotiationRef = doc(db, "negociacoes", activityId);
    let updated = false;

    try {
        const negDoc = await getDoc(negotiationRef);
        if (negDoc.exists()) {
            const negData = negDoc.data() as Negotiation;
            const statusMap: Record<ActivityStatus, Partial<Negotiation>> = {
                'Ativo': { stage: 'Em Negociação' },
                'Pendente': { stage: 'Em Negociação' }, // Mapear para um status de negociação
                'Concluído': { stage: 'Venda Concluída' },
                'Cancelado': { stage: 'Proposta Enviada' } // Mapear para um status de negociação
            };
            if(negData.processoId) {
                await updateDoc(doc(db, 'processos', negData.processoId), { stage: newStatus === 'Concluído' ? 'Finalizado' : 'Em andamento' });
            }
            await updateDoc(negotiationRef, statusMap[newStatus]);
            updated = true;
        }
    } catch (e) {}
    
    // Se não for uma negociação, tentamos atualizar um imóvel (captação)
    if (!updated) {
        const propertyRef = doc(db, "imoveis", activityId);
        try {
            const propDoc = await getDoc(propertyRef);
            if (propDoc.exists()) {
                 const statusMap: Record<ActivityStatus, string> = {
                    'Ativo': 'Disponível',
                    'Pendente': 'Reservado', // Exemplo
                    'Concluído': 'Vendido',
                    'Cancelado': 'Disponível' // Ou um status específico
                }
                await updateDoc(propertyRef, { status: statusMap[newStatus] });
            }
        } catch(e) {}
    }
};


    
