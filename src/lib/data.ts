

import { db, storage } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, limit, where, getDoc, setDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { type User as FirebaseUser } from 'firebase/auth';

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
export type PropertyType = 'Novo' | 'Usado' | 'Repasse' | 'Créd. Associativo' | 'Lote';

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
  ownerInfo?: string;
};


export type Negotiation = {
    id: string;
    negotiationDisplayCode: string;
    property: string;
    propertyId: string;
    propertyDisplayCode: string;
    propertyType: PropertyType;
    client: string;
    clientId: string;
    participants: { name: string; document: string }[];
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
    documentUrls?: { url: string; name: string }[];
};

// --- TIPOS PARA GESTÃO DE PROCESSOS ---
export type ProcessStatus = 'Ativo' | 'Suspenso' | 'Cancelado' | 'Finalizado';
export type ProcessStage = 'Em andamento' | 'Pendência' | 'Finalizado';

export type Processo = {
    id: string;
    negotiationId: string;
    processoDisplayCode: string;
    propertyDisplayCode: string;
    propertyName: string;
    clientName: string;
    salespersonName: string;
    realtorName: string;
    team: string;
    status: ProcessStatus;
    stage: ProcessStage;
    createdAt: string;
    observations?: string;
    involvedParties?: string[];
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
    processoDisplayCode?: string;
    propertyName?: string;
    propertyDisplayCode?: string;
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
    // Detalhamento da comissão
    detailedSplit?: CommissionSplit;
};

// Novo tipo para o detalhamento da comissão
export type CommissionSplit = {
    totalCommission: number;
    invoiceInfo?: {
        number: string;
        taxPercentage: number;
    };
    divisions: {
        role: string;
        value: number;
    }[];
    advances: {
        date: string;
        value: number;
        paid: boolean;
    }[];
    bonuses: {
        role: string;
        value: number;
    }[];
    observations?: string;
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

export type LegalRequestType = 'contract_review' | 'document_regularization' | 'due_diligence' | 'rental_collection' | 'other';

export type LegalRequest = {
  id: string;
  negotiationId?: string; // Vinculado a uma negociação de venda
  rentalContractId?: string; // Vinculado a um contrato de locação
  requestingUserId: string; // ID do usuário que solicitou
  type: LegalRequestType;
  description: string;
  status: 'Pendente' | 'Em Análise' | 'Concluído';
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
};

// --- NOVOS TIPOS PARA LOCAÇÃO E OUTROS SERVIÇOS ---
export type RentalContract = {
  id: string;
  propertyId: string;
  propertyName: string;
  tenantId: string; // Inquilino
  tenantName: string;
  monthlyRent: number;
  adminFee: number; // Taxa de administração (%)
  startDate: string;
  endDate: string;
  status: 'Ativo' | 'Finalizado' | 'Inadimplente';
};

export type RentalPayment = {
  id: string;
  rentalContractId: string;
  amount: number;
  paymentDate: string;
  referenceMonth: string; // ex: "2024-01"
};

export type OtherServiceType = 'evaluation' | 'auction' | 'dispatcher';

export type OtherServiceRequest = {
    id: string;
    serviceType: OtherServiceType;
    propertyId: string;
    requestingUserId: string;
    notes: string;
    status: 'Pendente' | 'Em Análise' | 'Concluído';
    createdAt: string;
};

// --- NOVO TIPO PARA DESPACHANTE ---
export type DispatcherProgressItem = {
    label: string;
    status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'N/A';
};

export type DispatcherChecklistItem = {
    label: string;
    status: 'Sim' | 'Não' | 'N/A';
    details?: string;
};

export type DispatcherProcess = {
    id: string; // O mesmo ID da negociação correspondente
    overallStatus: 'Ativo' | 'Cancelado' | 'Suspenso' | 'Concluído';
    progressStatus: 'Em Andamento' | 'Parado' | 'Outros';
    progress: DispatcherProgressItem[];
    checklist: DispatcherChecklistItem[];
    observations: string;
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
export const propertyTypes: PropertyType[] = ['Novo', 'Usado', 'Repasse', 'Créd. Associativo', 'Lote'];

// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (FIRESTORE) ---

// Helper function to sanitize filenames
const sanitizeFileName = (filename: string) => {
  const fileExtension = filename.split('.').pop() || '';
  const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.')) || filename;
  
  const sanitized = nameWithoutExtension
    .normalize("NFD") // Normalize to decompose combined characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric, non-space, non-hyphen characters
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
    
  return `${sanitized}.${fileExtension}`;
};


export const uploadImage = async (file: File, propertyId: string): Promise<string> => {
    try {
        const sanitizedName = sanitizeFileName(file.name);
        const imageRef = ref(storage, `properties/${propertyId}/${sanitizedName}`);
        
        const snapshot = await uploadBytes(imageRef, file);
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        throw new Error('Falha ao fazer upload da imagem');
    }
};

export const uploadNegotiationDocuments = async (files: File[], negotiationId: string): Promise<{ url: string; name: string }[]> => {
    const uploadPromises = files.map(async (file) => {
        const sanitizedName = sanitizeFileName(file.name);
        const docRef = ref(storage, `negotiations/${negotiationId}/documents/${sanitizedName}`);
        await uploadBytes(docRef, file);
        const url = await getDownloadURL(docRef);
        return { url, name: file.name };
    });

    return Promise.all(uploadPromises);
};

export const getUsers = async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getProperties = async (): Promise<Property[]> => {
    const propertiesCollection = collection(db, 'imoveis');
    const snapshot = await getDocs(propertiesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const getPropertiesByRealtor = async (realtorName: string): Promise<Property[]> => {
    const q = query(collection(db, 'imoveis'), where('capturedBy', '==', realtorName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const addProperty = async (newPropertyData: Omit<Property, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'imoveis'), newPropertyData);
    return docRef.id;
};

export const updateProperty = async (propertyId: string, dataToUpdate: Partial<Property>): Promise<void> => {
    const propertyRef = doc(db, 'imoveis', propertyId);
    await updateDoc(propertyRef, dataToUpdate);
};


export const deleteProperty = async (id: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Marcar o imóvel para exclusão
    const propertyRef = doc(db, 'imoveis', id);
    batch.delete(propertyRef);

    // 2. Encontrar e marcar as negociações e processos relacionados para exclusão
    const negotiationsQuery = query(collection(db, 'negociacoes'), where('propertyId', '==', id));
    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    
    for (const negDoc of negotiationsSnapshot.docs) {
        const negotiation = negDoc.data() as Negotiation;
        
        // Marcar a negociação para exclusão
        batch.delete(negDoc.ref);
        
        // Se houver um processo administrativo, marcá-lo para exclusão
        if (negotiation.processoId) {
            const processRef = doc(db, 'processos', negotiation.processoId);
            batch.delete(processRef);
        }
    }

    // 3. Executar todas as exclusões em lote
    await batch.commit();

    // 4. (Opcional) Excluir a imagem do Storage. Adicionar lógica se necessário.
    const propertyDoc = await getDoc(propertyRef);
    if (propertyDoc.exists()) {
       const propertyData = propertyDoc.data() as Property;
       if (propertyData.imageUrl && !propertyData.imageUrl.includes('placehold.co')) {
            const imageRef = ref(storage, propertyData.imageUrl);
            try {
                await deleteObject(imageRef);
            } catch (error) {
                console.error("Erro ao excluir a imagem do imóvel do Firebase Storage:", error);
            }
        }
    }
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

export const addNegotiation = async (newNegotiation: Omit<Negotiation, 'id' | 'negotiationDisplayCode'>, documents?: File[]): Promise<string> => {
    const batch = writeBatch(db);

    // 1. Cria a negociação
    const negotiationRef = doc(collection(db, 'negociacoes'));
    const negotiationDisplayCode = `NEG-${String(Date.now()).slice(-6)}`;
    const negotiationData = { ...newNegotiation, negotiationDisplayCode };
    batch.set(negotiationRef, negotiationData);
    
    // 2. Atualiza o status do imóvel para 'Em Negociação'
    const propertyRef = doc(db, 'imoveis', newNegotiation.propertyId);
    batch.update(propertyRef, { status: 'Em Negociação' });

    // 3. Cria o processo administrativo correspondente
    const processoRef = doc(collection(db, 'processos'));
    const processoDisplayCode = `PROC-${String(Date.now()).slice(-6)}`;
    const newProcesso: Omit<Processo, 'id'> = {
        negotiationId: negotiationRef.id,
        processoDisplayCode,
        propertyDisplayCode: newNegotiation.propertyDisplayCode,
        propertyName: newNegotiation.property,
        clientName: newNegotiation.client,
        salespersonName: newNegotiation.salesperson,
        realtorName: newNegotiation.realtor,
        team: 'Vendas', // Default team
        status: 'Ativo',
        stage: 'Em andamento',
        createdAt: new Date().toISOString(),
        observations: 'Processo iniciado automaticamente com a negociação.',
    };
    batch.set(processoRef, newProcesso);

    // 4. Atualiza a negociação com o ID do processo
    batch.update(negotiationRef, { processoId: processoRef.id });

    // 5. Executa as operações iniciais
    await batch.commit();

    // 6. Faz o upload dos documentos, se houver, e atualiza a negociação E o cliente
    if (documents && documents.length > 0) {
        const documentUrls = await uploadNegotiationDocuments(documents, negotiationRef.id);
        
        // Atualiza a negociação com os URLs
        await updateDoc(negotiationRef, { documentUrls });

        // Atualiza o cliente com os mesmos URLs
        const clientRef = doc(db, 'clients', newNegotiation.clientId);
        await updateDoc(clientRef, {
            documentUrls: arrayUnion(...documentUrls)
        });
    }

    return negotiationRef.id;
};

export const updateNegotiation = async (id: string, data: Partial<Negotiation>): Promise<void> => {
    await updateDoc(doc(db, 'negociacoes', id), data);
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
    const commissionsSnapshot = await getDocs(collection(db, 'comissoes'));
    const commissionsData = commissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
    
    const enrichedCommissions = await Promise.all(commissionsData.map(async (commission) => {
        // Busca o Processo para obter o processoDisplayCode
        const processoQuery = query(collection(db, 'processos'), where('negotiationId', '==', commission.negotiationId));
        const processoSnapshot = await getDocs(processoQuery);
        
        let processoDisplayCode: string | undefined;
        if (!processoSnapshot.empty) {
            processoDisplayCode = processoSnapshot.docs[0].data().processoDisplayCode;
        }

        // Busca a Negociação para obter os detalhes do imóvel
        const negotiationDoc = await getDoc(doc(db, 'negociacoes', commission.negotiationId));
        let propertyName: string | undefined;
        let propertyDisplayCode: string | undefined;
        
        if (negotiationDoc.exists()) {
            const negotiationData = negotiationDoc.data() as Negotiation;
            propertyName = negotiationData.property;
            propertyDisplayCode = negotiationData.propertyDisplayCode;
        }

        return {
            ...commission,
            processoDisplayCode,
            propertyName,
            propertyDisplayCode,
        };
    }));

    return enrichedCommissions;
};

export const addCommission = async (newCommission: Omit<Commission, 'id'>): Promise<string> => {
    // Garante que nenhum campo opcional seja `undefined`
    const commissionData = { ...newCommission };
    if (commissionData.managerName === undefined) delete commissionData.managerName;
    if (commissionData.clientSignal === undefined) delete commissionData.clientSignal;
    if (commissionData.notes === undefined) delete commissionData.notes;

    const docRef = await addDoc(collection(db, 'comissoes'), commissionData);
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

export const updatePayment = async (id: string, data: Partial<PaymentCLT>): Promise<void> => {
    const paymentRef = doc(db, 'pagamentos', id);
    await updateDoc(paymentRef, data);
};

export const deletePayment = async (id: string): Promise<void> => {
    const paymentRef = doc(db, 'pagamentos', id);
    await deleteDoc(paymentRef);
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

export const updateServiceRequest = async (id: string, data: Partial<ServiceRequest>): Promise<void> => {
    const requestRef = doc(db, 'solicitacoesServico', id);
    await updateDoc(requestRef, data);
};


export const getLegalRequests = async (): Promise<LegalRequest[]> => {
    const q = query(collection(db, 'juridico_solicitacoes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegalRequest));
};

export const addLegalRequest = async (newRequest: Omit<LegalRequest, 'id'>, users: User[], negotiations: Negotiation[], file?: File | null): Promise<string> => {
    
    let fileUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;

    if (file) {
        const storageRef = ref(storage, `legal_docs/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        fileName = file.name;
    }

    const requestToSave = {
        ...newRequest,
        fileUrl,
        fileName,
    };
    
    const docRef = await addDoc(collection(db, 'juridico_solicitacoes'), requestToSave);
    
    // Create a notification
    const requestingUser = users.find(u => u.id === newRequest.requestingUserId);
    const negotiation = newRequest.negotiationId ? negotiations.find(n => n.id === newRequest.negotiationId) : null;
    
    let description = `Solicitante: ${requestingUser?.name || 'N/A'}.`;
    if (negotiation) {
        description += ` Ref. Negociação: ${negotiation.property}`;
    } else if (newRequest.rentalContractId) {
        // Se houver um ID de contrato de aluguel, buscaremos os detalhes para a notificação
        const rentalContractDoc = await getDoc(doc(db, 'locacao_contratos', newRequest.rentalContractId));
        if (rentalContractDoc.exists()) {
            const rentalData = rentalContractDoc.data();
            description += ` Ref. Contrato Locação: ${rentalData.propertyName}`;
        }
    }
    
    await addNotification({
        title: "Nova Solicitação Jurídica",
        description: description,
    });

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

export const updateEvent = async (id: string, data: Partial<Event>): Promise<void> => {
    const eventRef = doc(db, "eventos", id);
    await updateDoc(eventRef, data);
};

export const deleteEvent = async (id: string): Promise<void> => {
    const eventRef = doc(db, "eventos", id);
    await deleteDoc(eventRef);
};


// --- FUNÇÕES DE LOCAÇÃO ---
export const getRentalContracts = async (): Promise<RentalContract[]> => {
    const snapshot = await getDocs(collection(db, 'locacao_contratos'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalContract));
};

export const addRentalContract = async (newContract: Omit<RentalContract, 'id'>): Promise<string> => {
    const batch = writeBatch(db);

    // Adiciona o contrato
    const contractRef = doc(collection(db, 'locacao_contratos'));
    batch.set(contractRef, newContract);

    // Altera o status do imóvel para "Alugado"
    const propertyRef = doc(db, 'imoveis', newContract.propertyId);
    batch.update(propertyRef, { status: "Alugado" });

    // Gera notificação
    await addNotification({
        title: "Novo Contrato de Aluguel",
        description: `O imóvel ${newContract.propertyName} foi alugado para ${newContract.tenantName}.`,
    });
    
    await batch.commit();
    return contractRef.id;
};

export const getRentalPayments = async (contractId: string): Promise<RentalPayment[]> => {
    const q = query(collection(db, 'locacao_pagamentos'), where('rentalContractId', '==', contractId), orderBy('paymentDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalPayment));
};

export const addRentalPayment = async (newPayment: Omit<RentalPayment, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'locacao_pagamentos'), newPayment);
    // Poderia gerar uma notificação aqui se necessário
    return docRef.id;
};

// --- FUNÇÕES DE OUTROS SERVIÇOS ---
export const getOtherServiceRequests = async (): Promise<OtherServiceRequest[]> => {
    const q = query(collection(db, 'outros_servicos_solicitacoes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OtherServiceRequest));
};

export const addOtherServiceRequest = async (newRequest: Omit<OtherServiceRequest, 'id'>, users: User[], properties: Property[]): Promise<string> => {
    const docRef = await addDoc(collection(db, 'outros_servicos_solicitacoes'), newRequest);
    
    const requestingUser = users.find(u => u.id === newRequest.requestingUserId);
    const property = properties.find(p => p.id === newRequest.propertyId);
    
    const serviceTypeLabels: Record<OtherServiceType, string> = {
        'evaluation': 'Avaliação de Imóvel',
        'auction': 'Inclusão em Leilão',
        'dispatcher': 'Serviço de Despachante'
    };

    const description = `Solicitante: ${requestingUser?.name || 'N/A'}. Imóvel: ${property?.name || 'N/A'}`;
    
    await addNotification({
        title: `Nova Solicitação: ${serviceTypeLabels[newRequest.serviceType]}`,
        description: description,
    });

    return docRef.id;
};

// --- FUNÇÕES PARA DESPACHANTE ---
export const getDispatcherProcess = async (negotiationId: string): Promise<DispatcherProcess | null> => {
    const docRef = doc(db, 'processos_despachante', negotiationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as DispatcherProcess;
    }
    return null;
};

export const createOrUpdateDispatcherProcess = async (negotiationId: string, data: Partial<DispatcherProcess>): Promise<void> => {
    const docRef = doc(db, 'processos_despachante', negotiationId);
    await setDoc(docRef, data, { merge: true });
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
    const q = query(collection(db, 'notificacoes'), orderBy('createdAt', 'desc'), limit(15));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

export const markNotificationsAsRead = async (): Promise<void> => {
    const notificationsRef = collection(db, 'notificacoes');
    const q = query(notificationsRef, where('read', '==', false));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(docSnapshot => {
        batch.update(docSnapshot.ref, { read: true });
    });

    await batch.commit();
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

export const getActivitiesForRealtor = async (realtorId: string): Promise<Activity[]> => {
    const activityMap = new Map<string, Activity>();

    const realtorDoc = await getDoc(doc(db, 'users', realtorId));
    if (!realtorDoc.exists()) {
        console.warn(`Nenhum usuário encontrado com o ID: ${realtorId}`);
        return [];
    }
    const realtorName = realtorDoc.data().name;

    const determineActivityStatus = (itemStatus: string | undefined): ActivityStatus => {
        const status = (itemStatus || '').toLowerCase();
        
        if (status.includes('concluído') || status.includes('vendido') || status.includes('alugado') || status.includes('finalizado')) return 'Concluído';
        if (status.includes('cancelado')) return 'Cancelado';
        if (status.includes('pendência') || status.includes('em negociação') || status.includes('proposta enviada') || status.includes('contrato gerado')) return 'Pendente';
        if (status.includes('disponível') || status.includes('em andamento') || status.includes('ativo')) return 'Ativo';
        
        return 'Ativo'; // Default status
    };

    // 1. Busca captações (imóveis capturados pelo ID do corretor)
    const capturesQuery = query(collection(db, 'imoveis'), where('capturedBy', '==', realtorName));
    const capturesSnapshot = await getDocs(capturesQuery);
    capturesSnapshot.docs.forEach(doc => {
        const prop = { id: doc.id, ...doc.data() } as Property;
        if (!activityMap.has(prop.id)) {
            activityMap.set(prop.id, {
                id: prop.id,
                relatedId: prop.id,
                realtorName: prop.capturedBy,
                type: 'capture',
                name: prop.name,
                value: prop.price,
                status: determineActivityStatus(prop.status),
            });
        }
    });

    // 2. Busca negociações onde o corretor é o VENDEDOR (pelo ID)
    const salesQuery = query(collection(db, 'negociacoes'), where('salespersonId', '==', realtorId));
    const salesSnapshot = await getDocs(salesQuery);
    salesSnapshot.docs.forEach(doc => {
        const neg = { id: doc.id, ...doc.data() } as Negotiation;
        if (!activityMap.has(neg.id)) {
            activityMap.set(neg.id, {
                id: neg.id,
                relatedId: neg.id,
                realtorName: neg.salesperson,
                type: 'negotiation',
                name: neg.property,
                value: neg.value,
                status: determineActivityStatus(neg.stage),
            });
        }
    });

    // 3. Busca negociações onde o corretor é o CAPTADOR (pelo ID)
    const realtorNegotiationsQuery = query(collection(db, 'negociacoes'), where('realtorId', '==', realtorId));
    const realtorNegotiationsSnapshot = await getDocs(realtorNegotiationsQuery);
    realtorNegotiationsSnapshot.docs.forEach(doc => {
        const neg = { id: doc.id, ...doc.data() } as Negotiation;
        if (!activityMap.has(neg.id)) {
            activityMap.set(neg.id, {
                id: neg.id,
                relatedId: neg.id,
                realtorName: neg.realtor,
                type: 'negotiation',
                name: neg.property,
                value: neg.value,
                status: determineActivityStatus(neg.stage),
            });
        }
    });


    return Array.from(activityMap.values());
};


export const updateActivityStatus = async (activityId: string, newStatus: ActivityStatus): Promise<void> => {
    // Como a atividade é uma representação, precisamos atualizar o item original
    
    // Helper para mapear ActivityStatus para os status específicos de cada coleção
    const mapStatusForNegotiation = (status: ActivityStatus): Partial<Negotiation> => {
        switch (status) {
            case 'Ativo': return { stage: 'Em Negociação', contractStatus: 'Não Gerado' };
            case 'Pendente': return { stage: 'Contrato Gerado', contractStatus: 'Pendente Assinaturas' };
            case 'Concluído': return { stage: 'Venda Concluída', contractStatus: 'Assinado' };
            case 'Cancelado': return { contractStatus: 'Cancelado' }; // Exemplo
            default: return {};
        }
    };
    
    const mapStatusForProperty = (status: ActivityStatus): string => {
        switch(status) {
            case 'Ativo': return 'Disponível';
            case 'Pendente': return 'Em Negociação';
            case 'Concluído': return 'Vendido';
            case 'Cancelado': return 'Disponível'; // Ou um status específico como 'Cancelado'
            default: return 'Disponível';
        }
    };

    const negotiationRef = doc(db, "negociacoes", activityId);
    const negDoc = await getDoc(negotiationRef);
    if (negDoc.exists()) {
        const updateData = mapStatusForNegotiation(newStatus);
        await updateDoc(negotiationRef, updateData);
        
        // Se a negociação for concluída, o imóvel também deve ser atualizado
        if (newStatus === 'Concluído') {
            const negData = negDoc.data() as Negotiation;
            if (negData.propertyId) {
                const propertyRef = doc(db, 'imoveis', negData.propertyId);
                await updateDoc(propertyRef, { status: negData.type === 'Venda' ? 'Vendido' : 'Alugado' });
            }
        }
        return;
    }

    const propertyRef = doc(db, "imoveis", activityId);
    const propDoc = await getDoc(propertyRef);
    if (propDoc.exists()) {
        const newPropertyStatus = mapStatusForProperty(newStatus);
        await updateDoc(propertyRef, { status: newPropertyStatus });
        return;
    }
    
    console.warn(`Activity with ID ${activityId} not found in 'negotiations' or 'imoveis'.`);
};

