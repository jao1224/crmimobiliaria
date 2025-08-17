
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

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

export type Client = {
    id: string;
    name: string;
    source: string;
    assignedTo: string;
};

// --- FUNÇÕES DE ACESSO E MANIPULAÇÃO (FIRESTORE) ---

export const getLeads = async (): Promise<Lead[]> => {
    const leadsCollection = collection(db, 'leads');
    const snapshot = await getDocs(leadsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const getDeals = async (): Promise<Deal[]> => {
    const dealsCollection = collection(db, 'deals');
    const snapshot = await getDocs(dealsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
};

export const getClients = async (): Promise<Client[]> => {
    const clientsCollection = collection(db, 'clients');
    const snapshot = await getDocs(clientsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const addLead = async (newLead: Omit<Lead, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'leads'), newLead);
    return docRef.id;
};

export const addDeal = async (newDeal: Omit<Deal, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'deals'), newDeal);
    return docRef.id;
};

export const addClient = async (newClient: Omit<Client, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'clients'), newClient);
    return docRef.id;
};

export const convertLeadToClient = async (lead: Lead): Promise<void> => {
    const batch = writeBatch(db);

    // Cria um novo cliente com os dados do lead
    const newClientData: Omit<Client, 'id'> = {
        name: lead.name,
        source: lead.source,
        assignedTo: lead.assignedTo,
    };
    const newClientRef = doc(collection(db, 'clients'));
    batch.set(newClientRef, newClientData);

    // Remove o lead original
    const leadRef = doc(db, 'leads', lead.id);
    batch.delete(leadRef);

    // Executa as operações em lote
    await batch.commit();
};

    