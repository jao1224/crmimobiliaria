
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, writeBatch, query, where, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { addNotification } from './data';
import { type Property } from './data';
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


// Tipos para os dados de CRM
export type Lead = {
    id: string;
    imobiliariaId: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    assignedTo: string;
};

export type Participant = {
    id: string;
    name: string;
    document: string;
};

export type Client = {
    id: string;
    imobiliariaId: string;
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
    participants?: Participant[];
};

export type Construtora = {
    id: string;
    imobiliariaId: string;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    responsible: string;
};


// --- FUNÇÕES DE ACESSO E MANIPULAÇÃO (FIRESTORE) ---

export const getLeads = async (): Promise<Lead[]> => {
    const imobiliariaId = await getImobiliariaId();
    const leadsCollection = collection(db, 'leads');
    const q = query(leadsCollection, where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const getClients = async (): Promise<Client[]> => {
    const imobiliariaId = await getImobiliariaId();
    const clientsCollection = collection(db, 'clients');
    const q = query(clientsCollection, where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const getConstrutoras = async (): Promise<Construtora[]> => {
    const imobiliariaId = await getImobiliariaId();
    const construtorasCollection = collection(db, 'construtoras');
    const q = query(construtorasCollection, where("imobiliariaId", "==", imobiliariaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Construtora));
};

export const addLead = async (newLead: Omit<Lead, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const dataToSave = { ...newLead, imobiliariaId };
    const docRef = await addDoc(collection(db, 'leads'), dataToSave);
    
    await addNotification({
        title: "Novo Lead!",
        description: `${newLead.name} foi adicionado como um novo lead de ${newLead.source}.`,
        imobiliariaId,
    });

    return docRef.id;
};

export const addClient = async (newClient: Omit<Client, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const dataToSave = { ...newClient, imobiliariaId };
    const docRef = await addDoc(collection(db, 'clients'), dataToSave);
    return docRef.id;
};

export const addConstrutora = async (newConstrutora: Omit<Construtora, 'id' | 'imobiliariaId'>): Promise<string> => {
    const imobiliariaId = await getImobiliariaId();
    const dataToSave = { ...newConstrutora, imobiliariaId };
    const docRef = await addDoc(collection(db, 'construtoras'), dataToSave);
    return docRef.id;
};

export const convertLeadToClient = async (leadId: string, clientData: Omit<Client, 'id'>): Promise<void> => {
    const imobiliariaId = await getImobiliariaId();
    const batch = writeBatch(db);

    // 1. Cria um novo documento de cliente com os dados do formulário
    const newClientRef = doc(collection(db, 'clients')); // Cria uma referência com ID automático
    batch.set(newClientRef, { ...clientData, imobiliariaId });

    // 2. Remove o documento do lead original
    const leadRef = doc(db, 'leads', leadId);
    batch.delete(leadRef);

    // 3. Adiciona notificação
     await addNotification({
        title: "Lead Convertido!",
        description: `O lead ${clientData.name} foi convertido em cliente.`,
        imobiliariaId,
    });

    // 4. Executa as operações em lote
    await batch.commit();
};

export const deleteClient = async (clientId: string): Promise<void> => {
    const imobiliariaId = await getImobiliariaId();
    const batch = writeBatch(db);

    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) {
        throw new Error("Cliente não encontrado.");
    }
    const clientData = clientSnap.data();
    
    // Security check
    if (clientData.imobiliariaId !== imobiliariaId) {
        throw new Error("Permissão negada para excluir este cliente.");
    }

    // 1. Marcar cliente para exclusão
    batch.delete(clientRef);

    // 2. Buscar e excluir negociações e processos de financiamento associados
    const negotiationsQuery = query(collection(db, 'negociacoes'), where('clientId', '==', clientId), where('imobiliariaId', '==', imobiliariaId));
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
        const financingQuery = query(collection(db, 'processosFinanciamento'), where('negotiationId', '==', negDoc.id), where('imobiliariaId', '==', imobiliariaId));
        const financingSnapshot = await getDocs(financingQuery);
        financingSnapshot.forEach(finDoc => {
            batch.delete(finDoc.ref);
        });
    }

    // 3. Adicionar notificação de exclusão
    await addNotification({
        title: "Cliente Excluído",
        description: `O cliente ${clientData.name} foi removido do sistema.`,
        imobiliariaId,
    });
    
    // 4. Executar o batch
    await batch.commit();
};

export const addParticipantToClient = async (clientId: string, participantData: Omit<Participant, 'id'>): Promise<void> => {
    if (!clientId || !participantData) {
        throw new Error("ID do cliente e dados do participante são necessários.");
    }
    const clientRef = doc(db, 'clients', clientId);
    const newParticipant = {
        id: new Date().getTime().toString(), // Simple unique ID
        ...participantData,
    };
    await updateDoc(clientRef, {
        participants: arrayUnion(newParticipant)
    });
};
