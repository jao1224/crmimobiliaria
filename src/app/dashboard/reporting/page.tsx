
"use client";

import { useState, useMemo, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Building, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getNegotiations, propertyTypes, type Negotiation, getProperties, type Property, getUsers, getPayments, type PaymentCLT, getExpenses, type Expense } from "@/lib/data";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { ProfileContext } from "@/contexts/ProfileContext";
import { Badge } from "@/components/ui/badge";


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


// --- FUNÇÕES DE PROCESSAMENTO DE DADOS ---

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

const processSalesData = (negotiations: Negotiation[]) => {
    const monthlySales: { [key: string]: number } = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    negotiations.forEach(neg => {
        if (neg.stage === 'Venda Concluída' && neg.completionDate) {
            const date = new Date(neg.completionDate);
            const monthIndex = date.getUTCMonth();
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
        if (prop.capturedBy) {
            realtorCaptures[prop.capturedBy] = (realtorCaptures[prop.capturedBy] || 0) + 1;
        }
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
        conversionRate: "15%"
    })).sort((a,b) => b.revenue - a.revenue);
};


export default function ReportingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { activeProfile } = useContext(ProfileContext);

    // Dados do Firebase
    const [allNegotiations, setAllNegotiations] = useState<Negotiation[]>([]);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [allPayments, setAllPayments] = useState<PaymentCLT[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
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
            const [negs, props, teamsSnapshot, usersData, paymentsData, expensesData] = await Promise.all([
                getNegotiations(), 
                getProperties(),
                getDocs(collection(db, "teams")),
                getUsers(),
                getPayments(),
                getExpenses(),
            ]);
            setAllNegotiations(negs);
            setAllProperties(props);
            setAllPayments(paymentsData);
            setAllExpenses(expensesData);
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

    const filterByDate = (items: (Negotiation | PaymentCLT | Expense)[], dateField: keyof (Negotiation | PaymentCLT | Expense)) => {
        if (!startDate || !endDate) return items;
        return items.filter(item => {
            const itemDateStr = item[dateField];
            if (!itemDateStr || typeof itemDateStr !== 'string') return false;
            
            // Corrige o fuso horário adicionando a hora
            const itemDate = new Date(`${itemDateStr}T00:00:00`);
            const start = new Date(`${startDate}T00:00:00`);
            const end = new Date(`${endDate}T23:59:59`);

            return itemDate >= start && itemDate <= end;
        });
    }

    const filteredNegotiations = useMemo(() => {
        let negotiations = [...allNegotiations];
        if (!userCanSeeAll && currentUser) {
            negotiations = negotiations.filter(neg => neg.salespersonId === currentUser.uid || neg.realtorId === currentUser.uid);
        }

        negotiations = filterByDate(negotiations, 'completionDate') as Negotiation[];

        return negotiations.filter(neg => {
            const realtorMatch = realtorFilter === 'all' || neg.realtorId === realtorFilter || neg.salespersonId === realtorFilter;
            const teamMatch = teamFilter === 'all' || teams.find(t => t.id === teamFilter)?.members.includes(neg.salespersonId);
            const propertyTypeMatch = propertyTypeFilter === 'all' || neg.propertyType === propertyTypeFilter;
            const operationTypeMatch = operationTypeFilter === 'all' || (operationTypeFilter === 'venda' && neg.type === 'Venda');
            return realtorMatch && teamMatch && propertyTypeMatch && operationTypeMatch;
        });
    }, [allNegotiations, realtorFilter, teamFilter, propertyTypeFilter, startDate, endDate, operationTypeFilter, teams, userCanSeeAll, currentUser]);
    
    const filteredCaptures = useMemo(() => {
         let properties = [...allProperties];
        if (!userCanSeeAll && currentUser) {
            properties = properties.filter(prop => prop.capturedById === currentUser.uid);
        }
        return properties.filter(prop => {
            const realtorMatch = realtorFilter === 'all' || prop.capturedById === realtorFilter;
            const propertyTypeMatch = propertyTypeFilter === 'all' || prop.type === propertyTypeFilter;
            return realtorMatch && propertyTypeMatch;
        });
    }, [allProperties, realtorFilter, propertyTypeFilter, userCanSeeAll, currentUser]);
    
    const filteredPayments = useMemo(() => filterByDate(allPayments, 'paymentDate') as PaymentCLT[], [allPayments, startDate, endDate]);
    const filteredExpenses = useMemo(() => filterByDate(allExpenses, 'dueDate') as Expense[], [allExpenses, startDate, endDate]);

    const chartData = useMemo(() => processSalesData(filteredNegotiations), [filteredNegotiations]);
    const { realtorCaptures, propertyTypeCaptures } = useMemo(() => processCaptureData(operationTypeFilter === 'venda' ? [] : filteredCaptures), [filteredCaptures, operationTypeFilter]);
    const teamPerformanceData = useMemo(() => processTeamPerformanceData(filteredNegotiations, teams, users), [filteredNegotiations, teams, users]);
    const totalPayments = useMemo(() => filteredPayments.reduce((sum, p) => sum + p.amount, 0), [filteredPayments]);
    const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

    const handleExport = () => {
        if (activeTab !== 'sales' || filteredNegotiations.length === 0) {
            toast({
                variant: 'destructive',
                title: "Nenhum dado para exportar",
                description: "A exportação detalhada está disponível apenas para a aba 'Vendas' e requer que haja dados nos filtros atuais.",
            });
            return;
        }

        const dataToExport = filteredNegotiations.map(neg => ({
            "ID Negociacao": neg.id, "Imovel": neg.property, "Cliente": neg.client,
            "Vendedor": neg.salesperson, "Captador": neg.realtor,
            "Equipe": teams.find(t => t.members.includes(neg.salespersonId))?.name || 'Sem Equipe',
            "Valor": neg.value,
            "Data Conclusao": neg.completionDate ? new Date(neg.completionDate).toLocaleDateString('pt-BR') : 'N/A',
            "Tipo": neg.type, "Status Contrato": neg.contractStatus,
        }));
        
        const headers = Object.keys(dataToExport[0]);
        const escapeCsvCell = (cell: any) => {
            const cellStr = String(cell ?? '');
            return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
        };

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\r\n";
        dataToExport.forEach(row => {
            csvContent += headers.map(header => escapeCsvCell(row[header as keyof typeof row])).join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", 'relatorio_vendas_detalhado.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Exportação Concluída", description: "O arquivo foi baixado." });
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

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Filtros Gerais</CardTitle>
                                <CardDescription>Selecione os filtros que serão aplicados em todas as abas.</CardDescription>
                            </div>
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
            </Card>

            <Tabs defaultValue="sales" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="sales">Vendas</TabsTrigger>
                    <TabsTrigger value="captures">Captações</TabsTrigger>
                    {userCanSeeAll && <TabsTrigger value="performance">Desempenho</TabsTrigger>}
                    {userCanSeeAll && <TabsTrigger value="expenses">Despesas</TabsTrigger>}
                    {userCanSeeAll && <TabsTrigger value="payments">Pagamentos (CLT)</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="sales" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Gráfico de Desempenho de Vendas</CardTitle>
                            <CardDescription>Visualize o faturamento mensal com base nos filtros aplicados.</CardDescription>
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

                <TabsContent value="captures" className="mt-4">
                    <div className="grid gap-6 md:grid-cols-2">
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
                                                    className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary")}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
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
                        <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Captações por Tipo de Imóvel</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Tipo</TableHead><TableHead className="text-right">Imóveis Captados</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {propertyTypeCaptures.length > 0 ? (
                                            propertyTypeCaptures.map(item => (
                                                <TableRow key={item.type} className={cn("transition-all duration-200 hover:bg-secondary")}>
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
                    </div>
                </TabsContent>

                <TabsContent value="performance" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Relatório de Desempenho de Equipes</CardTitle>
                            <CardDescription>Compare a performance das equipes de vendas com base nos filtros.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Equipe</TableHead><TableHead>Receita Gerada</TableHead><TableHead>Negócios Fechados</TableHead><TableHead>Taxa de Conversão</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamPerformanceData.map(team => (
                                        <TableRow key={team.name} className="transition-all duration-200 hover:bg-secondary">
                                            <TableCell className="font-medium">{team.name}</TableCell>
                                            <TableCell>{formatCurrency(team.revenue)}</TableCell>
                                            <TableCell>{team.deals}</TableCell>
                                            <TableCell>{team.conversionRate}</TableCell>
                                        </TableRow>
                                    ))}
                                    {teamPerformanceData.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum dado de performance encontrado.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expenses" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Relatório de Despesas</CardTitle>
                            <CardDescription>Todas as despesas fixas e variáveis registradas no período selecionado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="font-medium">{expense.description}</TableCell>
                                            <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                                            <TableCell>{new Date(expense.dueDate  + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell><Badge variant={expense.status === 'Pago' ? 'success' : 'secondary'}>{expense.status}</Badge></TableCell>
                                            <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma despesa encontrada para o período.</TableCell></TableRow>
                                    )}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-right font-bold">Total de Despesas</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(totalExpenses)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Relatório de Pagamentos (CLT)</CardTitle>
                            <CardDescription>Todos os salários, impostos e outros pagamentos registrados no período.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Colaborador</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Data de Pagamento</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {filteredPayments.length > 0 ? filteredPayments.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">{payment.employee}</TableCell>
                                            <TableCell>{payment.type}</TableCell>
                                            <TableCell>{new Date(payment.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell><Badge variant={payment.status === 'Pago' ? 'success' : 'secondary'}>{payment.status}</Badge></TableCell>
                                            <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum pagamento encontrado para o período.</TableCell></TableRow>
                                    )}
                                </TableBody>
                                 <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-right font-bold">Total de Pagamentos</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(totalPayments)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

    