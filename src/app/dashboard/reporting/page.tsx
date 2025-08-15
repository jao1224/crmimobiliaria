
"use client";

import { useState, useMemo } from "react";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Building, Target, Users, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initialNegotiations, realtors, teams, propertyTypes, type Negotiation } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Importar os dados e o tipo de Imóvel
import { type Property } from "../properties/page";

// --- DADOS DINÂMICOS ---

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

const processCaptureData = (properties: Property[]) => {
    const realtorCaptures: { [key: string]: number } = {};
    const propertyTypeCaptures: { [key: string]: number } = {};

    properties.forEach(prop => {
        // Contagem por corretor
        if (prop.capturedBy) {
            realtorCaptures[prop.capturedBy] = (realtorCaptures[prop.capturedBy] || 0) + 1;
        }
        // Contagem por tipo de imóvel
        if (prop.type) {
            propertyTypeCaptures[prop.type] = (propertyTypeCaptures[prop.type] || 0) + 1;
        }
    });

    return {
        realtorCaptures: Object.entries(realtorCaptures).map(([name, captures]) => ({ name, captures })),
        propertyTypeCaptures: Object.entries(propertyTypeCaptures).map(([type, captures]) => ({ type, captures })),
    };
};

const processTeamPerformanceData = (negotiations: Negotiation[], teamsData: typeof teams) => {
    const performanceData: { [key: string]: { revenue: number, deals: number } } = {};

    teamsData.forEach(team => {
        performanceData[team.name] = { revenue: 0, deals: 0 };
    });

    negotiations.forEach(neg => {
        if (neg.stage === 'Venda Concluída') {
            const team = teamsData.find(t => t.members.includes(neg.salesperson));
            if (team) {
                performanceData[team.name].revenue += neg.value;
                performanceData[team.name].deals += 1;
            }
        }
    });
    
    return Object.entries(performanceData).map(([name, data]) => ({
        name,
        ...data,
        conversionRate: "15%" // Mantido como estático
    }));
};


export default function ReportingPage() {
    const [negotiations] = useState<Negotiation[]>(initialNegotiations);
    
    const [properties, setProperties] = useState<Property[]>([
        { id: "prop1", name: "Apartamento Vista Mar", address: "Av. Beira Mar, 123", status: "Disponível", price: 950000, commission: 2.5, imageUrl: "https://placehold.co/600x400.png", imageHint: "apartamento luxo", capturedBy: "Carlos Pereira", type: 'Revenda' },
        { id: "prop2", name: "Casa com Piscina", address: "Rua das Flores, 456", status: "Vendido", price: 1200000, commission: 3.0, imageUrl: "https://placehold.co/600x400.png", imageHint: "casa piscina", capturedBy: "Sofia Lima", type: 'Revenda' },
        { id: "prop3", name: "Terreno Comercial", address: "Av. das Américas, 789", status: "Disponível", price: 2500000, commission: 4.0, imageUrl: "https://placehold.co/600x400.png", imageHint: "terreno comercial", capturedBy: "Carlos Pereira", type: 'Terreno' },
        { id: "prop4", name: "Loft Moderno", address: "Centro, Rua Principal", status: "Alugado", price: 450000, commission: 1.5, imageUrl: "https://placehold.co/600x400.png", imageHint: "loft moderno", capturedBy: "Joana Doe", type: 'Lançamento' },
    ]);

    // Estados dos filtros
    const [realtorFilter, setRealtorFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
    const [operationTypeFilter, setOperationTypeFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredNegotiations = useMemo(() => {
        return negotiations.filter(neg => {
            const realtorMatch = realtorFilter === 'all' || neg.realtor === realtorFilter || neg.salesperson === realtorFilter;
            const teamMatch = teamFilter === 'all' || teams.find(t => t.id === teamFilter)?.members.includes(neg.salesperson);
            const propertyTypeMatch = propertyTypeFilter === 'all' || neg.propertyType === propertyTypeFilter;

            // O filtro de operação é mais complexo, pois "Captação" vem dos imóveis, e "Venda" das negociações.
            // Por simplicidade na simulação, vamos filtrar por tipo de negociação por enquanto.
            const operationTypeMatch = operationTypeFilter === 'all' || (operationTypeFilter === 'venda' && neg.type === 'Venda');

            const dateMatch = !startDate || !endDate || !neg.completionDate || (
                new Date(neg.completionDate) >= new Date(startDate) &&
                new Date(neg.completionDate) <= new Date(endDate)
            );

            return realtorMatch && teamMatch && propertyTypeMatch && dateMatch && operationTypeMatch;
        });
    }, [negotiations, realtorFilter, teamFilter, propertyTypeFilter, startDate, endDate, operationTypeFilter]);
    
    // Simulação de filtragem de captações
    const filteredCaptures = useMemo(() => {
        return properties.filter(prop => {
            const realtorMatch = realtorFilter === 'all' || prop.capturedBy === realtorFilter;
            const propertyTypeMatch = propertyTypeFilter === 'all' || prop.type === propertyTypeFilter;
            // Para captações, não filtramos por data de conclusão de venda
            return realtorMatch && propertyTypeMatch;
        });
    }, [properties, realtorFilter, propertyTypeFilter]);

    const chartData = useMemo(() => processSalesData(filteredNegotiations), [filteredNegotiations]);
    
    // Dados para os relatórios de captação usam os imóveis filtrados
    const { realtorCaptures, propertyTypeCaptures } = useMemo(() => processCaptureData(operationTypeFilter === 'venda' ? [] : filteredCaptures), [filteredCaptures, operationTypeFilter]);
    
    // Dados de desempenho de equipe usam as negociações filtradas
    const teamPerformanceData = useMemo(() => processTeamPerformanceData(filteredNegotiations, teams), [filteredNegotiations]);

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
                            <div className="flex flex-col gap-4">
                                <div>
                                    <CardTitle>Desempenho de Vendas</CardTitle>
                                    <CardDescription>Visualize dados de vendas com filtros personalizados.</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-end gap-2">
                                     <Select value={realtorFilter} onValueChange={setRealtorFilter}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                            <SelectValue placeholder="Filtrar por Corretor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Corretores</SelectItem>
                                            {realtors.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     <Select value={teamFilter} onValueChange={setTeamFilter}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                            <SelectValue placeholder="Filtrar por Equipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Equipes</SelectItem>
                                            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                            <SelectValue placeholder="Filtrar por Tipo de Imóvel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Tipos</SelectItem>
                                            {propertyTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     <Select value={operationTypeFilter} onValueChange={setOperationTypeFilter}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                            <SelectValue placeholder="Filtrar por Operação" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Operações</SelectItem>
                                            <SelectItem value="captacao">Captação</SelectItem>
                                            <SelectItem value="venda">Venda</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="grid w-full sm:w-auto gap-1.5">
                                        <Label htmlFor="start-date">Data de Início</Label>
                                        <Input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="grid w-full sm:w-auto gap-1.5">
                                        <Label htmlFor="end-date">Data de Fim</Label>
                                        <Input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                             {operationTypeFilter === 'captacao' ? (
                                <div className="text-center py-10 text-muted-foreground">O gráfico de vendas não é exibido ao filtrar por "Captação".</div>
                            ) : (
                                <SalesReport data={chartData} />
                            )}
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
                                            {realtorCaptures.length > 0 ? (
                                                realtorCaptures.map(item => (
                                                    <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell className="text-right font-bold">{item.captures}</TableCell></TableRow>
                                                ))
                                            ) : (
                                                 <TableRow>
                                                    <TableCell colSpan={2} className="h-24 text-center">Nenhuma captação encontrada para os filtros selecionados.</TableCell>
                                                </TableRow>
                                            )}
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
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead className="text-right">Imóveis Captados</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {propertyTypeCaptures.length > 0 ? (
                                                propertyTypeCaptures.map(item => (
                                                    <TableRow key={item.type}>
                                                        <TableCell>{item.type}</TableCell>
                                                        <TableCell className="text-right font-bold">{item.captures}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                 <TableRow>
                                                    <TableCell colSpan={2} className="h-24 text-center">Nenhuma captação encontrada.</TableCell>
                                                </TableRow>
                                            )}
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
                                    {teamPerformanceData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">Nenhum dado de performance encontrado para os filtros.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    )
}
