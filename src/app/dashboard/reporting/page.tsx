
"use client";

import { useState, useMemo, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Building, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getNegotiations, propertyTypes, type Negotiation, getProperties, type Property, getUsers } from "@/lib/data";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { ProfileContext } from "@/contexts/ProfileContext";


type Team = {
    id: string;
    name: string;
    members: string[]; // member IDs
};

type User = {
    id: string;
    name: string;
    role: string;
};


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
        realtorCaptures: Object.entries(realtorCaptures).map(([name, captures]) => ({ name, captures })).sort((a, b) => b.captures - a.captures),
        propertyTypeCaptures: Object.entries(propertyTypeCaptures).map(([type, captures]) => ({ type, captures })).sort((a, b) => b.captures - a.captures),
    };
};

const processTeamPerformanceData = (negotiations: Negotiation[], teamsData: Team[], users: User[]) => {
    const performanceData: { [key: string]: { revenue: number, deals: number } } = {};

    teamsData.forEach(team => {
        performanceData[team.name] = { revenue: 0, deals: 0 };
    });

    negotiations.forEach(neg => {
        if (neg.stage === 'Venda Concluída') {
            const team = teamsData.find(t => t.members.includes(neg.salespersonId));
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
    })).sort((a,b) => b.revenue - a.revenue);
};


export default function ReportingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { activeProfile } = useContext(ProfileContext);

    // Dados do Firebase
    const [allNegotiations, setAllNegotiations] = useState<Negotiation[]>([]);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Estados de UI e Filtros
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [activeTab, setActiveTab] = useState("sales");
    const [realtorFilter, setRealtorFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
    const [operationTypeFilter, setOperationTypeFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        const loadData = async () => {
            const [negs, props, teamsSnapshot, usersData] = await Promise.all([
                getNegotiations(), 
                getProperties(),
                getDocs(collection(db, "teams")),
                getUsers()
            ]);
            setAllNegotiations(negs);
            setAllProperties(props);
            setTeams(teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
            setUsers(usersData);
        };
        loadData();
        return () => unsubscribe();
    }, []);

    const userCanSeeAll = activeProfile === 'Admin' || activeProfile === 'Imobiliária';
    
    const handleRealtorClick = (realtorName: string) => {
        const urlFriendlyName = realtorName.toLowerCase().replace(/\s+/g, '-');
        router.push(`/dashboard/reporting/${urlFriendlyName}`);
    };

    const filteredNegotiations = useMemo(() => {
        let negotiations = [...allNegotiations];

        // Regra de visibilidade primária
        if (!userCanSeeAll && currentUser) {
            negotiations = negotiations.filter(neg => neg.salespersonId === currentUser.uid || neg.realtorId === currentUser.uid);
        }

        return negotiations.filter(neg => {
            const realtorMatch = realtorFilter === 'all' || neg.realtorId === realtorFilter || neg.salespersonId === realtorFilter;
            const teamMatch = teamFilter === 'all' || teams.find(t => t.id === teamFilter)?.members.includes(neg.salespersonId);
            const propertyTypeMatch = propertyTypeFilter === 'all' || neg.propertyType === propertyTypeFilter;
            const operationTypeMatch = operationTypeFilter === 'all' || (operationTypeFilter === 'venda' && neg.type === 'Venda');

            const dateMatch = !startDate || !endDate || !neg.completionDate || (
                new Date(neg.completionDate) >= new Date(startDate) &&
                new Date(neg.completionDate) <= new Date(endDate)
            );

            return realtorMatch && teamMatch && propertyTypeMatch && dateMatch && operationTypeMatch;
        });
    }, [allNegotiations, realtorFilter, teamFilter, propertyTypeFilter, startDate, endDate, operationTypeFilter, teams, userCanSeeAll, currentUser]);
    
    const filteredCaptures = useMemo(() => {
         let properties = [...allProperties];

        // Regra de visibilidade primária
        if (!userCanSeeAll && currentUser) {
            properties = properties.filter(prop => prop.capturedById === currentUser.uid);
        }

        return properties.filter(prop => {
            const realtorMatch = realtorFilter === 'all' || prop.capturedById === realtorFilter;
            const propertyTypeMatch = propertyTypeFilter === 'all' || prop.type === propertyTypeFilter;
            return realtorMatch && propertyTypeMatch;
        });
    }, [allProperties, realtorFilter, propertyTypeFilter, userCanSeeAll, currentUser]);

    const chartData = useMemo(() => processSalesData(filteredNegotiations), [filteredNegotiations]);
    
    const { realtorCaptures, propertyTypeCaptures } = useMemo(() => processCaptureData(operationTypeFilter === 'venda' ? [] : filteredCaptures), [filteredCaptures, operationTypeFilter]);
    
    const teamPerformanceData = useMemo(() => processTeamPerformanceData(filteredNegotiations, teams, users), [filteredNegotiations, teams, users]);

    const handleExport = () => {
        if (activeTab !== 'sales' || filteredNegotiations.length === 0) {
            toast({
                variant: 'destructive',
                title: "Nenhum dado para exportar",
                description: "A exportação detalhada está disponível apenas para a aba 'Vendas' e requer que haja dados nos filtros atuais.",
            });
            return;
        }

        const dataToExport = filteredNegotiations.map(neg => {
            const team = teams.find(t => t.members.includes(neg.salespersonId));
            return {
                "ID Negociacao": neg.id,
                "Imovel": neg.property,
                "Cliente": neg.client,
                "Vendedor": neg.salesperson,
                "Captador": neg.realtor,
                "Equipe": team ? team.name : 'Sem Equipe',
                "Valor": neg.value,
                "Data Conclusao": neg.completionDate ? new Date(neg.completionDate).toLocaleDateString('pt-BR') : 'N/A',
                "Tipo": neg.type,
                "Status Contrato": neg.contractStatus,
            };
        });
        
        const headers = Object.keys(dataToExport[0]);
        const escapeCsvCell = (cell: any) => {
            const cellStr = String(cell ?? '');
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        };

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.join(",") + "\r\n";

        dataToExport.forEach(row => {
            const rowValues = headers.map(header => escapeCsvCell(row[header as keyof typeof row]));
            csvContent += rowValues.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        const filename = 'relatorio_vendas_detalhado.csv';
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Exportação Concluída", description: `O arquivo ${filename} foi baixado.` });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Relatórios & Análises</h1>
                    <p className="text-muted-foreground">Analise o desempenho com relatórios e visualizações detalhadas.</p>
                </div>
                <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Relatório
                </Button>
            </div>

            <Tabs defaultValue="sales" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="sales">Vendas</TabsTrigger>
                    <TabsTrigger value="captures">Captações</TabsTrigger>
                    {userCanSeeAll && <TabsTrigger value="performance">Desempenho</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="sales">
                    <Card className="mt-4">
                        <CardHeader>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <CardTitle>Desempenho de Vendas</CardTitle>
                                    <CardDescription>Visualize dados de vendas com filtros personalizados.</CardDescription>
                                </div>
                                {userCanSeeAll && (
                                <div className="flex flex-nowrap items-end gap-2 overflow-x-auto pb-2">
                                     <Select value={realtorFilter} onValueChange={setRealtorFilter}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                            <SelectValue placeholder="Filtrar por Corretor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Corretores</SelectItem>
                                            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
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
                                    <div className="grid w-full sm:w-auto gap-1.5 min-w-[150px]">
                                        <Label htmlFor="start-date">Data de Início</Label>
                                        <Input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="grid w-full sm:w-auto gap-1.5 min-w-[150px]">
                                        <Label htmlFor="end-date">Data de Fim</Label>
                                        <Input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </div>
                                </div>
                                )}
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
                             <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Captações por Corretor</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <Table>
                                        <TableHeader><TableRow><TableHead>Corretor</TableHead><TableHead className="text-right">Imóveis Captados</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {realtorCaptures.length > 0 ? (
                                                realtorCaptures.map(item => (
                                                    <TableRow 
                                                        key={item.name} 
                                                        onClick={() => handleRealtorClick(item.name)}
                                                        className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                                            <TableCell className="font-medium">{item.name}</TableCell>
                                                            <TableCell className="text-right font-bold">{item.captures}</TableCell>
                                                    </TableRow>
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
                             <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
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
                                                    <TableRow key={item.type} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
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
                                        <TableRow key={team.name} className="transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1">
                                            <TableCell className="font-medium">{team.name}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(team.revenue)}</TableCell>
                                            <TableCell>{team.deals}</TableCell>
                                            <TableCell>{team.conversionRate}</TableCell>
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
