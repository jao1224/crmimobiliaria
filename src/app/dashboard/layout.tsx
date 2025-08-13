
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  Eye,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UserCircle,
  Handshake,
  Calendar,
  FileText,
  Landmark,
  FolderKanban,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/dashboard/header";
import { useToast } from "@/hooks/use-toast";
import { ProfileProvider } from "@/contexts/ProfileContext";

export type UserProfile = 'Admin' | 'Imobiliária' | 'Corretor Autônomo' | 'Investidor' | 'Construtora' | 'Financeiro';

const menuConfig: Record<UserProfile, string[]> = {
    'Admin': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'],
    'Imobiliária': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/finance', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/correspondent', '/dashboard/services', '/dashboard/settings'],
    'Corretor Autônomo': ['/dashboard', '/dashboard/properties', '/dashboard/crm', '/dashboard/negotiations', '/dashboard/processes', '/dashboard/agenda', '/dashboard/reporting', '/dashboard/finance'],
    'Investidor': ['/dashboard', '/dashboard/properties', '/dashboard/finance', '/dashboard/negotiations', '/dashboard/agenda'],
    'Construtora': ['/dashboard', '/dashboard/properties', '/dashboard/negotiations', '/dashboard/finance', '/dashboard/agenda'],
    'Financeiro': ['/dashboard', '/dashboard/finance', '/dashboard/reporting', '/dashboard/settings'],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [activeProfile, setActiveProfile] = useState<UserProfile>('Admin');

  const handleProfileSwitch = (profile: UserProfile) => {
    setActiveProfile(profile);
    toast({
      title: "Visualização Alterada",
      description: `Agora você está visualizando como ${profile}.`,
    });
  };

  const menuItems = [
      { href: "/dashboard", icon: LayoutDashboard, label: "Painel", tooltip: "Painel" },
      { href: "/dashboard/properties", icon: Building2, label: "Imóveis", tooltip: "Imóveis" },
      { href: "/dashboard/crm", icon: Users, label: "CRM", tooltip: "CRM" },
      { href: "/dashboard/negotiations", icon: Handshake, label: "Negociações", tooltip: "Negociações" },
      { href: "/dashboard/processes", icon: FileText, label: "Processos Admin", tooltip: "Processos Administrativos" },
      { href: "/dashboard/finance", icon: CircleDollarSign, label: "Financeiro", tooltip: "Financeiro" },
      { href: "/dashboard/agenda", icon: Calendar, label: "Agenda", tooltip: "Agenda" },
      { href: "/dashboard/reporting", icon: BarChart3, label: "Relatórios", tooltip: "Relatórios" },
      { href: "/dashboard/correspondent", icon: Landmark, label: "Correspondente", tooltip: "Correspondente Bancário" },
      { href: "/dashboard/services", icon: FolderKanban, label: "Outros Serviços", tooltip: "Outros Serviços" },
  ];
  
  const visibleMenuItems = menuItems.filter(item => menuConfig[activeProfile].includes(item.href));


  return (
    <ProfileProvider value={{ activeProfile, setActiveProfile }}>
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="size-7 shrink-0 text-primary" />
              <span className="text-lg font-semibold">LeadFlow</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {visibleMenuItems.map(item => (
                   <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                          href={item.href}
                          isActive={pathname === item.href}
                          tooltip={item.tooltip}
                          asChild
                      >
                          <Link href={item.href}>
                              <item.icon />
                              <span>{item.label}</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              {menuConfig[activeProfile].includes('/dashboard/settings') && (
              <SidebarMenuItem>
                 <SidebarMenuButton
                  href="/dashboard/settings"
                  isActive={pathname.startsWith("/dashboard/settings")}
                  tooltip="Configurações"
                  asChild
                >
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               )}
              <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-12 w-full justify-start gap-2 px-2">
                         <Avatar className="h-8 w-8">
                          <AvatarImage src="https://placehold.co/100x100.png" alt="Usuário" />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start truncate">
                          <span className="truncate font-medium">Jane Doe</span>
                          <span className="text-xs text-muted-foreground">{activeProfile}</span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-56">
                      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </DropdownMenuItem>
                       <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Visualizar como</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleProfileSwitch('Admin')}>Admin</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProfileSwitch('Imobiliária')}>Imobiliária</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleProfileSwitch('Financeiro')}>Financeiro</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProfileSwitch('Corretor Autônomo')}>Corretor Autônomo</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProfileSwitch('Investidor')}>Investidor</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleProfileSwitch('Construtora')}>Construtora</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sair</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProfileProvider>
  );
}
