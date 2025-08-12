
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { initialNegotiations } from "@/app/dashboard/negotiations/page";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "../layout";

type Commission = {
    id: string;
    deal: string;
    amount: number;
    status: 'Pago' | 'Pendente' | 'Vencido';
    paymentDate: string;
};

// Gerar comissões dinamicamente a partir de negociações concluídas
const initialCommissions: Commission[] = initialNegotiations
    .filter(neg => neg.stage === "Contrato Gerado" || neg.stage === "Visita Agendada") // Simula negócios que geram comissão
    .map((neg, index) => ({
        id: `C${String(index + 1).padStart(3, '0')}`,
        deal: `Venda ${neg.property}`,
        amount: neg.value * (neg.commissionRate / 100),
        status: index % 3 === 0 ? 'Pago' : (index % 3 === 1 ? 'Pendente' : 'Vencido'), // Exemplo de status
        paymentDate: `1${index}/08/2024`, // Exemplo de data
    }));


const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

export default function FinancePage({ activeProfile }: { activeProfile?: UserProfile }) {
    const [commissions, setCommissions] = useState<Commission[]>(initialCommissions);
    const { toast } = useToast();

    const totalCommission = commissions.reduce((sum, item) => sum + item.amount, 0);
    const paidCommission = commissions.filter(c => c.status === 'Pago').reduce((sum, item) => sum + item.amount, 0);
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

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Visão Geral Financeira</h1>
                <p className="text-muted-foreground">Acompanhe comissões, pagamentos e desempenho financeiro.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Comissão Total (Ano)</CardTitle></CardHeader>
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
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Negócio</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data de Pagamento</TableHead>
                                <TableHead><span className="sr-only">Ações</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions.map(commission => (
                                <TableRow key={commission.id}>
                                    <TableCell className="font-medium">{commission.deal}</TableCell>
                                    <TableCell>{formatCurrency(commission.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant={commission.status === 'Pago' ? 'default' : commission.status === 'Pendente' ? 'secondary' : 'destructive'}>
                                            {commission.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{commission.paymentDate}</TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
