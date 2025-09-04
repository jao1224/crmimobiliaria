
import { db, storage } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, limit, where, getDoc, setDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from './firebase';


// Helper function to get the current user's imobiliariaId
const getImobiliariaId = async (): Promise<string> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuário não autenticado.");

    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists() || !userDocSnap.data().imobiliariaId) {
        // Fallback for the very first Admin user whose imobiliariaId is their own UID
        if (userDocSnap.exists() && userDocSnap.data().role === 'Admin') {
            return currentUser.uid;
        }
        throw new Error("Não foi possível determinar a imobiliária do usuário.");
    }
    return userDocSnap.data().imobiliariaId;
};

// --- START OF DATA TYPES ---

export type PropertyType = 'Novo' | 'Usado' | 'Repasse' | 'Créd. Associativo' | 'Lote';

export type Property = {
  id: string;
  imobiliariaId: string;
  displayCode: string;
  name: string;
  address: string;
  status: string;
  price: number;
  type: PropertyType;
  commission: number; 
  imageUrl: string;
  imageHint: string;
  capturedBy: string; 
  capturedById: string;
  description?: string;
  ownerInfo?: string;
};

export type NegotiationStage = 'Proposta Enviada' | 'Em Negociação' | 'Contrato Gerado' | 'Venda Concluída' | 'Aluguel Ativo';
export type NegotiationType = 'Venda' | 'Aluguel' | 'Leilão';
export type ContractStatus = 'Não Gerado' | 'Pendente Assinaturas' | 'Assinado' | 'Cancelado';

export type FinancingDetails = {
    bank: string;
    outstandingBalance: number;
    balanceDate: string;
    installmentValue: number;
    remainingInstallments: number;
    dueDate: number;
    creditLine: string;
};

export type Negotiation = {
    id: string;
    imobiliariaId: string;
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
    financingDetails?: FinancingDetails;
    isArchived?: boolean;
    isDeleted?: boolean;
    documentUrls?: { url: string; name: string }[];
    processoId?: string; // ID do processo administrativo
    contratoId?: string; // ID do contrato
};


export type ProcessStatus = 'Ativo' | 'Suspenso' | 'Cancelado' | 'Finalizado';
export type ProcessStage = 'Em andamento' | 'Pendência' | 'Finalizado';

export type Processo = {
    id: string;
    imobiliariaId: string;
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
    imobiliariaId: string;
    negotiationId: string;
    details: ContractDetails;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
};

export type CommissionSplit = {
    totalCommission: number;
    invoiceInfo?: { number: string; taxPercentage: number; };
    divisions: { role: string; value: number; }[];
    advances: { date: string; value: number; paid: boolean; }[];
    bonuses: { role: string; value: number; }[];
    observations?: string;
};

export type Commission = {
    id: string;
    imobiliariaId: string;
    negotiationId: string;
    processoDisplayCode?: string;
    propertyName?: string;
    propertyDisplayCode?: string;
    propertyValue: number;
    clientName: string;
    realtorName: string; 
    salespersonName: string;
    managerName?: string; 
    clientSignal?: number; 
    commissionValue: number;
    commissionRate: number;
    paymentDate: string;
    status: 'Pago' | 'Pendente' | 'Vencido';
    notes?: string;
    detailedSplit?: CommissionSplit;
};

export type FinancingStatus = 'Aprovado' | 'Reprovado' | 'Condicionado' | 'Bloqueado' | 'Pendente';
export type EngineeringStatus = 'Aprovado' | 'Reprovado' | 'Pendência' | 'Não solicitado';
export type GeneralProcessStatus = 'Ativo' | 'Suspenso' | 'Cancelado' | 'Concluído';

export type FinancingProcess = {
    id: string;
    imobiliariaId: string;
    negotiationId: string;
    clientName: string;
    propertyName: string;
    realtorName: string;
    clientStatus: FinancingStatus;
    clientStatusReason: string;
    approvedValue: number;
    bacenInfo: string;
    engineeringStatus: EngineeringStatus;
    engineeringReason: string;
    appraisalValue: number;
    appraisalDate: string;
    docs: { [key: string]: { updated: boolean; dueDate: string } };
    stages: { [key: string]: boolean | string };
    generalStatus: GeneralProcessStatus;
    hasPendency: boolean;
};

export type ServiceRequestType = 'credit_approval' | 'engineering_report' | 'property_registration' | 'account_opening';

export type ServiceRequest = {
    id: string;
    imobiliariaId: string;
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
  imobiliariaId: string;
  negotiationId?: string;
  rentalContractId?: string;
  requestingUserId: string;
  type: LegalRequestType;
  description: string;
  status: 'Pendente' | 'Em Análise' | 'Concluído';
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
};

export type RentalContract = {
  id: string;
  imobiliariaId: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  monthlyRent: number;
  adminFee: number;
  startDate: string;
  endDate: string;
  status: 'Ativo' | 'Finalizado' | 'Inadimplente';
};

export type RentalPayment = {
  id: string;
  imobiliariaId: string;
  rentalContractId: string;
  amount: number;
  paymentDate: string;
  referenceMonth: string;
};

export type OtherServiceType = 'evaluation' | 'auction' | 'dispatcher';

export type OtherServiceRequest = {
    id: string;
    imobiliariaId: string;
    serviceType: OtherServiceType;
    propertyId: string;
    requestingUserId: string;
    notes: string;
    status: 'Pendente' | 'Em Análise' | 'Concluído';
    createdAt: string;
};

export type DispatcherProgressItem = { label: string; status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'N/A'; };
export type DispatcherChecklistItem = { label: string; status: 'Sim' | 'Não' | 'N/A'; details?: string; };

export type DispatcherProcess = {
    id: string;
    imobiliariaId: string;
    overallStatus: 'Ativo' | 'Cancelado' | 'Suspenso' | 'Concluído';
    progressStatus: 'Em Andamento' | 'Parado' | 'Outros';
    progress: DispatcherProgressItem[];
    checklist: DispatcherChecklistItem[];
    observations: string;
};

export type EventType = 'personal' | 'company' | 'team_visit';

export type Event = {
    id: string;
    imobiliariaId: string;
    date: Date | { seconds: number; nanoseconds: number };
    title: string;
    type: EventType;
    time: string;
    description: string;
};

export type PaymentCLT = {
    id: string;
    imobiliariaId: string;
    employee: string;
    type: 'Salário' | '13º Salário' | 'Férias' | 'Impostos';
    amount: number;
    paymentDate: string;
    status: 'Agendado' | 'Pago';
};

export type Expense = {
    id: string;
    imobiliariaId: string;
    description: string;
    category: 'Fixa' | 'Variável';
    amount: number;
    dueDate: string;
    status: 'Pendente' | 'Pago';
};

export type Notification = {
    id: string;
    imobiliariaId: string;
    title: string;
    description: string;
    createdAt: { seconds: number, nanoseconds: number };
    read: boolean;
};

export type ActivityStatus = 'Ativo' | 'Pendente' | 'Concluído' | 'Cancelado';
export type Activity = {
    id: string;
    realtorName: string;
    type: 'capture' | 'negotiation';
    name: string;
    value: number;
    status: ActivityStatus;
    relatedId: string;
};

export type User = {
    id: string;
    uid: string;
    name: string;
    email: string;
    role: string;
    imobiliariaId: string;
};

// --- STATIC DATA ---
export const propertyTypes: PropertyType[] = ['Novo', 'Usado', 'Repasse', 'Créd. Associativo', 'Lote'];


// --- FIRESTORE FUNCTIONS ---

const sanitizeFileName = (filename: string): string => {
  const fileExtension = filename.split('.').pop() || '';
  const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.')) || filename;
  
  const sanitized = nameWithoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
    
  return `${sanitized}.${fileExtension}`;
};

export const uploadImage = async (file: File, propertyId: string): Promise<string> => {
    try {
        const sanitizedName = sanitizeFileName(file.name);
        const imageRef = ref(storage, `properties/${propertyId}/${sanitizedName}`);
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
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
    const imobiliariaId = await getImobiliariaId();
    const snapshot = await getDocs(query(collection(db, 'users'), where("imobiliariaId", "==", imobiliariaId)));
    // Admin needs to see all users
    const adminSnapshot = await getDocs(query(collection(db, 'users'), where("role", "==", "Admin")));
    const allUsers = [...snapshot.docs, ...adminSnapshot.docs].map(doc => ({ id: doc.id, ...doc.data() } as User));
    // Remove duplicates
    return allUsers.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
};

export const getProperties = async (): Promise<Property[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'imoveis'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
};

export const addProperty = async (newPropertyData: Omit<Property, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const dataToSave = { ...newPropertyData, imobiliariaId };
    const docRef = await addDoc(collection(db, 'imoveis'), dataToSave);
    return docRef.id;
};

export const updateProperty = async (propertyId: string, dataToUpdate: Partial<Property>): Promise<void> => {
    const propertyRef = doc(db, 'imoveis', propertyId);
    await updateDoc(propertyRef, dataToUpdate);
};

export const deleteProperty = async (id: string): Promise<void> => {
    const imobiliariaId = await getImobiliariaId();
    const batch = writeBatch(db);
    const propertyRef = doc(db, 'imoveis', id);

    // Security check
    const propSnap = await getDoc(propertyRef);
    if (!propSnap.exists() || propSnap.data().imobiliariaId !== imobiliariaId) {
        throw new Error("Permissão negada ou imóvel não encontrado.");
    }
    
    batch.delete(propertyRef);

    const negotiationsQuery = query(collection(db, 'negociacoes'), where('propertyId', '==', id), where('imobiliariaId', '==', imobiliariaId));
    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    
    for (const negDoc of negotiationsSnapshot.docs) {
        const negotiation = negDoc.data() as Negotiation;
        batch.delete(negDoc.ref);
        if (negotiation.processoId) {
            batch.delete(doc(db, 'processos', negotiation.processoId));
        }
    }

    await batch.commit();

    const propertyData = propSnap.data() as Property;
    if (propertyData.imageUrl && !propertyData.imageUrl.includes('placehold.co')) {
        try {
            await deleteObject(ref(storage, propertyData.imageUrl));
        } catch (error) {
            console.error("Erro ao excluir imagem do Storage:", error);
        }
    }
};

export const getNegotiations = async (): Promise<Negotiation[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'negociacoes'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
};

export const addNegotiation = async (newNegotiation: Omit<Negotiation, 'id' | 'negotiationDisplayCode' | 'imobiliariaId'>, documents?: File[]): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const batch = writeBatch(db);
    
    const negotiationRef = doc(collection(db, 'negociacoes'));
    const negotiationDisplayCode = `NEG-${String(Date.now()).slice(-6)}`;
    const negotiationData = { ...newNegotiation, imobiliariaId, negotiationDisplayCode };
    
    if (negotiationData.financingDetails === undefined) delete negotiationData.financingDetails;
    
    batch.set(negotiationRef, negotiationData);
    
    const propertyRef = doc(db, 'imoveis', newNegotiation.propertyId);
    batch.update(propertyRef, { status: 'Em Negociação' });

    const processoRef = doc(collection(db, 'processos'));
    const processoDisplayCode = `PROC-${String(Date.now()).slice(-6)}`;
    const newProcesso: Omit<Processo, 'id'> = {
        imobiliariaId,
        negotiationId: negotiationRef.id,
        processoDisplayCode,
        propertyDisplayCode: newNegotiation.propertyDisplayCode,
        propertyName: newNegotiation.property,
        clientName: newNegotiation.client,
        salespersonName: newNegotiation.salesperson,
        realtorName: newNegotiation.realtor,
        team: 'Vendas',
        status: 'Ativo',
        stage: 'Em andamento',
        createdAt: new Date().toISOString(),
        observations: 'Processo iniciado automaticamente.',
    };
    batch.set(processoRef, newProcesso);

    batch.update(negotiationRef, { processoId: processoRef.id });

    await batch.commit();

    if (documents && documents.length > 0) {
        const documentUrls = await uploadNegotiationDocuments(documents, negotiationRef.id);
        await updateDoc(negotiationRef, { documentUrls });
        await updateDoc(doc(db, 'clients', newNegotiation.clientId), { documentUrls: arrayUnion(...documentUrls) });
    }

    return negotiationRef.id;
};

export const updateNegotiation = async (id: string, data: Partial<Negotiation>): Promise<void> => {
    await updateDoc(doc(db, 'negociacoes', id), data);
};

export const archiveNegotiation = async (id: string, archiveStatus: boolean = true): Promise<void> => {
    const imobiliariaId = await getImobiliariaId();
    const negRef = doc(db, "negociacoes", id);
    // Security check can be added here if needed
    await updateDoc(negRef, { isArchived: archiveStatus });
    const negSnap = await getDoc(negRef);
    if(negSnap.exists()) {
        const description = `Negociação do imóvel ${negSnap.data().property} foi ${archiveStatus ? 'arquivada' : 'restaurada'}.`;
        await addNotification({ title: `Negociação ${archiveStatus ? 'Arquivada' : 'Restaurada'}`, description, imobiliariaId });
    }
};

export const markAsDeleted = async (id: string, deletedStatus: boolean): Promise<void> => {
    const imobiliariaId = await getImobiliariaId();
    const negRef = doc(db, "negociacoes", id);
    // Security check
    await updateDoc(negRef, { isDeleted: deletedStatus });
    const negSnap = await getDoc(negRef);
     if(negSnap.exists()) {
        const description = `Negociação do imóvel ${negSnap.data().property} foi ${deletedStatus ? 'movida para a lixeira' : 'restaurada'}.`;
        await addNotification({ title: `Negociação ${deletedStatus ? 'Excluída' : 'Restaurada'}`, description, imobiliariaId });
    }
};

export const getProcessos = async (): Promise<Processo[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'processos'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Processo));
};

export const updateProcesso = async (id: string, data: Partial<Processo>): Promise<void> => {
    await updateDoc(doc(db, 'processos', id), data);
};

export const getContrato = async (id: string): Promise<Contrato | null> => {
    const docRef = doc(db, 'contratos', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Contrato : null;
};

export const createOrUpdateContrato = async (negotiationId: string, details: Partial<Omit<Contrato, 'id' | 'negotiationId' | 'imobiliariaId'>>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'contratos'), where('negotiationId', '==', negotiationId), where('imobiliariaId', '==', imobiliariaId), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        const newContratoRef = await addDoc(collection(db, 'contratos'), { ...details, negotiationId, imobiliariaId });
        await updateDoc(doc(db, 'negociacoes', negotiationId), { contratoId: newContratoRef.id });
        return newContratoRef.id;
    } else {
        const contratoDoc = snapshot.docs[0];
        await updateDoc(contratoDoc.ref, details);
        return contratoDoc.id;
    }
};

export const getCommissions = async (): Promise<Commission[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'comissoes'), where("imobiliariaId", "==", imobiliariaId));
    const commissionsSnapshot = await getDocs(q);
    const commissionsData = commissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
    
    return Promise.all(commissionsData.map(async (commission) => {
        const processoQuery = query(collection(db, 'processos'), where('negotiationId', '==', commission.negotiationId), where("imobiliariaId", "==", imobiliariaId));
        const negotiationDoc = await getDoc(doc(db, 'negociacoes', commission.negotiationId));
        
        const processoSnapshot = await getDocs(processoQuery);
        const processoDisplayCode = processoSnapshot.empty ? undefined : processoSnapshot.docs[0].data().processoDisplayCode;
        const propertyName = negotiationDoc.exists() ? (negotiationDoc.data() as Negotiation).property : undefined;
        const propertyDisplayCode = negotiationDoc.exists() ? (negotiationDoc.data() as Negotiation).propertyDisplayCode : undefined;

        return { ...commission, processoDisplayCode, propertyName, propertyDisplayCode };
    }));
};

export const addCommission = async (newCommission: Omit<Commission, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const commissionData = { ...newCommission, imobiliariaId };
    if (commissionData.managerName === undefined) delete commissionData.managerName;
    if (commissionData.clientSignal === undefined) delete commissionData.clientSignal;
    if (commissionData.notes === undefined) delete commissionData.notes;
    
    const docRef = await addDoc(collection(db, 'comissoes'), commissionData);
    return docRef.id;
};

export const updateCommission = async (id: string, data: Partial<Commission>): Promise<void> => {
    await updateDoc(doc(db, 'comissoes', id), data);
};

export const getPayments = async (): Promise<PaymentCLT[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'pagamentos'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentCLT));
};

export const addPayment = async (newPayment: Omit<PaymentCLT, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const docRef = await addDoc(collection(db, 'pagamentos'), { ...newPayment, imobiliariaId });
    return docRef.id;
};

export const updatePayment = async (id: string, data: Partial<PaymentCLT>): Promise<void> => {
    await updateDoc(doc(db, 'pagamentos', id), data);
};

export const deletePayment = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'pagamentos', id));
};

export const getExpenses = async (): Promise<Expense[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'despesas'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
};

export const addExpense = async (newExpense: Omit<Expense, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const docRef = await addDoc(collection(db, 'despesas'), { ...newExpense, imobiliariaId });
    return docRef.id;
};

export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'solicitacoesServico'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
};

export const addServiceRequest = async (newRequest: Omit<ServiceRequest, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const docRef = await addDoc(collection(db, 'solicitacoesServico'), { ...newRequest, imobiliariaId });
    return docRef.id;
};

export const updateServiceRequest = async (id: string, data: Partial<ServiceRequest>): Promise<void> => {
    await updateDoc(doc(db, 'solicitacoesServico', id), data);
};

export const getLegalRequests = async (): Promise<LegalRequest[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'juridico_solicitacoes'), where("imobiliariaId", "==", imobiliariaId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegalRequest));
};

export const addLegalRequest = async (newRequest: Omit<LegalRequest, 'id' | 'imobiliariaId'>, users: User[], negotiations: Negotiation[], file?: File | null): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    let fileUrl: string | undefined, fileName: string | undefined;

    if (file) {
        const storageRef = ref(storage, `legal_docs/${imobiliariaId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        fileName = file.name;
    }

    const docRef = await addDoc(collection(db, 'juridico_solicitacoes'), { ...newRequest, fileUrl, fileName, imobiliariaId });
    
    const requestingUser = users.find(u => u.id === newRequest.requestingUserId);
    const negotiation = newRequest.negotiationId ? negotiations.find(n => n.id === newRequest.negotiationId) : null;
    
    let description = `Solicitante: ${requestingUser?.name || 'N/A'}.`;
    if (negotiation) description += ` Ref. Negociação: ${negotiation.property}`;
    
    await addNotification({ title: "Nova Solicitação Jurídica", description, imobiliariaId });
    return docRef.id;
};

export const getFinancingProcesses = async (): Promise<FinancingProcess[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'processosFinanciamento'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancingProcess));
};

export const addFinancingProcess = async (newProcess: Omit<FinancingProcess, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const docRef = await addDoc(collection(db, 'processosFinanciamento'), { ...newProcess, imobiliariaId });

    await addNotification({
        title: "Processo de Financiamento Criado",
        description: `Um novo processo para ${newProcess.clientName} (Vendedor: ${newProcess.realtorName}) foi iniciado.`,
        imobiliariaId
    });
    return docRef.id;
};

export const updateFinancingProcess = async (id: string, data: Partial<FinancingProcess>): Promise<void> => {
    await updateDoc(doc(db, 'processosFinanciamento', id), data);
};

export const getEvents = async (): Promise<Event[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'eventos'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() } as Event));
};

export const addEvent = async (newEvent: Omit<Event, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const docRef = await addDoc(collection(db, 'eventos'), { ...newEvent, imobiliariaId });
    return docRef.id;
};

export const updateEvent = async (id: string, data: Partial<Event>): Promise<void> => {
    await updateDoc(doc(db, "eventos", id), data);
};

export const deleteEvent = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "eventos", id));
};

export const getRentalContracts = async (): Promise<RentalContract[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'locacao_contratos'), where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalContract));
};

export const addRentalContract = async (newContract: Omit<RentalContract, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const batch = writeBatch(db);
    const contractRef = doc(collection(db, 'locacao_contratos'));
    batch.set(contractRef, { ...newContract, imobiliariaId });
    batch.update(doc(db, 'imoveis', newContract.propertyId), { status: "Alugado" });
    await addNotification({ title: "Novo Contrato de Aluguel", description: `O imóvel ${newContract.propertyName} foi alugado para ${newContract.tenantName}.`, imobiliariaId });
    await batch.commit();
    return contractRef.id;
};

export const getRentalPayments = async (contractId: string): Promise<RentalPayment[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'locacao_pagamentos'), where('rentalContractId', '==', contractId), where('imobiliariaId', '==', imobiliariaId), orderBy('paymentDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalPayment));
};

export const addRentalPayment = async (newPayment: Omit<RentalPayment, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const docRef = await addDoc(collection(db, 'locacao_pagamentos'), { ...newPayment, imobiliariaId });
    return docRef.id;
};

export const getOtherServiceRequests = async (): Promise<OtherServiceRequest[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'outros_servicos_solicitacoes'), where("imobiliariaId", "==", imobiliariaId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OtherServiceRequest));
};

export const addOtherServiceRequest = async (newRequest: Omit<OtherServiceRequest, 'id' | 'imobiliariaId'>, users: User[], properties: Property[]): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const docRef = await addDoc(collection(db, 'outros_servicos_solicitacoes'), { ...newRequest, imobiliariaId });
    const requestingUser = users.find(u => u.id === newRequest.requestingUserId);
    const property = properties.find(p => p.id === newRequest.propertyId);
    const serviceTypeLabels: Record<OtherServiceType, string> = { 'evaluation': 'Avaliação de Imóvel', 'auction': 'Inclusão em Leilão', 'dispatcher': 'Serviço de Despachante' };
    await addNotification({ title: `Nova Solicitação: ${serviceTypeLabels[newRequest.serviceType]}`, description: `Solicitante: ${requestingUser?.name || 'N/A'}. Imóvel: ${property?.name || 'N/A'}`, imobiliariaId });
    return docRef.id;
};

export const getDispatcherProcess = async (negotiationId: string): Promise<DispatcherProcess | null> => {
    const docRef = doc(db, 'processos_despachante', negotiationId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as DispatcherProcess : null;
};

export const createOrUpdateDispatcherProcess = async (negotiationId: string, data: Partial<DispatcherProcess>): Promise<void> => {
    const imobiliariaId = await getImobiliariaId();
    await setDoc(doc(db, 'processos_despachante', negotiationId), { ...data, imobiliariaId }, { merge: true });
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'notificacoes'), { ...notification, createdAt: serverTimestamp(), read: false });
    return docRef.id;
};

export const getNotifications = async (): Promise<Notification[]> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'notificacoes'), where("imobiliariaId", "==", imobiliariaId), orderBy('createdAt', 'desc'), limit(15));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

export const markNotificationsAsRead = async (): Promise<void> => {
    const imobiliariaId = await getImobiliariaId();
    const q = query(collection(db, 'notificacoes'), where('read', '==', false), where("imobiliariaId", "==", imobiliariaId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;
    const batch = writeBatch(db);
    querySnapshot.forEach(docSnapshot => batch.update(docSnapshot.ref, { read: true }));
    await batch.commit();
};

export async function completeSaleAndGenerateCommission(negotiation: Negotiation, finalizationNote?: string) {
    if (negotiation.stage === 'Venda Concluída' || negotiation.stage === 'Aluguel Ativo') {
        return { success: false, message: "Esta negociação já foi concluída." };
    }
    
    const imobiliariaId = await getImobiliariaId();
    const batch = writeBatch(db);

    const negotiationRef = doc(db, 'negociacoes', negotiation.id);
    batch.update(negotiationRef, { stage: "Venda Concluída" as const, contractStatus: "Assinado" as const, completionDate: new Date().toISOString() });

    if (negotiation.processoId) {
        batch.update(doc(db, 'processos', negotiation.processoId), { status: 'Finalizado' as const, stage: 'Finalizado' as const, observations: finalizationNote || "Processo finalizado." });
    }

    if (negotiation.type === 'Venda') {
        const commissionRef = doc(collection(db, 'comissoes'));
        batch.set(commissionRef, {
            imobiliariaId,
            negotiationId: negotiation.id,
            propertyValue: negotiation.value,
            commissionValue: negotiation.value * 0.05, // 5% default
            commissionRate: 5,
            clientName: negotiation.client,
            realtorName: negotiation.realtor,
            salespersonName: negotiation.salesperson,
            paymentDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            status: 'Pendente',
            notes: 'Comissão gerada automaticamente.'
        });
    }
    
    if (negotiation.propertyId && negotiation.type === 'Venda') {
        batch.update(doc(db, 'imoveis', negotiation.propertyId), { status: 'Vendido' });
    }
    
    const activityRef = doc(db, 'atividades', negotiation.id);
    if ((await getDoc(activityRef)).exists()) batch.update(activityRef, { status: 'Concluído' });
    
    await addNotification({ title: "Venda Concluída!", description: `O imóvel '${negotiation.property}' foi vendido para ${negotiation.client}.`, imobiliariaId });
    
    await batch.commit();
    return { success: true, message: `A comissão para a venda de "${negotiation.property}" foi gerada.` };
}

export const getActivitiesForRealtor = async (realtorId: string): Promise<Activity[]> => {
    // This function needs context of the imobiliaria to be truly multi-tenant.
    // For now, it queries globally and might show cross-tenant data if names match.
    // A proper implementation would require imobiliariaId on all relevant docs.
    const activityMap = new Map<string, Activity>();
    const realtorDoc = await getDoc(doc(db, 'users', realtorId));
    if (!realtorDoc.exists()) return [];
    const realtorName = realtorDoc.data().name;

    const determineActivityStatus = (itemStatus: string | undefined): ActivityStatus => {
        const status = (itemStatus || '').toLowerCase();
        if (status.includes('concluído') || status.includes('vendido') || status.includes('alugado') || status.includes('finalizado')) return 'Concluído';
        if (status.includes('cancelado')) return 'Cancelado';
        if (status.includes('pendência') || status.includes('em negociação') || status.includes('proposta enviada') || status.includes('contrato gerado')) return 'Pendente';
        return 'Ativo';
    };

    const capturesQuery = query(collection(db, 'imoveis'), where('capturedBy', '==', realtorName));
    const capturesSnapshot = await getDocs(capturesQuery);
    capturesSnapshot.docs.forEach(d => {
        const prop = { id: d.id, ...d.data() } as Property;
        activityMap.set(prop.id, { id: prop.id, relatedId: prop.id, realtorName: prop.capturedBy, type: 'capture', name: prop.name, value: prop.price, status: determineActivityStatus(prop.status) });
    });

    const salesQuery = query(collection(db, 'negociacoes'), where('salespersonId', '==', realtorId));
    const salesSnapshot = await getDocs(salesQuery);
    salesSnapshot.docs.forEach(d => {
        const neg = { id: d.id, ...d.data() } as Negotiation;
        if (!activityMap.has(neg.id)) activityMap.set(neg.id, { id: neg.id, relatedId: neg.id, realtorName: neg.salesperson, type: 'negotiation', name: neg.property, value: neg.value, status: determineActivityStatus(neg.stage) });
    });

    return Array.from(activityMap.values());
};

export const updateActivityStatus = async (activityId: string, newStatus: ActivityStatus): Promise<void> => {
    // This function also needs a security layer to ensure a user can only update their own activities.
    const mapStatusForNegotiation = (status: ActivityStatus): Partial<Negotiation> => {
        switch (status) { case 'Ativo': return { stage: 'Em Negociação' }; case 'Pendente': return { stage: 'Contrato Gerado' }; case 'Concluído': return { stage: 'Venda Concluída' }; case 'Cancelado': return { contractStatus: 'Cancelado' }; default: return {}; }
    };
    const mapStatusForProperty = (status: ActivityStatus): string => {
        switch(status) { case 'Ativo': return 'Disponível'; case 'Pendente': return 'Em Negociação'; case 'Concluído': return 'Vendido'; case 'Cancelado': return 'Disponível'; default: return 'Disponível'; }
    };

    const negRef = doc(db, "negociacoes", activityId);
    const negDoc = await getDoc(negRef);
    if (negDoc.exists()) {
        await updateDoc(negRef, mapStatusForNegotiation(newStatus));
        return;
    }

    const propRef = doc(db, "imoveis", activityId);
    if ((await getDoc(propRef)).exists()) {
        await updateDoc(propRef, { status: mapStatusForProperty(newStatus) });
        return;
    }
    console.warn(`Activity with ID ${activityId} not found.`);
};
