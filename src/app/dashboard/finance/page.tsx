
"use client";

import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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


type Commission = {
    id: string;
    deal: string;
    amount: number;
    status: 'Pago' | 'Pendente' | 'Vencido';
    paymentDate: string;
    involved: string; // Quem recebe
    advance?: number; // Adiantamento
    invoiceFile?: File | null; // Nota fiscal
    realtorId: string; // ID do corretor para filtro
};

const initialCommissions: Commission[] = [
    { id: 'comm1', deal: 'Venda Apartamento Central', amount: 15000, status: 'Pendente', paymentDate: '2024-08-15', involved: 'Carlos Pereira (50%), Sofia Lima (50%)', realtorId: 'user1' },
    { id: 'comm2', deal: 'Venda Casa de Campo', amount: 22000, status: 'Pago', paymentDate: '2024-07-20', involved: 'Carlos Pereira (100%)', realtorId: 'user1' },
    { id: 'comm3', deal: 'Aluguel Sala Comercial', amount: 1200, status: 'Vencido', paymentDate: '2024-06-10', involved: 'Imobiliária (100%)', realtorId: 'user2' },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

const commissionLaunchPermissions: UserProfile[] = ['Admin', 'Imobiliária'];


export default function FinancePage() {
    const { activeProfile } = useContext(ProfileContext);
    const [commissions, setCommissions] = useState<Commission[]>(initialCommissions);
    const [isCommissionDialogOpen, setCommissionDialogOpen] = useState(false);
    const { toast } = useToast();

    // Filtra as comissões com base no perfil
    const visibleCommissions = commissions.filter(c => {
        if (commissionLaunchPermissions.includes(activeProfile)) {
            return true; // Admin e Imobiliária veem tudo
        }
        // Simulando que o Corretor Autônomo logado é o 'user1'
        if (activeProfile === 'Corretor Autônomo') {
            return c.realtorId === 'user1';
        }
        return false; // Outros perfis não veem comissões por padrão
    });

    const totalCommission = visibleCommissions.reduce((sum, item) => sum + item.amount, 0);
    const paidCommission = visibleCommissions.filter(c => c.status === 'Pago').reduce((sum, item) => sum + item.amount, 0);
    const pendingCommission = totalCommission - paidCommission;
    
    const handleStatusChange = (commissionId: string, newStatus: Commission['status']) => {
        setCommissions(prevCommissions => 
            prevCommissions.map(c => 
                c.id === commissionId ? { ...c, status: newStatus } : c
            )
        );
        toast({
            title: "Status Atualizado!",
            description: `A comissão foi marcada como ${newStatus}.`
        });
    };
    
    const handleAddCommission = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const newCommission: Commission = {
            id: `comm${Date.now()}`,
            deal: formData.get('deal') as string,
            amount: parseFloat(formData.get('amount') as string),
            status: formData.get('status') as Commission['status'],
            paymentDate: formData.get('paymentDate') as string,
            involved: formData.get('involved') as string,
            advance: formData.has('advance') ? parseFloat(formData.get('advance') as string) : undefined,
            invoiceFile: formData.get('invoiceFile') as File || null,
            realtorId: 'user1' // Simulado
        };

        setCommissions(prev => [newCommission, ...prev]);
        toast({ title: "Sucesso!", description: "Comissão lançada com sucesso (simulado)." });
        setCommissionDialogOpen(false);
    };

    const hasLaunchPermission = commissionLaunchPermissions.includes(activeProfile);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Visão Geral Financeira</h1>
                    <p className="text-muted-foreground">Acompanhe comissões, pagamentos e desempenho financeiro.</p>
                </div>
                 {hasLaunchPermission && (
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
                                            <Label htmlFor="deal">Negócio (ID ou Descrição)</Label>
                                            <Input id="deal" name="deal" required />
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
                                            <Input id="invoiceFile" name="invoiceFile" type="file" />
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
                <Card>
                    <CardHeader><CardTitle>Comissão Total</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total Pago</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(paidCommission)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Pendente & Vencido</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(pendingCommission)}</p></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento de Comissões</CardTitle>
                    <CardDescription>
                        {hasLaunchPermission 
                            ? "Visão completa de todas as comissões registradas."
                            : "Visão geral das suas comissões a receber."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Negócio</TableHead>
                                {hasLaunchPermission && <TableHead>Envolvidos</TableHead>}
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data de Pagamento</TableHead>
                                <TableHead><span className="sr-only">Ações</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {visibleCommissions.length > 0 ? (
                                visibleCommissions.map(commission => (
                                    <TableRow key={commission.id} className="hover:bg-secondary">
                                        <TableCell className="font-medium">{commission.deal}</TableCell>
                                        {hasLaunchPermission && <TableCell className="text-muted-foreground text-xs">{commission.involved}</TableCell>}
                                        <TableCell>{formatCurrency(commission.amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant={commission.status === 'Pago' ? 'success' : commission.status === 'Pendente' ? 'secondary' : 'destructive'}>
                                                {commission.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(commission.paymentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                        <TableCell>
                                            {hasLaunchPermission && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Pago')}>
                                                            Marcar como Pago
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Pendente')}>
                                                            Marcar como Pendente
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'Vencido')}>
                                                            Marcar como Vencido
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={hasLaunchPermission ? 6 : 5} className="h-24 text-center">Nenhuma comissão encontrada.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    