
export type UserProfile = 'Super Usuário' | 'Imobiliária' | 'Corretor Autônomo' | 'Investidor' | 'Construtora' | 'Financeiro' | 'Vendedor' | 'Admin';

// O perfil "Admin" será tratado como "Super Usuário" para consistência.
// O dono do sistema é o Super Usuário.
export const userProfiles: UserProfile[] = ['Super Usuário', 'Admin', 'Imobiliária', 'Vendedor', 'Corretor Autônomo', 'Investidor', 'Construtora', 'Financeiro'];

// O perfil "Admin" foi removido para evitar ambiguidade. Usamos "Super Usuário".
export const menuConfig: Record<UserProfile, string[]> = {
    'Super Usuário': ['/dashboard', '/dashboard/activity-feed', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'],
    'Admin': ['/dashboard', '/dashboard/activity-feed', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'], // Mantido por retrocompatibilidade, mas Super Usuário é o preferencial.
    'Imobiliária': ['/dashboard', '/dashboard/activity-feed', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'],
    'Vendedor': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/finance', '/dashboard/agenda', '/dashboard/settings'],
    'Corretor Autônomo': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/settings'],
    'Investidor': ['/dashboard', '/dashboard/properties', '/dashboard/negotiations', '/dashboard/agenda', '/dashboard/finance', '/dashboard/settings'],
    'Construtora': ['/dashboard', '/dashboard/properties', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/settings'],
    'Financeiro': ['/dashboard', '/dashboard/finance', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/reporting', '/dashboard/settings', '/dashboard/agenda'],
};

// Perfis que um administrador de imobiliária pode criar para sua equipe.
export const creatableRolesByImobiliaria: UserProfile[] = ['Imobiliária', 'Vendedor', 'Financeiro', 'Corretor Autônomo'];

// Perfis que um Super Usuário (dono do sistema) pode criar.
// Apenas ele pode criar uma nova 'Imobiliária'.
export const creatableRolesBySuperUser: UserProfile[] = ['Imobiliária', 'Vendedor', 'Financeiro', 'Corretor Autônomo'];


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

    
