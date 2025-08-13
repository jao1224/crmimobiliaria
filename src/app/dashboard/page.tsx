
"use client";

import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Building2, CircleDollarSign, Users } from "lucide-react";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "./layout";
import { ProfileContext } from "@/contexts/ProfileContext";

const welcomeMessages: Record<UserProfile, { title: string; subtitle: string }> = {
  'Admin': { title: "Bem-vindo(a) de volta, Admin!", subtitle: "Você tem controle total sobre o sistema. Vamos revisar os números e as operações." },
  'Imobiliária': { title: "Bem-vindo(a) à sua Imobiliária!", subtitle: "Gerencie suas equipes, imóveis e negociações com eficiência. Um ótimo dia de vendas!" },
  'Corretor Autônomo': { title: "Bem-vindo(a), Corretor(a)!", subtitle: "Seus negócios e clientes em um só lugar. Vamos fechar ótimos negócios hoje!" },
  'Investidor': { title: "Olá, Investidor(a)!", subtitle: "Acompanhe seus imóveis e as melhores oportunidades de negociação do mercado." },
  'Construtora': { title: "Bem-vindo(a), Construtora!", subtitle: "Gerencie seus empreendimentos, vendas e parcerias de forma integrada." },
};

export default function DashboardPage() {
  const { activeProfile } = useContext(ProfileContext);
  const { title, subtitle } = welcomeMessages[activeProfile] || welcomeMessages['Admin'];

  // Os dados agora são estáticos para simulação
  const stats = {
    totalRevenue: 1250000,
    activeDeals: 12,
    soldProperties: 5,
    newLeads: 25,
  };
  const [isLoading, setIsLoading] = useState(false); // Não há carregamento real

  const overviewCards = [
    {
      title: "Receita Total (Simulado)",
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue),
      change: "Todos os negócios fechados",
      icon: CircleDollarSign,
      loading: isLoading,
    },
    {
      title: "Negócios Ativos",
      value: `+${stats.activeDeals}`,
      change: "Propostas e negociações",
      icon: Users,
      loading: isLoading,
    },
    {
      title: "Imóveis Vendidos",
      value: `+${stats.soldProperties}`,
      change: "Contratos gerados",
      icon: Building2,
      loading: isLoading,
    },
    {
      title: "Novos Leads (Últimos 30 dias)",
      value: `+${stats.newLeads}`,
      change: "+15% vs. mês anterior",
      icon: BarChart3,
      loading: isLoading,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((item, index) => (
          <Card key={index} className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium leading-tight">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {item.loading ? (
                <>
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className="text-xs text-muted-foreground">{item.change}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
         <Card className="col-span-1 lg:col-span-7">
          <CardHeader>
            <CardTitle>Visão Geral de Vendas</CardTitle>
            <CardDescription>Desempenho de vendas mensais com base nos contratos gerados.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesReport />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
