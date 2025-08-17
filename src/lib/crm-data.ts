
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

let leadsData: Lead[] = [
    { id: "lead1", name: "Ana Silva", source: "Website", status: "Novo", assignedTo: "Carlos Pereira" },
    { id: "lead2", name: "Bruno Costa", source: "Indicação", status: "Contatado", assignedTo: "Sofia Lima" },
    { id: "lead3", name: "Carla Mendes", source: "Feirão", status: "Novo", assignedTo: "Joana Doe" },
    { id: "lead4", name: "Daniel Alves", source: "Portal Imobiliário", status: "Contatado", assignedTo: "Carlos Pereira" },
    { id: "lead5", name: "Eduarda Lima", source: "Website", status: "Qualificado", assignedTo: "Sofia Lima" },
];

let dealsData: Deal[] = [
    { id: "deal1", property: "Apartamento Central", client: "Empresa X", stage: "Proposta Enviada", value: 750000, closeDate: "2024-08-15" },
];

let clientsData: Client[] = [
    { id: "client1", name: "Empresa X", source: "Website", assignedTo: "Carlos Pereira" },
    { id: "cli1", name: 'João Comprador', source: 'Indicação', assignedTo: 'Carlos Pereira' },
    { id: "cli2", name: 'Maria Investidora', source: 'Website', assignedTo: 'Sofia Lima' },
    { id: "cli3", name: 'Construtora Build S.A.', source: 'Feirão', assignedTo: 'Admin' },
    { id: "cli4", name: 'Paulo Inquilino', source: 'Portal Imobiliário', assignedTo: 'Sofia Lima' },
    { id: "cli5", name: 'Família Verde', source: 'Indicação', assignedTo: 'Joana Doe' },
    { id: "cli6", name: 'Investidor Anônimo', source: 'Website', assignedTo: 'Joana Doe' },
];

// --- FUNÇÕES DE ACESSO E MANIPULAÇÃO ---

export const getLeads = () => [...leadsData];
export const getDeals = () => [...dealsData];
export const getClients = () => [...clientsData];

export const addLead = (newLead: Lead) => {
    if (!leadsData.some(lead => lead.id === newLead.id)) {
        leadsData.unshift(newLead);
    }
};

export const addDeal = (newDeal: Deal) => {
    if (!dealsData.some(deal => deal.id === newDeal.id)) {
        dealsData.unshift(newDeal);
    }
};

export const addClient = (newClient: Client) => {
    if (!clientsData.some(client => client.id === newClient.id)) {
        clientsData.unshift(newClient);
    }
};

export const initialLeads = getLeads();
export const initialDeals = getDeals();
export const initialClients = getClients();
