
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
    documentUrls?: { url: string, name: string }[];
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

export const convertLeadToClient = async (lead: Lead): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Cria um novo documento de cliente
    const newClientData: Omit<Client, 'id'> = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        assignedTo: lead.assignedTo,
    };
    const newClientRef = doc(collection(db, 'clients')); // Cria uma referência com ID automático
    batch.set(newClientRef, newClientData);

    // 2. Remove o documento do lead
    const leadRef = doc(db, 'leads', lead.id);
    batch.delete(leadRef);

    // 3. Adiciona notificação
     await addNotification({
        title: "Lead Convertido!",
        description: `O lead ${lead.name} foi convertido em cliente.`,
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
