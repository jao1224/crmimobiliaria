
"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Trash2, Upload, User, DollarSign, Percent, Plus, MinusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProfileContext } from "@/contexts/ProfileContext";
import type { UserProfile } from "../layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCommissions, type Commission, addCommission, getPayments, addPayment, type PaymentCLT, getExpenses, addExpense, type Expense, getNegotiations, type Negotiation, updateCommission, getUsers, type User as AppUser, updatePayment, deletePayment, type CommissionSplit } from "@/lib/data";
import { cn } from "@/lib/utils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";


const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

const financePermissions: UserProfile[] = ['Admin', 'Imobiliária', 'Financeiro'];

const isExpenseOverdue = (expense: Expense) => {
    return new Date(expense.dueDate) < new Date() && expense.status === 'Pendente';
};

const CommissionCalculator = () => {
    const [totalCommission, setTotalCommission] = useState<number>(0);
    const [commissionNote, setCommissionNote] = useState<string>('');
    const [notePercentage, setNotePercentage] = useState<number>(0);
    
    const [divisions, setDivisions] = useState<{ role: string; value: number }[]>([
        { role: 'IMOB', value: 0 },
        { role: 'Captador', value: 0 },
        { role: 'Corretor', value: 0 },
        { role: 'Gerente', value: 0 },
    ]);

    const [advances, setAdvances] = useState<{ date: string; value: number; paid: boolean }[]>([
        { date: '', value: 0, paid: false },
    ]);
    
    const [bonuses, setBonuses] = useState<{ role: string; value: number }[]>([
         { role: 'IMOB', value: 0 },
         { role: 'Corretor', value: 0 },
    ]);
    
    const [observations, setObservations] = useState<string>('');
    
    const handleAddDivision = () => {
        setDivisions([...divisions, { role: 'Novo Papel', value: 0 }]);
    };
    
    const handleRemoveDivision = (index: number) => {
        setDivisions(divisions.filter((_, i) => i !== index));
    };

    const handleDivisionChange = (index: number, field: 'role' | 'value', value: string | number) => {
        const newDivisions = [...divisions];
        (newDivisions[index] as any)[field] = value;
        setDivisions(newDivisions);
    };
    
    const handleAddAdvance = () => {
        setAdvances([...advances, { date: '', value: 0, paid: false }]);
    };

    const handleRemoveAdvance = (index: number) => {
        setAdvances(advances.filter((_, i) => i !== index));
    };

    const handleAdvanceChange = (index: number, field: 'date' | 'value' | 'paid', value: string | number | boolean) => {
        const newAdvances = [...advances];
        (newAdvances[index] as any)[field] = value;
        setAdvances(newAdvances);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Calculadora de Comissão Detalhada</CardTitle>
                <CardDescription>
                    Use esta ferramenta para detalhar a divisão, adiantamentos e bônus de uma comissão específica.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg space-y-4">
                     <h3 className="font-semibold text-lg">Valores Gerais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="total-commission">Valor Total da Comissão</Label>
                            <Input id="total-commission" type="number" placeholder="25000" value={totalCommission} onChange={(e) => setTotalCommission(Number(e.target.value))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="commission-note">NF - Nota</Label>
                            <Input id="commission-note" placeholder="Número ou observação da nota" value={commissionNote} onChange={(e) => setCommissionNote(e.target.value)}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="note-percentage">Imposto da Nota (%)</Label>
                             <Input id="note-percentage" type="number" placeholder="6" value={notePercentage} onChange={(e) => setNotePercentage(Number(e.target.value))} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Divisão da Comissão</h3>
                            <Button variant="outline" size="sm" onClick={handleAddDivision}><Plus className="mr-2 h-4 w-4"/> Adicionar</Button>
                        </div>
                        <div className="space-y-3">
                            {divisions.map((division, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input value={division.role} onChange={(e) => handleDivisionChange(index, 'role', e.target.value)} className="w-1/3" />
                                    <div className="relative flex-grow">
                                         <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                         <Input type="number" value={division.value} onChange={(e) => handleDivisionChange(index, 'value', Number(e.target.value))} className="pl-7" />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveDivision(index)} className="text-destructive">
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                         <Separator/>
                        <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                             <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg">Bônus</h3>
                             </div>
                             {bonuses.map((bonus, index) => (
                                 <div key={index} className="flex items-center gap-2">
                                     <Input value={bonus.role} readOnly className="w-1/3 bg-background font-medium"/>
                                     <div className="relative flex-grow">
                                        <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input type="number" value={bonus.value} onChange={(e) => {
                                            const newBonuses = [...bonuses];
                                            newBonuses[index].value = Number(e.target.value);
                                            setBonuses(newBonuses);
                                        }} className="pl-7" />
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Adiantamentos</h3>
                            <Button variant="outline" size="sm" onClick={handleAddAdvance}><Plus className="mr-2 h-4 w-4"/> Adicionar</Button>
                        </div>
                         <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {advances.map((advance, index) => (
                                <div key={index} className="flex items-center gap-2">
                                     <Input type="date" value={advance.date} onChange={(e) => handleAdvanceChange(index, 'date', e.target.value)} className="w-1/3" />
                                     <div className="relative flex-grow">
                                         <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                         <Input type="number" value={advance.value} onChange={(e) => handleAdvanceChange(index, 'value', Number(e.target.value))} className="pl-7" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id={`paid-${index}`} checked={advance.paid} onCheckedChange={(checked) => handleAdvanceChange(index, 'paid', !!checked)} />
                                        <Label htmlFor={`paid-${index}`}>Pago</Label>
                                    </div>
                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveAdvance(index)} className="text-destructive">
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                         <div className="space-y-2 border-t pt-4">
                             <Label htmlFor="observations">Observações (Parcelamento / Acordo)</Label>
                             <Textarea id="observations" placeholder="Descreva os termos do pagamento..." value={observations} onChange={(e) => setObservations(e.target.value)} />
                         </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button>Salvar Detalhes da Comissão</Button>
            </CardFooter>
        </Card>
    );
};


export default function FinancePage() {
    const { activeProfile } = useContext(ProfileContext);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

    // Estados para Comissões
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [isCommissionDialogOpen, setCommissionDialogOpen] = useState(false);
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
    
    // Estados para Edição de Comissão
    const [isEditCommissionDialogOpen, setEditCommissionDialogOpen] = useState(false);
    const [editingCommission, setEditingCommission] = useState<Commission | null>(null);


    // Estados para Pagamentos CLT
    const [payments, setPayments] = useState<PaymentCLT[]>([]);
    const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentCLT | null>(null);
    const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);
    const [isDeletePaymentOpen, setIsDeletePaymentOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);


    // Estados para Despesas
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isExpenseDialogOpen, setExpenseDialogOpen] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);

    const { toast } = useToast();
    
    const hasPermission = useMemo(() => {
        return financePermissions.includes(activeProfile);
    }, [activeProfile]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user as any);
        });
        return () => unsubscribe();
    }, []);

    // Carrega dados iniciais
    useEffect(() => {
        if (currentUser !== undefined) { // Garante que a verificação do usuário já ocorreu
            refreshFinanceData();
            const fetchAuxData = async () => {
                const [negs, usersData] = await Promise.all([
                    getNegotiations(),
                    getUsers(),
                ]);
                // Filtra para negociações que podem gerar comissão
                setNegotiations(negs.filter(n => n.status === 'Finalizado' || n.stage === 'Venda Concluída'));
                setAllUsers(usersData);
            };
            fetchAuxData();
        }
    }, [currentUser]);

    const refreshFinanceData = async () => {
        setIsLoading(true);
        try {
            const [commData, payData, expData] = await Promise.all([
                getCommissions(),
                getPayments(),
                getExpenses(),
            ]);
            setCommissions(commData);
            setPayments(payData);
            setExpenses(expData);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao carregar dados financeiros."});
        } finally {
            setIsLoading(false);
        }
    };

    // Lógica de Comissões
    const visibleCommissions = useMemo(() => {
        if (!currentUser) return [];
        if (hasPermission) return commissions;

        return commissions.filter(c => {
            const isSalesperson = c.salespersonName === currentUser.displayName;
            const isRealtor = c.realtorName === currentUser.displayName;
            const isClient = c.clientName === currentUser.displayName; // Para o investidor que é o cliente

            if (activeProfile === 'Corretor Autônomo') return isSalesperson || isRealtor;
            if (activeProfile === 'Investidor') return isClient; // Investidor vê comissões/custos de seus negócios

            return false;
        });
    }, [commissions, activeProfile, hasPermission, currentUser]);

    const totalCommission = visibleCommissions.reduce((sum, item) => sum + item.commissionValue, 0);
    const paidCommission = visibleCommissions.filter(c => c.status === 'Pago').reduce((sum, item) => sum + item.commissionValue, 0);
    const pendingCommission = totalCommission - paidCommission;
    
    const handleStatusChange = async (commissionId: string, newStatus: Commission['status']) => {
        try {
            await updateDoc(doc(db, "comissoes", commissionId), { status: newStatus });
            await refreshFinanceData();
            toast({ title: "Status Atualizado!", description: `A comissão foi marcada como ${newStatus}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível atualizar o status da comissão."});
        }
    };
    
    const handleAddCommission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const negotiationId = formData.get('negotiationId') as string;
        const negotiation = negotiations.find(n => n.id === negotiationId);

        if (!negotiation) {
            toast({ variant: 'destructive', title: "Erro", description: "Negociação selecionada é inválida." });
            return;
        }

        const newCommissionData: Omit<Commission, 'id'> = {
            negotiationId: negotiation.id,
            propertyValue: negotiation.value,
            clientName: negotiation.client,
            realtorName: negotiation.realtor,
            salespersonName: negotiation.salesperson,
            commissionValue: parseFloat(formData.get('commissionValue') as string),
            commissionRate: parseFloat(formData.get('commissionRate') as string),
            status: formData.get('status') as Commission['status'], 
            paymentDate: formData.get('paymentDate') as string,
        };
        
        const managerName = formData.get('managerName') as string;
        if (managerName) newCommissionData.managerName = managerName;
        
        const clientSignal = parseFloat(formData.get('clientSignal') as string);
        if (!isNaN(clientSignal)) newCommissionData.clientSignal = clientSignal;
        
        const notes = formData.get('notes') as string;
        if (notes) newCommissionData.notes = notes;


        await addCommission(newCommissionData);
        await refreshFinanceData();
        toast({ title: "Sucesso!", description: "Comissão lançada com sucesso." });
        form.reset();
        setSelectedNegotiation(null);
        setCommissionDialogOpen(false);
    };

    const handleEditCommission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingCommission) return;

        const formData = new FormData(event.currentTarget);

        const updatedData: Partial<Commission> = {
            managerName: formData.get('managerName') as string,
            clientSignal: parseFloat(formData.get('clientSignal') as string),
            commissionValue: parseFloat(formData.get('commissionValue') as string),
            commissionRate: parseFloat(formData.get('commissionRate') as string),
            status: formData.get('status') as Commission['status'],
            paymentDate: formData.get('paymentDate') as string,
            notes: formData.get('notes') as string,
        };

        await updateCommission(editingCommission.id, updatedData);
        await refreshFinanceData();
        toast({ title: "Sucesso!", description: "Comissão atualizada com sucesso." });
        setEditCommissionDialogOpen(false);
        setEditingCommission(null);
    };


    const handleAddPayment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const employeeId = formData.get('employee') as string;
        const employeeName = allUsers.find(u => u.id === employeeId)?.name || 'N/A';
        
        const newPaymentData: Omit<PaymentCLT, 'id'> = {
            employee: employeeName,
            type: formData.get('type') as PaymentCLT['type'],
            amount: parseFloat(formData.get('amount') as string),
            paymentDate: formData.get('paymentDate') as string,
            status: formData.get('status') as PaymentCLT['status'],
        };
        await addPayment(newPaymentData);
        await refreshFinanceData();
        toast({ title: "Sucesso!", description: "Pagamento lançado com sucesso." });
        form.reset();
        setPaymentDialogOpen(false);
    };

    const handleAddExpense = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const newExpenseData: Omit<Expense, 'id'> = {
            description: formData.get('description') as string,
            category: formData.get('category') as Expense['category'],
            amount: parseFloat(formData.get('amount') as string),
            dueDate: formData.get('dueDate') as string,
            status: formData.get('status') as Expense['status'],
        };
        await addExpense(newExpenseData);
        await refreshFinanceData();
        toast({ title: "Sucesso!", description: "Despesa lançada com sucesso." });
        form.reset();
        setExpenseDialogOpen(false);
    };
    
    const handleNegotiationSelect = (negotiationId: string) => {
        const negotiation = negotiations.find(n => n.id === negotiationId);
        if (negotiation) {
            setSelectedNegotiation(negotiation);
        }
    };
    
    const handleOpenEditDialog = (commission: Commission) => {
        setEditingCommission(commission);
        setEditCommissionDialogOpen(true);
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
        const employeeName = allUsers.find(u => u.id === employeeId)?.name || 'N/A';

        const updatedData: Partial<PaymentCLT> = {
            employee: employeeName,
            type: formData.get('type') as PaymentCLT['type'],
            amount: parseFloat(formData.get('amount') as string),
            paymentDate: formData.get('paymentDate') as string,
            status: formData.get('status') as PaymentCLT['status'],
        };
        
        try {
            await updatePayment(editingPayment.id, updatedData);
            await refreshFinanceData();
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
            await refreshFinanceData();
            toast({ title: "Sucesso!", description: "Lançamento de pagamento excluído." });
            setIsDeletePaymentOpen(false);
            setIsEditPaymentOpen(false);
            setEditingPayment(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o pagamento." });
        }
    };
    
    const handlePaymentStatusChange = async (paymentId: string, newStatus: PaymentCLT['status']) => {
        try {
            await updatePayment(paymentId, { status: newStatus });
            await refreshFinanceData();
            toast({ title: "Status Atualizado!", description: `O pagamento foi marcado como ${newStatus}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível atualizar o status do pagamento."});
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Visão Geral Financeira</h1>
                <p className="text-muted-foreground">Acompanhe comissões, pagamentos, despesas e o desempenho financeiro.</p>
            </div>

            <Tabs defaultValue="commissions">
                <TabsList>
                    <TabsTrigger value="commissions">Comissões</TabsTrigger>
                    {hasPermission && <TabsTrigger value="salary_commissions">Salário e Comissões</TabsTrigger>}
                    {hasPermission && <TabsTrigger value="payments">Pagamentos (CLT)</TabsTrigger>}
                    {hasPermission && <TabsTrigger value="expenses">Despesas</TabsTrigger>}
                </TabsList>
                
                {/* Aba de Comissões */}
                <TabsContent value="commissions">
                    <div className="flex flex-col gap-4 mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Resumo de Comissões</CardTitle>
                                    <CardDescription>
                                        Visão geral de todas as comissões registradas.
                                    </CardDescription>
                                </div>
                                {hasPermission && (
                                    <Dialog open={isCommissionDialogOpen} onOpenChange={(isOpen) => {
                                        setCommissionDialogOpen(isOpen);
                                        if (!isOpen) setSelectedNegotiation(null);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button><PlusCircle className="mr-2 h-4 w-4" />Lançar Comissão</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>Lançar Nova Comissão</DialogTitle>
                                                <DialogDescription>Preencha os detalhes para registrar uma nova comissão de um negócio concluído.</DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleAddCommission} key={selectedNegotiation?.id}>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="negotiationId">Cód. do Processo</Label>
                                                        <Select name="negotiationId" required onValueChange={handleNegotiationSelect}>
                                                            <SelectTrigger><SelectValue placeholder="Selecione um processo concluído"/></SelectTrigger>
                                                            <SelectContent>
                                                                {negotiations.map(n => (
                                                                    <SelectItem key={n.id} value={n.id}>
                                                                        {n.property} ({n.id.toUpperCase().substring(0,6)})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Valor do Imóvel</Label>
                                                            <Input value={selectedNegotiation ? formatCurrency(selectedNegotiation.value) : ''} readOnly placeholder="Selecione um processo"/>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="clientSignal">Sinal do Cliente (R$)</Label>
                                                            <Input id="clientSignal" name="clientSignal" type="number" step="0.01" min="0" placeholder="Opcional" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="managerName">Gerente</Label>
                                                            <Input id="managerName" name="managerName" placeholder="Nome do gerente (opcional)" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Captador</Label>
                                                            <Input value={selectedNegotiation?.realtor || ''} readOnly placeholder="Selecione um processo" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Vendedor</Label>
                                                            <Input value={selectedNegotiation?.salesperson || ''} readOnly placeholder="Selecione um processo" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="commissionRate">Taxa de Comissão (%)</Label>
                                                            <Input id="commissionRate" name="commissionRate" type="number" step="0.1" min="0" required defaultValue={selectedNegotiation ? 5 : ''}/>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="commissionValue">Valor da Comissão (R$)</Label>
                                                            <Input id="commissionValue" name="commissionValue" type="number" step="0.01" min="0.01" required defaultValue={selectedNegotiation ? (selectedNegotiation.value * 0.05).toFixed(2) : ''}/>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="paymentDate">Data de Pagamento</Label>
                                                            <Input id="paymentDate" name="paymentDate" type="date" required />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="status">Status</Label>
                                                            <Select name="status" defaultValue="Pendente" required>
                                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                                                    <SelectItem value="Pago">Pago</SelectItem>
                                                                    <SelectItem value="Vencido">Vencido</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="notes">Observações</Label>
                                                        <Textarea id="notes" name="notes" placeholder="Detalhes sobre a divisão, adiantamentos, etc." />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setCommissionDialogOpen(false)}>Cancelar</Button>
                                                    <Button type="submit">Salvar Comissão</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                                        <CardHeader><CardTitle>Comissão Total</CardTitle></CardHeader>
                                        <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>}</CardContent>
                                    </Card>
                                    <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                                        <CardHeader><CardTitle>Total Pago</CardTitle></CardHeader>
                                        <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-2xl font-bold">{formatCurrency(paidCommission)}</p>}</CardContent>
                                    </Card>
                                    <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                                        <CardHeader><CardTitle>Pendente & Vencido</CardTitle></CardHeader>
                                        <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-2xl font-bold">{formatCurrency(pendingCommission)}</p>}</CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhamento de Comissões</CardTitle>
                                <CardDescription>{hasPermission ? "Visão completa de todas as comissões registradas." : "Visão geral das suas comissões a receber."}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Imóvel</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            {hasPermission && <TableHead>Captador</TableHead>}
                                            {hasPermission && <TableHead>Vendedor</TableHead>}
                                            <TableHead>Valor Comissão</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Data Pag.</TableHead>
                                            <TableHead><span className="sr-only">Ações</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell colSpan={hasPermission ? 8 : 5}><Skeleton className="h-8 w-full" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : visibleCommissions.length > 0 ? (
                                            visibleCommissions.map(commission => (
                                                <TableRow key={commission.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                                    <TableCell>
                                                        <div className="font-medium">{commission.propertyName || "Imóvel não encontrado"}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{commission.propertyDisplayCode || commission.processoDisplayCode}</div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{commission.clientName}</TableCell>
                                                    {hasPermission && <TableCell>{commission.realtorName}</TableCell>}
                                                    {hasPermission && <TableCell>{commission.salespersonName}</TableCell>}
                                                    <TableCell>{formatCurrency(commission.commissionValue)}</TableCell>
                                                    <TableCell><Badge variant={commission.status === 'Pago' ? 'success' : commission.status === 'Pendente' ? 'status-orange' : 'destructive'}>{commission.status}</Badge></TableCell>
                                                    <TableCell>{new Date(commission.paymentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                                    <TableCell>
                                                        {hasPermission && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(commission)}>Editar Comissão</DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Pago')}>Marcar como Pago</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Pendente')}>Marcar como Pendente</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Vencido')}>Marcar como Vencido</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : <TableRow><TableCell colSpan={hasPermission ? 8 : 5} className="h-24 text-center">Nenhuma comissão encontrada.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
                {/* Aba de Salário e Comissões Detalhadas */}
                {hasPermission && (
                <TabsContent value="salary_commissions" className="mt-4">
                    <CommissionCalculator />
                </TabsContent>
                )}


                {/* Aba de Pagamentos (CLT) */}
                 {hasPermission && (<TabsContent value="payments">
                     <Card className="mt-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Gestão de Pagamentos (CLT)</CardTitle>
                                <CardDescription>Registre salários, impostos e outros pagamentos da equipe.</CardDescription>
                            </div>
                            <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Lançar Pagamento</Button></DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Novo Lançamento de Pagamento</DialogTitle>
                                        <DialogDescription>Preencha os detalhes para registrar um pagamento.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddPayment}>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="employee">Colaborador</Label>
                                                <Select name="employee" required>
                                                    <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                                                    <SelectContent>
                                                        {allUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="type">Tipo de Pagamento</Label>
                                                <Select name="type" required>
                                                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
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
                                                <Input id="amount_payment" name="amount" type="number" step="0.01" min="0.01" required />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="paymentDate_payment">Data de Pagamento</Label>
                                                <Input id="paymentDate_payment" name="paymentDate" type="date" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="status_payment">Status</Label>
                                                <Select name="status" defaultValue="Agendado" required>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Agendado">Agendado</SelectItem>
                                                        <SelectItem value="Pago">Pago</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
                                            <Button type="submit">Lançar Pagamento</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Colaborador</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                         Array.from({ length: 2 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : payments.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.employee}</TableCell>
                                            <TableCell>{p.type}</TableCell>
                                            <TableCell>{formatCurrency(p.amount)}</TableCell>
                                            <TableCell>{new Date(p.paymentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                            <TableCell><Badge variant={p.status === 'Pago' ? 'success' : 'secondary'}>{p.status}</Badge></TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => handleEditPayment(p)}>Editar</DropdownMenuItem>
                                                        {p.status !== 'Pago' && (
                                                            <DropdownMenuItem onSelect={() => handlePaymentStatusChange(p.id, 'Pago')}>
                                                                Marcar como Pago
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem 
                                                            className="text-destructive focus:text-destructive" 
                                                            onClick={() => {
                                                                setEditingPayment(p);
                                                                setIsDeletePaymentOpen(true);
                                                            }}
                                                        >
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>)}

                {/* Aba de Despesas */}
                {hasPermission && (<TabsContent value="expenses">
                    <Card className="mt-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                             <div>
                                <CardTitle>Gestão de Despesas</CardTitle>
                                <CardDescription>Controle as despesas fixas e variáveis da imobiliária.</CardDescription>
                            </div>
                            <Dialog open={isExpenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Lançar Despesa</Button></DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Lançar Nova Despesa</DialogTitle>
                                        <DialogDescription>Preencha os detalhes para registrar uma despesa.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddExpense}>
                                        <div className="grid gap-4 py-4">
                                             <div className="space-y-2">
                                                <Label htmlFor="description">Descrição</Label>
                                                <Input id="description" name="description" placeholder="Ex: Conta de Energia" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="category">Categoria</Label>
                                                <Select name="category" required>
                                                    <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Fixa">Fixa</SelectItem>
                                                        <SelectItem value="Variável">Variável</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="amount_expense">Valor (R$)</Label>
                                                <Input id="amount_expense" name="amount" type="number" step="0.01" min="0.01" required />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="dueDate">Data de Vencimento</Label>
                                                <Input id="dueDate" name="dueDate" type="date" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="status_expense">Status</Label>
                                                <Select name="status" defaultValue="Pendente" required>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                                        <SelectItem value="Pago">Pago</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancelar</Button>
                                            <Button type="submit">Lançar Despesa</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : expenses.map(e => (
                                        <TableRow key={e.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                            <TableCell className="font-medium">{e.description}</TableCell>
                                            <TableCell>{e.category}</TableCell>
                                            <TableCell>{new Date(e.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                            <TableCell>
                                                <Badge variant={e.status === 'Pago' ? 'success' : isExpenseOverdue(e) ? 'destructive' : 'status-orange'}>
                                                    {e.status === 'Pendente' && isExpenseOverdue(e) ? 'Vencido' : e.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>)}
            </Tabs>

             {/* Modal de Edição de Comissão */}
            <Dialog open={isEditCommissionDialogOpen} onOpenChange={(isOpen) => {
                setEditCommissionDialogOpen(isOpen);
                if (!isOpen) setEditingCommission(null);
            }}>
                {editingCommission && (
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Editar Comissão</DialogTitle>
                            <DialogDescription>
                                Atualize os detalhes da comissão para a negociação ID: 
                                <span className="font-mono text-sm ml-1">{editingCommission.negotiationId.toUpperCase()}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditCommission} key={editingCommission.id}>
                            <div className="grid gap-4 py-4">
                                <div className="p-4 border rounded-md bg-muted/50">
                                    <h4 className="font-semibold mb-2">Resumo do Negócio</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                        <div><span className="text-muted-foreground">Cliente:</span> {editingCommission.clientName}</div>
                                        <div><span className="text-muted-foreground">Captador:</span> {editingCommission.realtorName}</div>
                                        <div><span className="text-muted-foreground">Vendedor:</span> {editingCommission.salespersonName}</div>
                                        <div><span className="text-muted-foreground">Valor Imóvel:</span> {formatCurrency(editingCommission.propertyValue)}</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="edit_managerName">Gerente</Label>
                                        <Input id="edit_managerName" name="managerName" defaultValue={editingCommission.managerName} placeholder="Nome do gerente (opcional)" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_clientSignal">Sinal do Cliente (R$)</Label>
                                        <Input id="edit_clientSignal" name="clientSignal" type="number" step="0.01" min="0" defaultValue={editingCommission.clientSignal} placeholder="Opcional" />
                                    </div>
                                </div>
                                
                                <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="edit_commissionRate">Taxa de Comissão (%)</Label>
                                        <Input id="edit_commissionRate" name="commissionRate" type="number" step="0.1" min="0" required defaultValue={editingCommission.commissionRate}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_commissionValue">Valor da Comissão (R$)</Label>
                                        <Input id="edit_commissionValue" name="commissionValue" type="number" step="0.01" min="0.01" required defaultValue={editingCommission.commissionValue}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_paymentDate">Data de Pagamento</Label>
                                        <Input id="edit_paymentDate" name="paymentDate" type="date" required defaultValue={editingCommission.paymentDate} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_status">Status</Label>
                                        <Select name="status" defaultValue={editingCommission.status} required>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pendente">Pendente</SelectItem>
                                                <SelectItem value="Pago">Pago</SelectItem>
                                                <SelectItem value="Vencido">Vencido</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                 <div className="space-y-2">
                                    <Label htmlFor="edit_notes">Observações</Label>
                                    <Textarea id="edit_notes" name="notes" defaultValue={editingCommission.notes} placeholder="Detalhes sobre a divisão, adiantamentos, etc." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditCommissionDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit">Salvar Alterações</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                )}
            </Dialog>

            {/* Modal de Edição de Pagamento */}
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
                                    <Select name="employee" required defaultValue={allUsers.find(u => u.name === editingPayment.employee)?.id}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {allUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
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
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditPaymentOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar Alterações"}</Button>
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
                        <AlertDialogCancel onClick={() => setIsDeletePaymentOpen(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePayment} className={cn(buttonVariants({ variant: "destructive" }))}>
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
