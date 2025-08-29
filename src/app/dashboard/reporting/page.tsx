

"use client";

import { useState, useMemo, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { SalesReport } from "@/components/dashboard/sales-report";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Building, Users, Wand2, Sparkles, AlertTriangle, FileDown, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getNegotiations, propertyTypes, type Negotiation, getProperties, type Property, getUsers, getPayments, type PaymentCLT, getExpenses, type Expense, updatePayment, deletePayment } from "@/lib/data";
import { getReportInsights as getReportInsightsAction } from "@/lib/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs } from "firebase/firestore";
import { db, auth, app } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { ProfileContext } from "@/contexts/ProfileContext";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


type Team = {
    id: string;
    name: string;
    memberIds: string[];
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
    const realtorCaptures: { [key: string]: { id: string, name: string, captures: number } } = {};
    const propertyTypeCaptures: { [key: string]: number } = {};

    properties.forEach(prop => {
        if (prop.capturedBy && prop.capturedById) {
             if (!realtorCaptures[prop.capturedBy]) {
                realtorCaptures[prop.capturedBy] = { id: prop.capturedById, name: prop.capturedBy, captures: 0 };
            }
            realtorCaptures[prop.capturedBy].captures += 1;
        }
        if (prop.type) {
            propertyTypeCaptures[prop.type] = (propertyTypeCaptures[prop.type] || 0) + 1;
        }
    });

    return {
        realtorCaptures: Object.values(realtorCaptures).sort((a, b) => b.captures - a.captures),
        propertyTypeCaptures: Object.entries(propertyTypeCaptures).map(([type, captures]) => ({ type, captures })).sort((a, b) => b.captures - a.captures),
    };
};

const processTeamPerformanceData = (negotiations: Negotiation[], teamsData: Team[], users: User[]) => {
    const performanceData: { [key: string]: { revenue: number, deals: number } } = {};

    teamsData.forEach(team => {
        performanceData[team.name] = { revenue: 0, deals: 0 };
    });

    negotiations.forEach(neg => {
        if (neg.stage === 'Venda Concluída' && neg.salespersonId) {
            const team = teamsData.find(t => t.memberIds?.includes(neg.salespersonId));
            if (team) {
                performanceData[team.name].revenue += neg.value;
                performanceData[team.name].deals += 1;
            }
        }
    });
    
    return Object.entries(performanceData).map(([name, data]) => ({
        name,
        ...data,
        conversionRate: "15%" // Simulado
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
    // Filtros Gerais
    const [realtorFilter, setRealtorFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
    const [operationTypeFilter, setOperationTypeFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // Filtros Específicos
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
    
    // Edição e Exclusão
    const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentCLT | null>(null);
    const [isDeletePaymentOpen, setIsDeletePaymentOpen] = useState(false);
    
    // Detalhes da Equipe
    const [isTeamDetailOpen, setIsTeamDetailOpen] = useState(false);
    const [selectedTeamDetails, setSelectedTeamDetails] = useState<any | null>(null);

    // Estados para IA
    const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState<any | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        loadData();
        
        return () => unsubscribe();
    }, []);
    
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


    const userCanSeeAll = activeProfile === 'Admin' || activeProfile === 'Imobiliária';
    
    const handleRealtorClick = (realtorId: string) => {
        router.push(`/dashboard/reporting/${realtorId}`);
    };

    const filterByDate = (items: (Negotiation | PaymentCLT | Expense)[], dateField: keyof (Negotiation | PaymentCLT | Expense)) => {
        if (!startDate && !endDate) return items;
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
        
        return items.filter(item => {
            const itemDateStr = item[dateField];
            if (!itemDateStr || typeof itemDateStr !== 'string') return false;
            
            const itemDate = new Date(`${itemDateStr}T00:00:00`);
            
            if (start && end) return itemDate >= start && itemDate <= end;
            if (start) return itemDate >= start;
            if (end) return itemDate <= end;
            return true;
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
            const teamMatch = teamFilter === 'all' || teams.find(t => t.id === teamFilter)?.memberIds.includes(neg.salespersonId);
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
    
    const filteredExpenses = useMemo(() => {
        let expenses = filterByDate(allExpenses, 'dueDate') as Expense[];
        if (expenseCategoryFilter !== 'all') {
            expenses = expenses.filter(exp => exp.category === expenseCategoryFilter);
        }
        return expenses;
    }, [allExpenses, startDate, endDate, expenseCategoryFilter]);

    const filteredPayments = useMemo(() => {
        let payments = filterByDate(allPayments, 'paymentDate') as PaymentCLT[];
        if (paymentTypeFilter !== 'all') {
            payments = payments.filter(pay => pay.type === paymentTypeFilter);
        }
        return payments;
    }, [allPayments, startDate, endDate, paymentTypeFilter]);


    const chartData = useMemo(() => processSalesData(filteredNegotiations), [filteredNegotiations]);
    const { realtorCaptures, propertyTypeCaptures } = useMemo(() => processCaptureData(operationTypeFilter === 'venda' ? [] : filteredCaptures), [filteredCaptures, operationTypeFilter]);
    const teamPerformanceData = useMemo(() => processTeamPerformanceData(filteredNegotiations, teams, users), [filteredNegotiations, teams, users]);
    const totalPayments = useMemo(() => filteredPayments.reduce((sum, p) => sum + p.amount, 0), [filteredPayments]);
    const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

    const handleAiAnalysis = async () => {
        setIsAiAnalysisLoading(true);
        setAiInsights(null);

        const salesDataString = `Vendas: ${filteredNegotiations.length} negócios totalizando ${formatCurrency(filteredNegotiations.reduce((acc, neg) => acc + neg.value, 0))}.`;
        const capturesDataString = `Captações: ${realtorCaptures.length > 0 ? realtorCaptures.map(r => `${r.name} (${r.captures})`).join(', ') : 'Nenhuma'}.`;
        const teamDataString = `Equipes: ${teamPerformanceData.length > 0 ? teamPerformanceData.map(t => `${t.name} (Receita: ${formatCurrency(t.revenue)})`).join(', ') : 'Nenhuma'}.`;

        const result = await getReportInsightsAction(salesDataString, capturesDataString, teamDataString);
        
        if (result.success) {
            setAiInsights(result.data!);
        } else {
            toast({
                variant: 'destructive',
                title: 'Erro na Análise',
                description: result.error,
            });
        }
        setIsAiAnalysisLoading(false);
    };

    const handleExport = async (format: 'csv' | 'pdf') => {
        setIsExporting(true);

        const dataToExport = filteredNegotiations.map(neg => ({
            "ID Negociacao": neg.id, "Imovel": neg.property, "Cliente": neg.client,
            "Vendedor": neg.salesperson, "Captador": neg.realtor,
            "Equipe": teams.find(t => t.memberIds.includes(neg.salespersonId))?.name || 'Sem Equipe',
            "Valor": neg.value,
            "Data Conclusao": neg.completionDate ? new Date(neg.completionDate).toLocaleDateString('pt-BR') : 'N/A',
        }));

        if (dataToExport.length === 0) {
            toast({
                variant: 'destructive',
                title: "Nenhum dado para exportar",
                description: "A exportação requer que haja dados de vendas nos filtros atuais.",
            });
            setIsExporting(false);
            return;
        }

        if (format === 'csv') {
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
            link.setAttribute("download", 'relatorio_vendas.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'pdf') {
            try {
                const functions = getFunctions(app);
                const generateReportPdf = httpsCallable(functions, 'generateReportPdf');
                
                const reportData = {
                    title: "Relatório de Vendas",
                    filters: {
                        startDate: startDate || 'N/A',
                        endDate: endDate || 'N/A',
                    },
                    sales: dataToExport,
                    summary: {
                        totalRevenue: filteredNegotiations.reduce((acc, neg) => acc + neg.value, 0),
                        totalDeals: filteredNegotiations.length,
                    }
                };

                const result = await generateReportPdf(reportData) as any;
                const pdfBase64 = result.data.pdfBase64;

                const byteCharacters = atob(pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Relatorio-Vendas.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                toast({ title: "PDF Gerado!", description: "O download do relatório foi iniciado." });

            } catch (error) {
                console.error("Erro ao gerar PDF: ", error);
                toast({ variant: 'destructive', title: "Erro", description: "Não foi possível gerar o PDF. Verifique o console." });
            }
        }
        
        setIsExporting(false);
    };

    const handleEditPayment = (payment: PaymentCLT) => {
        setEditingPayment(payment);
        setIsEditPaymentOpen(true);
    };

    const handleUpdatePayment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingPayment) return;

        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const employeeId = formData.get('employee') as string;
        const employeeName = users.find(u => u.id === employeeId)?.name || 'N/A';

        const updatedData: Partial<PaymentCLT> = {
            employee: employeeName,
            type: formData.get('type') as PaymentCLT['type'],
            amount: parseFloat(formData.get('amount') as string),
            paymentDate: formData.get('paymentDate') as string,
            status: formData.get('status') as PaymentCLT['status'],
        };
        
        try {
            await updatePayment(editingPayment.id, updatedData);
            await loadData(); // Recarrega todos os dados
            toast({ title: "Sucesso!", description: "Pagamento atualizado." });
            setIsEditPaymentOpen(false);
            setEditingPayment(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o pagamento." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeletePayment = async () => {
        if (!editingPayment) return;
        
        try {
            await deletePayment(editingPayment.id);
            await loadData();
            toast({ title: "Sucesso!", description: "Lançamento de pagamento excluído." });
            setIsDeletePaymentOpen(false);
            setIsEditPaymentOpen(false);
            setEditingPayment(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o pagamento." });
        }
    };
    
    const handleTeamClick = (teamName: string) => {
        const teamData = teams.find(t => t.name === teamName);
        if (!teamData) return;

        const teamMembers = users.filter(u => teamData.memberIds.includes(u.id));
        const memberPerformance = teamMembers.map(member => {
            const memberDeals = filteredNegotiations.filter(neg => neg.salespersonId === member.id && neg.stage === 'Venda Concluída');
            return {
                id: member.id,
                name: member.name,
                deals: memberDeals.length,
                revenue: memberDeals.reduce((sum, deal) => sum + deal.value, 0)
            };
        }).sort((a,b) => b.revenue - a.revenue);

        setSelectedTeamDetails({
            name: teamName,
            members: memberPerformance,
            totalRevenue: memberPerformance.reduce((sum, m) => sum + m.revenue, 0),
            totalDeals: memberPerformance.reduce((sum, m) => sum + m.deals, 0)
        });
        setIsTeamDetailOpen(true);
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Relatórios & Análises</h1>
                    <p className="text-muted-foreground">Analise o desempenho com relatórios e visualizações detalhadas.</p>
                </div>
                <div className="flex items-center gap-2">
                     <Button onClick={handleAiAnalysis} variant="outline" disabled={isAiAnalysisLoading || isExporting}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isAiAnalysisLoading ? 'Analisando...' : 'Analisar com IA'}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={isExporting}>
                                <FileDown className="mr-2 h-4 w-4" />
                                {isExporting ? 'Exportando...' : 'Exportar'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>Exportar para CSV</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')}>Exportar para PDF</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
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
                         {(activeTab === 'expenses' || activeTab === 'payments') && (
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-medium mb-2">Filtros Financeiros</h3>
                                <div className="flex items-center gap-2">
                                     {activeTab === 'expenses' && (
                                         <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                                            <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                                <SelectValue placeholder="Categoria da Despesa" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                                <SelectItem value="Fixa">Fixa</SelectItem>
                                                <SelectItem value="Variável">Variável</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {activeTab === 'payments' && (
                                         <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                                            <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                                <SelectValue placeholder="Tipo de Pagamento" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos os Tipos</SelectItem>
                                                <SelectItem value="Salário">Salário</SelectItem>
                                                <SelectItem value="13º Salário">13º Salário</SelectItem>
                                                <SelectItem value="Férias">Férias</SelectItem>
                                                <SelectItem value="Impostos">Impostos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>

             {(isAiAnalysisLoading || aiInsights) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="text-primary h-5 w-5" />
                            Análise da Inteligência Artificial
                        </CardTitle>
                        <CardDescription>
                            Um resumo inteligente e insights gerados com base nos filtros atuais.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isAiAnalysisLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                                <br/>
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ) : aiInsights ? (
                             <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{aiInsights.summary}</AlertTitle>
                                <AlertDescription className="mt-4 space-y-2">
                                     <div>
                                        <h3 className="font-semibold">Destaques:</h3>
                                        <p className="whitespace-pre-wrap">{aiInsights.highlights}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Sugestões:</h3>
                                        <p className="whitespace-pre-wrap">{aiInsights.suggestions}</p>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ) : null}
                    </CardContent>
                </Card>
            )}

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
                                                    key={item.id} 
                                                    onClick={() => handleRealtorClick(item.id)}
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
                                        <TableRow key={team.name} onClick={() => handleTeamClick(team.name)} className="transition-all duration-200 hover:bg-secondary cursor-pointer">
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
                                        <TableRow key={payment.id} onClick={() => handleEditPayment(payment)} className="cursor-pointer">
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
            
            <Dialog open={isTeamDetailOpen} onOpenChange={setIsTeamDetailOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Equipe: {selectedTeamDetails?.name}</DialogTitle>
                        <DialogDescription>
                            Performance individual dos membros da equipe com base nos filtros atuais.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Membro</TableHead>
                                    <TableHead className="text-right">Negócios</TableHead>
                                    <TableHead className="text-right">Receita</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedTeamDetails?.members.map((member: any) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell className="text-right">{member.deals}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(member.revenue)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                             <TableFooter>
                                <TableRow>
                                    <TableCell className="font-bold">Total da Equipe</TableCell>
                                    <TableCell className="text-right font-bold">{selectedTeamDetails?.totalDeals}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(selectedTeamDetails?.totalRevenue)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                     <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTeamDetailOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {editingPayment && (
                <Dialog open={isEditPaymentOpen} onOpenChange={setIsEditPaymentOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Lançamento de Pagamento</DialogTitle>
                            <DialogDescription>Atualize os detalhes do pagamento para {editingPayment.employee}.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdatePayment}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employee">Colaborador</Label>
                                    <Select name="employee" required defaultValue={users.find(u => u.name === editingPayment.employee)?.id}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipo de Pagamento</Label>
                                    <Select name="type" required defaultValue={editingPayment.type}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Salário">Salário</SelectItem>
                                            <SelectItem value="13º Salário">13º Salário</SelectItem>
                                            <SelectItem value="Férias">Férias</SelectItem>
                                            <SelectItem value="Impostos">Impostos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount_payment">Valor (R$)</Label>
                                    <Input id="amount_payment" name="amount" type="number" step="0.01" min="0.01" required defaultValue={editingPayment.amount} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="paymentDate_payment">Data de Pagamento</Label>
                                    <Input id="paymentDate_payment" name="paymentDate" type="date" required defaultValue={editingPayment.paymentDate} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status_payment">Status</Label>
                                    <Select name="status" defaultValue={editingPayment.status} required>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Agendado">Agendado</SelectItem>
                                            <SelectItem value="Pago">Pago</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter className="justify-between">
                                <Button type="button" variant="destructive" onClick={() => setIsDeletePaymentOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </Button>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsEditPaymentOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar Alterações"}</Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
            
            <AlertDialog open={isDeletePaymentOpen} onOpenChange={setIsDeletePaymentOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o lançamento de pagamento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePayment} className={cn(buttonVariants({ variant: "destructive" }))}>
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

