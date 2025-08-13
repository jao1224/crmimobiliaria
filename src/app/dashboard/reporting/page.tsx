
"use client";

import { useState, useMemo } from "react";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

// Dados simulados para corretores individuais
const realtor1Data = [
  { month: "Jan", sales: 95000 }, { month: "Fev", sales: 150000 }, { month: "Mar", sales: 80000 },
  { month: "Abr", sales: 40000 }, { month: "Mai", sales: 110000 }, { month: "Jun", sales: 100000 },
  { month: "Jul", sales: 220000 }, { month: "Ago", sales: 180000 }, { month: "Set", sales: 0 },
  { month: "Out", sales: 0 }, { month: "Nov", sales: 0 }, { month: "Dez", sales: 0 },
];

const realtor2Data = [
  { month: "Jan", sales: 91000 }, { month: "Fev", sales: 155000 }, { month: "Mar", sales: 157000 },
  { month: "Abr", sales: 33000 }, { month: "Mai", sales: 99000 }, { month: "Jun", sales: 114000 },
  { month: "Jul", sales: 230000 }, { month: "Ago", sales: 140000 }, { month: "Set", sales: 0 },
  { month: "Out", sales: 0 }, { month: "Nov", sales: 0 }, { month: "Dez", sales: 0 },
];

// Dados simulados para equipes
const teamAData = [
  { month: "Jan", sales: 120000 }, { month: "Fev", sales: 180000 }, { month: "Mar", sales: 150000 },
  { month: "Abr", sales: 50000 }, { month: "Mai", sales: 140000 }, { month: "Jun", sales: 160000 },
  { month: "Jul", sales: 300000 }, { month: "Ago", sales: 250000 }, { month: "Set", sales: 0 },
  { month: "Out", sales: 0 }, { month: "Nov", sales: 0 }, { month: "Dez", sales: 0 },
];

// Calcula dinamicamente os dados gerais somando os dados dos corretores
const generalData = realtor1Data.map((data, index) => {
    return {
        month: data.month,
        sales: data.sales + (realtor2Data[index]?.sales || 0)
    };
});


export default function ReportingPage() {
    const [chartData, setChartData] = useState(generalData);
    
    const handleFilterChange = (filterType: string, value: string) => {
        // Esta lógica é apenas para simulação visual.
        // Em um cenário real, você faria uma nova busca de dados.
        if (filterType === 'realtor' && value === 'realtor-1') {
            setChartData(realtor1Data);
        } else if (filterType === 'realtor' && value === 'realtor-2') {
            setChartData(realtor2Data);
        } else if (filterType === 'team' && value === 'team-a') {
            setChartData(teamAData);
        } else {
            // Se o filtro for 'geral' ou qualquer outro, volta para a soma
            setChartData(generalData);
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Relatórios & Análises</h1>
                    <p className="text-muted-foreground">Analise o desempenho com relatórios e visualizações detalhadas.</p>
                </div>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Relatório
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Desempenho de Vendas</CardTitle>
                            <CardDescription>Visualize dados de vendas com filtros personalizados.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                             <Select onValueChange={(value) => handleFilterChange('period', value)} defaultValue="geral">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Visão Geral</SelectItem>
                                    <SelectItem value="last-30">Últimos 30 dias</SelectItem>
                                    <SelectItem value="this-month">Este Mês</SelectItem>
                                    <SelectItem value="this-year">Este Ano</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select onValueChange={(value) => handleFilterChange('realtor', value)} defaultValue="geral">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Corretor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Todos</SelectItem>
                                    <SelectItem value="realtor-1">Carlos Pereira</SelectItem>
                                    <SelectItem value="realtor-2">Sofia Lima</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select onValueChange={(value) => handleFilterChange('team', value)} defaultValue="geral">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Equipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Todas</SelectItem>
                                    <SelectItem value="team-a">Equipe A</SelectItem>
                                    <SelectItem value="team-b">Equipe B</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select onValueChange={(value) => handleFilterChange('propertyType', value)} defaultValue="geral">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Tipo de Imóvel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Todos</SelectItem>
                                    <SelectItem value="resale">Revenda</SelectItem>
                                    <SelectItem value="new">Lançamento</SelectItem>
                                    <SelectItem value="land">Terreno</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <SalesReport data={chartData} />
                </CardContent>
            </Card>
        </div>
    )
}
