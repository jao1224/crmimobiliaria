

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

export const initialLeads: Lead[] = [
    { id: "lead1", name: "Ana Silva", source: "Website", status: "Novo", assignedTo: "Carlos Pereira" },
    { id: "lead2", name: "Bruno Costa", source: "Indicação", status: "Contatado", assignedTo: "Sofia Lima" },
    { id: "lead3", name: "Carla Mendes", source: "Feirão", status: "Novo", assignedTo: "Joana Doe" },
    { id: "lead4", name: "Daniel Alves", source: "Portal Imobiliário", status: "Contatado", assignedTo: "Carlos Pereira" },
    { id: "lead5", name: "Eduarda Lima", source: "Website", status: "Qualificado", assignedTo: "Sofia Lima" },
];

export const initialDeals: Deal[] = [
    { id: "deal1", property: "Apartamento Central", client: "Empresa X", stage: "Proposta Enviada", value: 750000, closeDate: "2024-08-15" },
];

export const initialClients: Client[] = [
    { id: "client1", name: "Empresa X", source: "Website", assignedTo: "Carlos Pereira" },
];
