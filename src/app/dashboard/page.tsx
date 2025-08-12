import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Building2, CircleDollarSign, Users } from "lucide-react";
import { SalesReport } from "@/components/dashboard/sales-report";
import type { UserProfile } from "./layout";

export default function DashboardPage({ activeProfile }: { activeProfile?: UserProfile }) {
  const overviewCards = [
    {
      title: "Receita Total",
      value: "R$45.231,89",
      change: "+20.1% em relação ao mês passado",
      icon: CircleDollarSign,
    },
    {
      title: "Negócios Ativos",
      value: "+23",
      change: "+5 desde a semana passada",
      icon: Users,
    },
    {
      title: "Imóveis Vendidos",
      value: "+12",
      change: "+2 desde o mês passado",
      icon: Building2,
    },
    {
      title: "Novos Leads",
      value: "+57",
      change: "+15 esta semana",
      icon: BarChart3,
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
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-7">
          <CardHeader>
            <CardTitle>Visão Geral de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesReport />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
