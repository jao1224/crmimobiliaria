
"use client";

import { useState, useMemo } from "react";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Building, Target, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


// --- DADOS SIMULADOS ---

// VENDAS
const realtor1Data = [ { month: "Jan", sales: 95000 }, { month: "Fev", sales: 150000 }, { month: "Mar", sales: 80000 }, { month: "Abr", sales: 40000 }, { month: "Mai", sales: 110000 }, { month: "Jun", sales: 100000 }, { month: "Jul", sales: 220000 }, { month: "Ago", sales: 180000 }, ];
const realtor2Data = [ { month: "Jan", sales: 25000 }, { month: "Fev", sales: 30000 }, { month: "Mar", sales: 70000 }, { month: "Abr", sales: 10000 }, { month: "Mai", sales: 30000 }, { month: "Jun", sales: 60000 }, { month: "Jul", sales: 80000 }, { month: "Ago", sales: 70000 }, ];
const realtor3Data = [ { month: "Jan", sales: 50000 }, { month: "Fev", sales: 60000 }, { month: "Mar", sales: 55000 }, { month: "Abr", sales: 75000 }, { month: "Mai", sales: 80000 }, { month: "Jun", sales: 90000 }, { month: "Jul", sales: 110000 }, { month: "Ago", sales: 100000 }, ];
const sumSalesData = (dataSources: { month: string; sales: number }[][]) => {
    if (dataSources.length === 0) return [];
    const maxMonths = Math.max(...dataSources.map(d => d.length));
    const summed = [];
    for (let i = 0; i < maxMonths; i++) {
        const monthData = dataSources[0][i];
        if (monthData) {
             const totalSales = dataSources.reduce((acc, currentSource) => acc + (currentSource[i]?.sales || 0), 0);
             summed.push({ month: monthData.month, sales: totalSales });
        }
    }
    return summed;
};
const teamAData = sumSalesData([realtor1Data, realtor2Data]); 
const teamBData = sumSalesData([realtor3Data]);
const generalSalesData = sumSalesData([teamAData, teamBData]);

// CAPTAÇÕES
const realtorCapturesData = [ { name: "Carlos Pereira", captures: 12 }, { name: "Sofia Lima", captures: 8 }, { name: "Novo Corretor", captures: 15 }, ];
const propertyTypeCapturesData = [ { type: "Apartamento", captures: 20 }, { type: "Casa", captures: 10 }, { type: "Terreno", captures: 5 }, ];

// DESEMPENHO
const teamPerformanceData = [ { name: "Equipe A", revenue: 1250000, deals: 25, conversionRate: "15%" }, { name: "Equipe B", revenue: 850000, deals: 18, conversionRate: "22%" }, ];


export default function ReportingPage() {
    const [activeFilter, setActiveFilter] = useState('geral');
    const [activeValue, setActiveValue] = useState('geral');
    
    const handleFilterChange = (filterType: string, value: string) => {
        // Redefine outros filtros para "geral" para evitar confusão.
        // Em uma implementação real, a lógica poderia ser mais complexa.
        setActiveFilter(filterType);
        setActiveValue(value);
    };

    const chartData = useMemo(() => {
        if (activeFilter === 'realtor') {
            if (activeValue === 'realtor-1') return realtor1Data;
            if (activeValue === 'realtor-2') return realtor2Data;
            if (activeValue === 'realtor-3') return realtor3Data;
        }
        if (activeFilter === 'team') {
            if (activeValue === 'team-a') return teamAData;
            if (activeValue === 'team-b') return teamBData;
        }
        // Para 'geral' ou qualquer outra combinação, mostra os dados gerais.
        return generalSalesData;
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

            <Tabs defaultValue="sales">
                <TabsList>
                    <TabsTrigger value="sales">Vendas</TabsTrigger>
                    <TabsTrigger value="captures">Captações</TabsTrigger>
                    <TabsTrigger value="performance">Desempenho</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sales">
                    <Card className="mt-4">
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
                                            <SelectItem value="geral">Ano Inteiro</SelectItem>
                                            <SelectItem value="last-30">Últimos 30 dias</SelectItem>
                                            <SelectItem value="this-month">Este Mês</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     <Select onValueChange={(value) => handleFilterChange('realtor', value)} defaultValue="geral">
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
                                     <Select onValueChange={(value) => handleFilterChange('team', value)} defaultValue="geral">
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filtrar por Equipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="geral">Todas as Equipes</SelectItem>
                                            <SelectItem value="team-a">Equipe A</SelectItem>
                                            <SelectItem value="team-b">Equipe B</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select onValueChange={(value) => handleFilterChange('propertyType', value)} defaultValue="geral">
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
                </TabsContent>

                <TabsContent value="captures">
                     <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Relatório de Captações</CardTitle>
                            <CardDescription>Analise os imóveis captados por corretor e tipo.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Captações por Corretor</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <Table>
                                        <TableHeader><TableRow><TableHead>Corretor</TableHead><TableHead className="text-right">Imóveis Captados</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {realtorCapturesData.map(item => (
                                                <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell className="text-right font-bold">{item.captures}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Captações por Tipo de Imóvel</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <Table>
                                        <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead className="text-right">Imóveis Captados</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {propertyTypeCapturesData.map(item => (
                                                <TableRow key={item.type}><TableCell>{item.type}</TableCell><TableCell className="text-right font-bold">{item.captures}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="performance">
                     <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Relatório de Desempenho de Equipes</CardTitle>
                            <CardDescription>Compare a performance das equipes de vendas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Equipe</TableHead>
                                        <TableHead>Receita Gerada</TableHead>
                                        <TableHead>Negócios Fechados</TableHead>
                                        <TableHead>Taxa de Conversão</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamPerformanceData.map(team => (
                                        <TableRow key={team.name}>
                                            <TableCell className="font-medium">{team.name}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(team.revenue)}</TableCell>
                                            <TableCell>{team.deals}</TableCell>
                                            <TableCell><Badge variant="success">{team.conversionRate}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    )
}

    