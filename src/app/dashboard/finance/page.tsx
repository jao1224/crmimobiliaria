
"use client";

import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Upload } from "lucide-react";
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
import { getCommissions, type Commission, addCommission, getPayments, addPayment, type PaymentCLT, getExpenses, addExpense, type Expense } from "@/lib/data";
import { cn } from "@/lib/utils";


const employees = ['Secretária Admin', 'Gerente de Vendas', 'Corretor A'];


const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

const financePermissions: UserProfile[] = ['Admin', 'Imobiliária', 'Financeiro'];

const isExpenseOverdue = (expense: Expense) => {
    return new Date(expense.dueDate) < new Date() && expense.status === 'Pendente';
};


export default function FinancePage() {
    const { activeProfile } = useContext(ProfileContext);
    const hasPermission = financePermissions.includes(activeProfile);

    // Estados para Comissões
    const [commissions, setCommissions] = useState<Commission[]>(getCommissions());
    const [isCommissionDialogOpen, setCommissionDialogOpen] = useState(false);

    // Estados para Pagamentos CLT
    const [payments, setPayments] = useState<PaymentCLT[]>(getPayments());
    const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);

    // Estados para Despesas
    const [expenses, setExpenses] = useState<Expense[]>(getExpenses());
    const [isExpenseDialogOpen, setExpenseDialogOpen] = useState(false);

    const { toast } = useToast();

    // Lógica de Comissões
    const visibleCommissions = commissions.filter(c => {
        if (hasPermission) return true;
        // Simulado: 'Carlos Pereira' é o Corretor Autônomo padrão para o exemplo
        if (activeProfile === 'Corretor Autônomo' && c.involved.includes('Carlos Pereira')) return true; 
        return false;
    });
    const totalCommission = visibleCommissions.reduce((sum, item) => sum + item.amount, 0);
    const paidCommission = visibleCommissions.filter(c => c.status === 'Pago').reduce((sum, item) => sum + item.amount, 0);
    const pendingCommission = totalCommission - paidCommission;
    
    const handleStatusChange = (commissionId: string, newStatus: Commission['status']) => {
        setCommissions(prev => prev.map(c => c.id === commissionId ? { ...c, status: newStatus } : c));
        toast({ title: "Status Atualizado!", description: `A comissão foi marcada como ${newStatus}.` });
    };
    
    const handleAddCommission = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newCommission: Commission = {
            id: `comm${Date.now()}`, 
            dealId: formData.get('dealId') as string,
            deal: formData.get('deal') as string, amount: parseFloat(formData.get('amount') as string),
            status: formData.get('status') as Commission['status'], paymentDate: formData.get('paymentDate') as string,
            involved: formData.get('involved') as string, advance: formData.has('advance') ? parseFloat(formData.get('advance') as string) : undefined,
            invoiceFile: formData.get('invoiceFile') as File || null, realtorId: 'user1' // Simulado
        };
        addCommission(newCommission);
        setCommissions(getCommissions());
        toast({ title: "Sucesso!", description: "Comissão lançada com sucesso." });
        setCommissionDialogOpen(false);
    };

    const handleAddPayment = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newPayment: PaymentCLT = {
            id: `pay${Date.now()}`,
            employee: formData.get('employee') as string,
            type: formData.get('type') as PaymentCLT['type'],
            amount: parseFloat(formData.get('amount') as string),
            paymentDate: formData.get('paymentDate') as string,
            status: formData.get('status') as PaymentCLT['status'],
        };
        addPayment(newPayment);
        setPayments(getPayments());
        toast({ title: "Sucesso!", description: "Pagamento lançado com sucesso." });
        setPaymentDialogOpen(false);
    };

    const handleAddExpense = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newExpense: Expense = {
            id: `exp${Date.now()}`,
            description: formData.get('description') as string,
            category: formData.get('category') as Expense['category'],
            amount: parseFloat(formData.get('amount') as string),
            dueDate: formData.get('dueDate') as string,
            status: formData.get('status') as Expense['status'],
        };
        addExpense(newExpense);
        setExpenses(getExpenses());
        toast({ title: "Sucesso!", description: "Despesa lançada com sucesso." });
        setExpenseDialogOpen(false);
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
                    {hasPermission && <TabsTrigger value="payments">Pagamentos (CLT)</TabsTrigger>}
                    {hasPermission && <TabsTrigger value="expenses">Despesas</TabsTrigger>}
                </TabsList>
                
                {/* Aba de Comissões */}
                <TabsContent value="commissions">
                    <div className="flex flex-col gap-4 mt-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Resumo de Comissões</h2>
                             {hasPermission && (
                                <Dialog open={isCommissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button><PlusCircle className="mr-2 h-4 w-4" />Lançar Comissão</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>Lançar Nova Comissão</DialogTitle>
                                            <DialogDescription>Preencha os detalhes para registrar uma nova comissão.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAddCommission}>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="dealId">Cód. do Processo</Label>
                                                        <Input id="dealId" name="dealId" required placeholder="Ex: neg1"/>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="deal">Descrição do Negócio</Label>
                                                        <Input id="deal" name="deal" required placeholder="Ex: Venda Apto Vista Mar"/>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="amount">Valor da Comissão (R$)</Label>
                                                        <Input id="amount" name="amount" type="number" step="0.01" required />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="involved">Envolvidos</Label>
                                                    <Textarea id="involved" name="involved" placeholder="Ex: Corretor A (50%), Corretor B (50%)" required />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="advance">Adiantamento (R$)</Label>
                                                        <Input id="advance" name="advance" type="number" step="0.01" placeholder="Opcional" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="invoiceFile">Nota Fiscal (Opcional)</Label>
                                                        <Input id="invoiceFile" name="invoiceFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit">Salvar Comissão</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                                <CardHeader><CardTitle>Comissão Total</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p></CardContent>
                            </Card>
                            <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                                <CardHeader><CardTitle>Total Pago</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">{formatCurrency(paidCommission)}</p></CardContent>
                            </Card>
                            <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                                <CardHeader><CardTitle>Pendente & Vencido</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">{formatCurrency(pendingCommission)}</p></CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhamento de Comissões</CardTitle>
                                <CardDescription>{hasPermission ? "Visão completa de todas as comissões registradas." : "Visão geral das suas comissões a receber."}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cód. Processo</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            {hasPermission && <TableHead>Envolvidos</TableHead>}
                                            <TableHead>Valor</TableHead><TableHead>Status</TableHead>
                                            <TableHead>Data de Pagamento</TableHead>
                                            <TableHead><span className="sr-only">Ações</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleCommissions.length > 0 ? (
                                            visibleCommissions.map(commission => (
                                                <TableRow key={commission.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">{commission.dealId.toUpperCase()}</TableCell>
                                                    <TableCell className="font-medium">{commission.deal}</TableCell>
                                                    {hasPermission && <TableCell className="text-muted-foreground text-xs">{commission.involved}</TableCell>}
                                                    <TableCell>{formatCurrency(commission.amount)}</TableCell>
                                                    <TableCell><Badge variant={commission.status === 'Pago' ? 'success' : commission.status === 'Pendente' ? 'status-orange' : 'destructive'}>{commission.status}</Badge></TableCell>
                                                    <TableCell>{new Date(commission.paymentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                                    <TableCell>
                                                        {hasPermission && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Pago')}>Marcar como Pago</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Pendente')}>Marcar como Pendente</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Vencido')}>Marcar como Vencido</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : <TableRow><TableCell colSpan={hasPermission ? 7 : 6} className="h-24 text-center">Nenhuma comissão encontrada.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

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
                                                        {employees.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
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
                                                <Input id="amount_payment" name="amount" type="number" step="0.01" required />
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
                                            <Button type="submit">Lançar Pagamento</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Colaborador</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map(p => (
                                        <TableRow key={p.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                            <TableCell className="font-medium">{p.employee}</TableCell>
                                            <TableCell>{p.type}</TableCell><TableCell>{formatCurrency(p.amount)}</TableCell>
                                            <TableCell>{new Date(p.paymentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                            <TableCell><Badge variant={p.status === 'Pago' ? 'success' : 'secondary'}>{p.status}</Badge></TableCell>
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
                                                <Input id="amount_expense" name="amount" type="number" step="0.01" required />
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
                                            <Button type="submit">Lançar Despesa</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map(e => (
                                        <TableRow key={e.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                            <TableCell className="font-medium">{e.description}</TableCell>
                                            <TableCell>{e.category}</TableCell>
                                            <TableCell>{formatCurrency(e.amount)}</TableCell>
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
        </div>
    );
}

    

    


