
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Building2, CircleDollarSign, Users } from "lucide-react";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((item, index) => (
          <Card key={index}>
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
