
export type UserProfile = 'Admin' | 'Imobiliária' | 'Corretor Autônomo' | 'Investidor' | 'Construtora' | 'Financeiro' | 'Vendedor';

// O perfil "Admin" agora é o dono do sistema.
export const userProfiles: UserProfile[] = ['Admin', 'Imobiliária', 'Vendedor', 'Corretor Autônomo', 'Investidor', 'Construtora', 'Financeiro'];

// Configuração de acesso para cada perfil
export const menuConfig: Record<UserProfile, string[]> = {
    'Admin': ['/dashboard', '/dashboard/activity-feed', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'],
    'Imobiliária': ['/dashboard', '/dashboard/activity-feed', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'],
    'Vendedor': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/finance', '/dashboard/agenda', '/dashboard/settings'],
    'Corretor Autônomo': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/settings'],
    'Investidor': ['/dashboard', '/dashboard/properties', '/dashboard/negotiations', '/dashboard/agenda', '/dashboard/finance', '/dashboard/settings'],
    'Construtora': ['/dashboard', '/dashboard/properties', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/settings'],
    'Financeiro': ['/dashboard', '/dashboard/finance', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/reporting', '/dashboard/settings', '/dashboard/agenda'],
};

// Perfis que um administrador de imobiliária pode criar para sua equipe.
export const creatableRolesByImobiliaria: UserProfile[] = ['Imobiliária', 'Vendedor', 'Financeiro', 'Corretor Autônomo'];

// Perfis que o Admin (dono do sistema) pode criar.
// Apenas ele pode criar uma nova 'Imobiliária'.
export const creatableRolesByAdmin: UserProfile[] = ['Imobiliária', 'Vendedor', 'Financeiro', 'Corretor Autônomo'];


export const allModules = [
    { id: "/dashboard", label: "Painel" },
    { id: "/dashboard/activity-feed", label: "Feed de Atividades" },
    { id: "/dashboard/properties", label: "Imóveis" },
    { id: "/dashboard/crm", label: "CRM" },
    { id: "/dashboard/negotiations", label: "Negociações" },
    { id: "/dashboard/processes", label: "Processos Admin" },
    { id: "/dashboard/finance", label: "Financeiro" },
    { id: "/dashboard/agenda", label: "Agenda" },
    { id: "/dashboard/reporting", label: "Relatórios" },
    { id: "/dashboard/correspondent", label: "Correspondente" },
    { id: "/dashboard/services", label: "Outros Serviços" },
    { id: "/dashboard/settings", label: "Configurações" },
];

    
