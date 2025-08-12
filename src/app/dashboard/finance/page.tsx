import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "../layout";

const commissions = [
    { id: 'C001', deal: 'Venda da Casa Greenfield', amount: 24000, status: 'Pago', paymentDate: '15/06/2024' },
    { id: 'C002', deal: 'Aluguel do Loft no Centro', amount: 1200, status: 'Pago', paymentDate: '20/06/2024' },
    { id: 'C003', deal: 'Venda da Vila Lakeside', amount: 75000, status: 'Pendente', paymentDate: '30/07/2024' },
    { id: 'C004', deal: 'Venda do Apartamento Sunnyvale', amount: 18750, status: 'Vencido', paymentDate: '10/08/2024' },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

export default function FinancePage({ activeProfile }: { activeProfile?: UserProfile }) {
    const totalCommission = commissions.reduce((sum, item) => sum + item.amount, 0);
    const paidCommission = commissions.filter(c => c.status === 'Pago').reduce((sum, item) => sum + item.amount, 0);
    const pendingCommission = totalCommission - paidCommission;

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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
