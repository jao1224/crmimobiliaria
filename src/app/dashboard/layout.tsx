"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UserCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
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
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard"
                isActive={pathname === "/dashboard"}
                tooltip="Dashboard"
                asChild
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/properties"
                isActive={pathname === "/dashboard/properties"}
                tooltip="Properties"
                asChild
              >
                <Link href="/dashboard/properties">
                  <Building2 />
                  <span>Properties</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/crm"
                isActive={pathname === "/dashboard/crm"}
                tooltip="CRM"
                asChild
              >
                <Link href="/dashboard/crm">
                  <Users />
                  <span>CRM</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/finance"
                isActive={pathname === "/dashboard/finance"}
                tooltip="Finance"
                asChild
              >
                <Link href="/dashboard/finance">
                  <CircleDollarSign />
                  <span>Finance</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/reporting"
                isActive={pathname.startsWith("/dashboard/reporting")}
                tooltip="Reporting"
                asChild
              >
                <Link href="/dashboard/reporting">
                  <BarChart3 />
                  <span>Reporting</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton
                href="/dashboard/settings"
                isActive={pathname.startsWith("/dashboard/settings")}
                tooltip="Settings"
                asChild
              >
                <Link href="/dashboard/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-12 w-full justify-start gap-2 px-2">
                       <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="User" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <span className="truncate">Jane Doe</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
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
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
