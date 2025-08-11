import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const commissions = [
    { id: 'C001', deal: 'Sale of Greenfield House', amount: 24000, status: 'Paid', paymentDate: '2024-06-15' },
    { id: 'C002', deal: 'Rental of Downtown Loft', amount: 1200, status: 'Paid', paymentDate: '2024-06-20' },
    { id: 'C003', deal: 'Sale of Lakeside Villa', amount: 75000, status: 'Pending', paymentDate: '2024-07-30' },
    { id: 'C004', deal: 'Sale of Sunnyvale Apartment', amount: 18750, status: 'Due', paymentDate: '2024-08-10' },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function FinancePage() {
    const totalCommission = commissions.reduce((sum, item) => sum + item.amount, 0);
    const paidCommission = commissions.filter(c => c.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
    const pendingCommission = totalCommission - paidCommission;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Financial Overview</h1>
                <p className="text-muted-foreground">Track commissions, payments, and financial performance.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Total Commission (YTD)</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total Paid</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(paidCommission)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Pending & Due</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(pendingCommission)}</p></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Commission Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Deal</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions.map(commission => (
                                <TableRow key={commission.id}>
                                    <TableCell className="font-medium">{commission.deal}</TableCell>
                                    <TableCell>{formatCurrency(commission.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant={commission.status === 'Paid' ? 'default' : commission.status === 'Pending' ? 'secondary' : 'destructive'}>
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
