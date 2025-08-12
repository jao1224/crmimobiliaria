
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Building2, CircleDollarSign, Users } from "lucide-react";
import { SalesReport } from "@/components/dashboard/sales-report";
import type { UserProfile } from "./layout";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage({ activeProfile }: { activeProfile?: UserProfile }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeDeals: 0,
    soldProperties: 0,
    newLeads: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

        // Total Revenue
        const revenueQuery = query(collection(db, "deals"), where("stage", "==", "Contrato Gerado"));
        const revenueSnapshot = await getDocs(revenueQuery);
        const totalRevenue = revenueSnapshot.docs.reduce((sum, doc) => sum + doc.data().value, 0);

        // Active Deals
        const activeDealsQuery = query(collection(db, "deals"), where("stage", "!=", "Contrato Gerado"));
        const activeDealsSnapshot = await getDocs(activeDealsQuery);
        const activeDeals = activeDealsSnapshot.size;

        // Sold Properties (assuming one deal per property)
        const soldProperties = revenueSnapshot.size;

        // New Leads (in the last 30 days) - This assumes leads have a timestamp field
        // As there is no timestamp, we will count all leads for now.
        const leadsQuery = await getDocs(collection(db, "leads"));
        const newLeads = leadsQuery.size;

        setStats({
          totalRevenue,
          activeDeals,
          soldProperties,
          newLeads,
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);


  const overviewCards = [
    {
      title: "Receita Total",
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
      title: "Total de Leads",
      value: `+${stats.newLeads}`,
      change: "Todos os leads cadastrados",
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
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
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
