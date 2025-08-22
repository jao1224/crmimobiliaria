
"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Building2, CircleDollarSign, Users, Calendar, Clock } from "lucide-react";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "./layout";
import { ProfileContext } from "@/contexts/ProfileContext";
import { getNegotiations, type Negotiation, getEvents, type Event } from "@/lib/data";
import { getLeads } from "@/lib/crm-data";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const welcomeMessages: Record<UserProfile, { title: string; subtitle: string }> = {
  'Admin': { title: "Admin!", subtitle: "Visão geral completa do sistema. Monitore o desempenho e gerencie todas as operações." },
  'Imobiliária': { title: "à sua Imobiliária!", subtitle: "Aqui está uma visão geral completa do desempenho da imobiliária." },
  'Corretor Autônomo': { title: "Corretor(a)!", subtitle: "Visão geral do dia: seus resultados em destaque." },
  'Investidor': { title: "Investidor(a)!", subtitle: "Acompanhe seus imóveis e as melhores oportunidades de negociação do mercado." },
  'Construtora': { title: "Construtora!", subtitle: "Gerencie seus empreendimentos, vendas e parcerias de forma integrada." },
  'Financeiro': { title: "Financeiro!", subtitle: "Acompanhe o fluxo de caixa e as métricas financeiras." },
  'Vendedor': { title: "Vendedor(a)!", subtitle: "Visão geral do dia: seus resultados em destaque." }
};

// Função para processar os dados de vendas e agrupar por mês
const processSalesData = (negotiations: Negotiation[]) => {
    const monthlySales: { [key: string]: number } = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    negotiations.forEach(neg => {
        if (neg.stage === 'Venda Concluída' && neg.completionDate) {
            const date = new Date(neg.completionDate);
            const monthIndex = date.getUTCMonth(); // Usar getUTCMonth para consistência
            const month = months[monthIndex];
            if (month) {
                monthlySales[month] = (monthlySales[month] || 0) + neg.value;
            }
        }
    });

    return months.map(month => ({
        month,
        sales: monthlySales[month] || 0
    }));
};


export default function DashboardPage() {
  const { activeProfile } = useContext(ProfileContext);
  const [greeting, setGreeting] = useState("Bem-vindo(a) de volta,");
  const { title, subtitle } = welcomeMessages[activeProfile] || welcomeMessages['Admin'];
  
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      setGreeting("Bom dia,");
    } else if (currentHour >= 12 && currentHour < 18) {
      setGreeting("Boa tarde,");
    } else {
      setGreeting("Boa noite,");
    }
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [negs, lds, evts] = await Promise.all([getNegotiations(), getLeads(), getEvents()]);
            setNegotiations(negs);
            setLeads(lds);
            setEvents(evts);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    fetchData();
  }, []);

  // Calculando estatísticas dinamicamente
  const stats = useMemo(() => ({
    totalRevenue: negotiations
      .filter(n => n.stage === 'Venda Concluída')
      .reduce((sum, n) => sum + n.value, 0),
    activeDeals: negotiations.filter(n => n.stage !== 'Venda Concluída' && n.stage !== 'Aluguel Ativo').length,
    soldProperties: negotiations.filter(n => n.stage === 'Venda Concluída').length,
    newLeads: leads.length,
  }), [negotiations, leads]);
  
  // Gerando os dados para o gráfico dinamicamente
  const salesData = useMemo(() => processSalesData(negotiations), [negotiations]);

  const todaysEvents = useMemo(() => {
    const today = new Date();
    const todayYear = today.getUTCFullYear();
    const todayMonth = today.getUTCMonth();
    const todayDate = today.getUTCDate();

    return events.filter(event => {
        const eventDate = new Date(event.date as any); // event.date is already a Date object
        const eventYear = eventDate.getUTCFullYear();
        const eventMonth = eventDate.getUTCMonth();
        const eventDay = eventDate.getUTCDate();
        
        return eventYear === todayYear && eventMonth === todayMonth && eventDay === todayDate;
    }).sort((a,b) => a.time.localeCompare(b.time));
  }, [events]);

  const overviewCards = [
    {
      title: "Receita Total (Sincronizado)",
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
      title: "Novos Leads (Total)",
      value: `+${stats.newLeads}`,
      change: "Leads no funil de vendas",
      icon: BarChart3,
      loading: isLoading,
    },
  ];

  const getEventTypeLabel = (type: Event['type']) => {
        switch (type) {
            case 'personal': return { label: 'Pessoal', className: 'bg-blue-500' };
            case 'company': return { label: 'Imobiliária', className: 'bg-red-500' };
            case 'team_visit': return { label: 'Visita de Equipe', className: 'bg-green-500' };
            default: return { label: 'Evento', className: 'bg-gray-500' };
        }
    };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{`${greeting} ${title}`}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna de Cards de Estatística */}
        <div className="grid gap-6 md:grid-cols-2 lg:col-span-2">
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
            <Card className="md:col-span-2 transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                    <CardTitle>Visão Geral de Vendas</CardTitle>
                    <CardDescription>Desempenho de vendas mensais com base nos contratos gerados.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    {isLoading ? <Skeleton className="w-full h-[300px]" /> : <SalesReport data={salesData} />}
                </CardContent>
            </Card>
        </div>

        {/* Coluna da Agenda */}
        <div className="lg:col-span-1">
             <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5"/> Agenda do Dia</CardTitle>
                <CardDescription>Seus compromissos para hoje, {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : todaysEvents.length > 0 ? (
                    <div className="space-y-4">
                        {todaysEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center p-2 bg-muted rounded-md">
                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                    <span className="text-sm font-semibold">{event.time}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm truncate">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">{event.description}</p>
                                </div>
                                <Badge style={{ backgroundColor: getEventTypeLabel(event.type).className }} className="text-white text-xs">{getEventTypeLabel(event.type).label}</Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                        <Calendar className="h-10 w-10 mb-2"/>
                        <p className="font-semibold">Nenhum evento para hoje</p>
                        <p className="text-sm">Sua agenda está livre.</p>
                    </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
