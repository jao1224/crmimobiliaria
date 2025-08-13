
"use client";

import { useState, useMemo } from "react";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

// --- DADOS SIMULADOS ---

// Nível mais baixo: Corretores Individuais
const realtor1Data = [ // Carlos Pereira
  { month: "Jan", sales: 95000 }, { month: "Fev", sales: 150000 }, { month: "Mar", sales: 80000 },
  { month: "Abr", sales: 40000 }, { month: "Mai", sales: 110000 }, { month: "Jun", sales: 100000 },
  { month: "Jul", sales: 220000 }, { month: "Ago", sales: 180000 }, { month: "Set", sales: 0 },
  { month: "Out", sales: 0 }, { month: "Nov", sales: 0 }, { month: "Dez", sales: 0 },
];

const realtor2Data = [ // Sofia Lima
  { month: "Jan", sales: 25000 }, { month: "Fev", sales: 30000 }, { month: "Mar", sales: 70000 },
  { month: "Abr", sales: 10000 }, { month: "Mai", sales: 30000 }, { month: "Jun", sales: 60000 },
  { month: "Jul", sales: 80000 }, { month: "Ago", sales: 70000 }, { month: "Set", sales: 0 },
  { month: "Out", sales: 0 }, { month: "Nov", sales: 0 }, { month: "Dez", sales: 0 },
];

const realtor3Data = [ // Novo Corretor - Equipe B
  { month: "Jan", sales: 50000 }, { month: "Fev", sales: 60000 }, { month: "Mar", sales: 55000 },
  { month: "Abr", sales: 75000 }, { month: "Mai", sales: 80000 }, { month: "Jun", sales: 90000 },
  { month: "Jul", sales: 110000 }, { month: "Ago", sales: 100000 }, { month: "Set", sales: 0 },
  { month: "Out", sales: 0 }, { month: "Nov", sales: 0 }, { month: "Dez", sales: 0 },
];

// Função auxiliar para somar dados de vendas
const sumSalesData = (dataSources: { month: string; sales: number }[][]) => {
    if (dataSources.length === 0) return [];
    return dataSources[0].map((base, index) => {
        const totalSales = dataSources.reduce((acc, currentSource) => {
            return acc + (currentSource[index]?.sales || 0);
        }, 0);
        return {
            month: base.month,
            sales: totalSales,
        };
    });
};

// Nível intermediário: Equipes (soma dos seus corretores)
const teamAData = sumSalesData([realtor1Data, realtor2Data]); // Equipe A = Carlos + Sofia
const teamBData = sumSalesData([realtor3Data]);             // Equipe B = Novo Corretor

// Nível mais alto: Geral (soma de todas as equipes)
const generalData = sumSalesData([teamAData, teamBData]);


export default function ReportingPage() {
    const [activeFilter, setActiveFilter] = useState('geral');
    const [activeValue, setActiveValue] = useState('geral');
    
    const handleFilterChange = (filterType: string, value: string) => {
        setActiveFilter(filterType);
        setActiveValue(value);
    };

    const chartData = useMemo(() => {
        switch (activeFilter) {
            case 'realtor':
                if (activeValue === 'realtor-1') return realtor1Data;
                if (activeValue === 'realtor-2') return realtor2Data;
                if (activeValue === 'realtor-3') return realtor3Data;
                return generalData;
            case 'team':
                if (activeValue === 'team-a') return teamAData;
                if (activeValue === 'team-b') return teamBData;
                return generalData;
            case 'propertyType':
            case 'period':
                 // Para simulação, retornamos os dados gerais.
                 // A lógica de filtragem real ocorreria aqui.
                return generalData;
            default:
                return generalData;
        }
    }, [activeFilter, activeValue]);


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
                             <Select onValueChange={(value) => handleFilterChange('period', value)} value={activeFilter === 'period' ? activeValue : 'geral'}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Ano Inteiro</SelectItem>
                                    <SelectItem value="last-30">Últimos 30 dias</SelectItem>
                                    <SelectItem value="this-month">Este Mês</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select onValueChange={(value) => handleFilterChange('realtor', value)} value={activeFilter === 'realtor' ? activeValue : 'geral'}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Corretor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Todos os Corretores</SelectItem>
                                    <SelectItem value="realtor-1">Carlos Pereira</SelectItem>
                                    <SelectItem value="realtor-2">Sofia Lima</SelectItem>
                                    <SelectItem value="realtor-3">Novo Corretor</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select onValueChange={(value) => handleFilterChange('team', value)} value={activeFilter === 'team' ? activeValue : 'geral'}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Equipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Todas as Equipes</SelectItem>
                                    <SelectItem value="team-a">Equipe A</SelectItem>
                                    <SelectItem value="team-b">Equipe B</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select onValueChange={(value) => handleFilterChange('propertyType', value)} value={activeFilter === 'propertyType' ? activeValue : 'geral'}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Tipo de Imóvel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Todos os Tipos</SelectItem>
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
