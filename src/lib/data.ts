
export type NegotiationStage = 'Proposta Enviada' | 'Em Negociação' | 'Contrato Gerado' | 'Venda Concluída' | 'Aluguel Ativo';
export type NegotiationType = 'Venda' | 'Aluguel' | 'Leilão';
export type ContractStatus = 'Não Gerado' | 'Pendente Assinaturas' | 'Assinado' | 'Cancelado';
export type PropertyType = 'Lançamento' | 'Revenda' | 'Terreno';

export type Negotiation = {
    id: string;
    property: string;
    propertyId: string;
    propertyType: PropertyType;
    client: string;
    clientId: string;
    stage: NegotiationStage;
    type: NegotiationType;
    value: number;
    salesperson: string;
    realtor: string;
    contractStatus: ContractStatus;
    completionDate: string; // Data de conclusão para relatórios
};

export type Property = { id: string; name: string; address: string; price: number; commission: number; };
export type Client = { id: string; name: string; doc: string; };

export const realtors = ['Carlos Pereira', 'Sofia Lima', 'Joana Doe', 'Admin'];
export const propertyTypes: PropertyType[] = ['Lançamento', 'Revenda', 'Terreno'];
export const teams = [
    { id: 'team-a', name: 'Equipe A', members: ['Carlos Pereira', 'Sofia Lima'] },
    { id: 'team-b', name: 'Equipe B', members: ['Joana Doe', 'Admin'] },
];

export const initialNegotiations: Negotiation[] = [
    { id: 'neg1', property: 'Apartamento Vista Mar', propertyId: 'prop1', propertyType: 'Revenda', client: 'João Comprador', clientId: 'cli1', stage: 'Venda Concluída', type: 'Venda', value: 850000, salesperson: 'Carlos Pereira', realtor: 'Carlos Pereira', contractStatus: 'Assinado', completionDate: '2024-07-15T10:00:00Z' },
    { id: 'neg2', property: 'Casa com Piscina', propertyId: 'prop2', propertyType: 'Revenda', client: 'Maria Investidora', clientId: 'cli2', stage: 'Em Negociação', type: 'Venda', value: 1200000, salesperson: 'Sofia Lima', realtor: 'Sofia Lima', contractStatus: 'Não Gerado', completionDate: '' },
    { id: 'neg3', property: 'Terreno Comercial', propertyId: 'prop3', propertyType: 'Terreno', client: 'Construtora Build S.A.', clientId: 'cli3', stage: 'Contrato Gerado', type: 'Venda', value: 2500000, salesperson: 'Admin', realtor: 'Carlos Pereira', contractStatus: 'Pendente Assinaturas', completionDate: '' },
    { id: 'neg4', property: 'Loft Moderno', propertyId: 'prop4', propertyType: 'Lançamento', client: 'Paulo Inquilino', clientId: 'cli4', stage: 'Aluguel Ativo', type: 'Aluguel', value: 2500, salesperson: 'Sofia Lima', realtor: 'Sofia Lima', contractStatus: 'Assinado', completionDate: '2024-08-01T10:00:00Z' },
    { id: 'neg5', property: 'Sítio Ecológico', propertyId: 'prop5', propertyType: 'Revenda', client: 'Família Verde', clientId: 'cli5', stage: 'Venda Concluída', type: 'Venda', value: 780000, salesperson: 'Joana Doe', realtor: 'Sofia Lima', contractStatus: 'Assinado', completionDate: '2024-08-05T10:00:00Z' },
    { id: 'neg6', property: 'Apartamento Centro', propertyId: 'prop6', propertyType: 'Lançamento', client: 'Investidor Anônimo', clientId: 'cli6', stage: 'Venda Concluída', type: 'Venda', value: 450000, salesperson: 'Joana Doe', realtor: 'Joana Doe', contractStatus: 'Assinado', completionDate: '2024-06-20T10:00:00Z' },
];

export const mockProperties: Property[] = [
    { id: 'prop1', name: 'Apartamento Vista Mar', address: 'Av. Beira Mar, 123', price: 900000, commission: 2.5 },
];

export const mockClients: Client[] = [
     { id: 'cli1', name: 'João Comprador', doc: '111.222.333-44' },
];
