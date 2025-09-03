
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, writeBatch, query, where, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { addNotification } from './data';
import { type Property } from './data';

// Tipos para os dados de CRM
export type Lead = {
    id: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    assignedTo: string;
};

export type Client = {
    id: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    assignedTo: string;
    document?: string;
    civilStatus?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
    birthDate?: string;
    address?: string;
    monthlyIncome?: number;
    profession?: string;
    bankInfo?: string;
    documentUrls?: { url: string, name: string }[];
};

export type Construtora = {
    id: string;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    responsible: string;
};


// --- FUNÇÕES DE ACESSO E MANIPULAÇÃO (FIRESTORE) ---

export const getLeads = async (): Promise<Lead[]> => {
    const leadsCollection = collection(db, 'leads');
    const snapshot = await getDocs(leadsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const getClients = async (): Promise<Client[]> => {
    const clientsCollection = collection(db, 'clients');
    const snapshot = await getDocs(clientsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const getConstrutoras = async (): Promise<Construtora[]> => {
    const construtorasCollection = collection(db, 'construtoras');
    const snapshot = await getDocs(construtorasCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Construtora));
};

export const addLead = async (newLead: Omit<Lead, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'leads'), newLead);
    
    await addNotification({
        title: "Novo Lead!",
        description: `${newLead.name} foi adicionado como um novo lead de ${newLead.source}.`,
    });

    return docRef.id;
};

export const addClient = async (newClient: Omit<Client, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'clients'), newClient);
    return docRef.id;
};

export const addConstrutora = async (newConstrutora: Omit<Construtora, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'construtoras'), newConstrutora);
    return docRef.id;
};

export const convertLeadToClient = async (leadId: string, clientData: Omit<Client, 'id'>): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Cria um novo documento de cliente com os dados do formulário
    const newClientRef = doc(collection(db, 'clients')); // Cria uma referência com ID automático
    batch.set(newClientRef, clientData);

    // 2. Remove o documento do lead original
    const leadRef = doc(db, 'leads', leadId);
    batch.delete(leadRef);

    // 3. Adiciona notificação
     await addNotification({
        title: "Lead Convertido!",
        description: `O lead ${clientData.name} foi convertido em cliente.`,
    });

    // 4. Executa as operações em lote
    await batch.commit();
};

export const deleteClient = async (clientId: string): Promise<void> => {
    const batch = writeBatch(db);

    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) {
        throw new Error("Cliente não encontrado.");
    }
    const clientData = clientSnap.data();

    // 1. Marcar cliente para exclusão
    batch.delete(clientRef);

    // 2. Buscar e excluir negociações e processos de financiamento associados
    const negotiationsQuery = query(collection(db, 'negociacoes'), where('clientId', '==', clientId));
    const negotiationsSnapshot = await getDocs(negotiationsQuery);

    for (const negDoc of negotiationsSnapshot.docs) {
        const negotiation = negDoc.data();
        
        // Excluir negociação
        batch.delete(negDoc.ref);
        
        // Excluir processo administrativo, se houver
        if (negotiation.processoId) {
            const processRef = doc(db, 'processos', negotiation.processoId);
            batch.delete(processRef);
        }
        
        // Excluir processo de financiamento, se houver
        const financingQuery = query(collection(db, 'processosFinanciamento'), where('negotiationId', '==', negDoc.id));
        const financingSnapshot = await getDocs(financingQuery);
        financingSnapshot.forEach(finDoc => {
            batch.delete(finDoc.ref);
        });
    }

    // 3. Adicionar notificação de exclusão
    await addNotification({
        title: "Cliente Excluído",
        description: `O cliente ${clientData.name} foi removido do sistema.`,
    });
    
    // 4. Executar o batch
    await batch.commit();
};
