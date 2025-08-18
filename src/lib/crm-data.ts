
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { addNotification } from './data';

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
    document?: string;
    address?: string;
};

// --- DADOS SIMULADOS ---
let mockLeads: Lead[] = [
    { id: 'lead1', name: 'Ana Potencial', source: 'Instagram', status: 'Novo', assignedTo: 'Carlos Pereira' },
    { id: 'lead2', name: 'Pedro Interessado', source: 'Website', status: 'Contatado', assignedTo: 'Sofia Lima' },
];
let mockDeals: Deal[] = [
    { id: 'deal1', property: 'Apartamento Vista Mar', client: 'João Cliente', stage: 'Proposta Enviada', value: 950000, closeDate: '2024-08-30' },
];
let mockClients: Client[] = [
    { id: 'client1', name: 'João Cliente', source: 'Website', assignedTo: 'Carlos Pereira', document: '111.222.333-44', address: 'Rua das Contas, 123' },
    { id: 'client2', name: 'Maria Cliente', source: 'Indicação', assignedTo: 'Sofia Lima', document: '555.666.777-88', address: 'Avenida das Vendas, 456' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- FUNÇÕES DE ACESSO E MANIPULAÇÃO (SIMULADO) ---

export const getLeads = async (): Promise<Lead[]> => {
    return Promise.resolve(mockLeads);
};

export const getDeals = async (): Promise<Deal[]> => {
    return Promise.resolve(mockDeals);
};

export const getClients = async (): Promise<Client[]> => {
    return Promise.resolve(mockClients);
};

export const addLead = async (newLead: Omit<Lead, 'id'>): Promise<string> => {
    const id = generateId();
    mockLeads.push({ id, ...newLead });
    
    await addNotification({
        title: "Novo Lead!",
        description: `${newLead.name} foi adicionado como um novo lead de ${newLead.source}.`,
    });

    return Promise.resolve(id);
};

export const addDeal = async (newDeal: Omit<Deal, 'id'>): Promise<string> => {
    const id = generateId();
    mockDeals.push({ id, ...newDeal });
    return Promise.resolve(id);
};

export const addClient = async (newClient: Omit<Client, 'id'>): Promise<string> => {
    const id = generateId();
    mockClients.push({ id, ...newClient });
    return Promise.resolve(id);
};

export const convertLeadToClient = async (lead: Lead): Promise<void> => {
    // Adiciona como cliente
    const newClientData: Omit<Client, 'id'> = {
        name: lead.name,
        source: lead.source,
        assignedTo: lead.assignedTo,
    };
    await addClient(newClientData);

    // Remove da lista de leads
    mockLeads = mockLeads.filter(l => l.id !== lead.id);

    await addNotification({
        title: "Lead Convertido!",
        description: `O lead ${lead.name} foi convertido em cliente.`,
    });
    
    return Promise.resolve();
};
