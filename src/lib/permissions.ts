
export type UserProfile = 'Admin' | 'Imobiliária' | 'Corretor Autônomo' | 'Investidor' | 'Construtora' | 'Financeiro';

export const userProfiles: UserProfile[] = ['Admin', 'Imobiliária', 'Corretor Autônomo', 'Investidor', 'Construtora', 'Financeiro'];

export const menuConfig: Record<UserProfile, string[]> = {
    'Admin': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'],
    'Imobiliária': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'],
    'Corretor Autônomo': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/settings'],
    'Investidor': ['/dashboard', '/dashboard/properties', '/dashboard/negotiations', '/dashboard/finance', '/dashboard/agenda', '/dashboard/settings'],
    'Construtora': ['/dashboard', '/dashboard/properties', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/settings'],
    'Financeiro': ['/dashboard', '/dashboard/finance', '/dashboard/reporting', '/dashboard/settings'],
};

export const allModules = [
    { id: "/dashboard", label: "Painel" },
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
