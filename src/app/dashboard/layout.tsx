
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
import { Button } from "@/components/ui/button";
import { Header } from "@/components/dashboard/header";
import { useToast } from "@/hooks/use-toast";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { type UserProfile, menuConfig, userProfiles } from "@/lib/permissions";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [activeProfile, setActiveProfile] = useState<UserProfile>('Admin');
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


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
              <span className="text-lg font-semibold">Ideal Imóveis</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <div
              className="flex-grow rounded-lg shadow-inner"
              style={{ backgroundColor: "var(--sidebar-accent)"}}
            >
              <SidebarMenu className="p-2">
                {visibleMenuItems.map((item) => (
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
            </div>
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
                      {isLoadingUser ? (
                        <div className="flex items-center gap-2 px-2 h-12 w-full">
                           <Skeleton className="h-8 w-8 rounded-full" />
                           <div className="flex flex-col gap-1 w-full">
                               <Skeleton className="h-4 w-20" />
                               <Skeleton className="h-3 w-12" />
                           </div>
                        </div>
                      ) : (
                        <Button variant="ghost" className="h-12 w-full justify-start gap-2 px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL || "https://placehold.co/100x100.png"} alt="Usuário" />
                                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start truncate">
                                <span className="truncate font-medium">{user?.displayName || "Usuário"}</span>
                                <span className="text-muted-foreground">{activeProfile}</span>
                            </div>
                        </Button>
                      )}
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
                            {userProfiles.map(profile => (
                                <DropdownMenuItem key={profile} onClick={() => handleProfileSwitch(profile)}>{profile}</DropdownMenuItem>
                            ))}
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
