
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "../layout";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Commission = {
    id: string; // Deal ID
    deal: string; // Property Name
    amount: number;
    status: 'Pago' | 'Pendente' | 'Vencido';
    paymentDate: string; // Deal Close Date
};

type Negotiation = {
    id: string;
    property: string;
    value: number;
    commissionRate: number;
    stage: string;
    closeDate: string;
};


const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

export default function FinancePage({ activeProfile }: { activeProfile?: UserProfile }) {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchCommissions = async () => {
        setIsLoading(true);
        try {
            // Buscamos apenas negociações que já geraram contrato
            const negotiationsQuery = query(collection(db, "deals"), where("stage", "==", "Contrato Gerado"));
            const querySnapshot = await getDocs(negotiationsQuery);

            const commissionsList = querySnapshot.docs.map(doc => {
                const data = doc.data() as Negotiation;
                return {
                    id: doc.id,
                    deal: data.property,
                    amount: data.value * (data.commissionRate / 100),
                    status: 'Pendente', // Status inicial default
                    paymentDate: new Date(data.closeDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
                };
            });
            // NOTE: O status (pago, vencido) não está no Firestore, então essa lógica foi simplificada.
            // Em uma app real, o status da comissão também seria um campo no documento.
            setCommissions(commissionsList);

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as comissões." });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCommissions();
    }, []);


    const totalCommission = commissions.reduce((sum, item) => sum + item.amount, 0);
    // Lógica de comissão paga/pendente precisa ser adaptada se o status não for salvo
    const paidCommission = commissions.filter(c => c.status === 'Pago').reduce((sum, item) => sum + item.amount, 0);
    const pendingCommission = totalCommission - paidCommission;
    
    // Esta função agora é apenas para UI, não salva no DB.
    const handleStatusChange = (commissionId: string, newStatus: Commission['status']) => {
        setCommissions(prevCommissions => 
            prevCommissions.map(c => 
                c.id === commissionId ? { ...c, status: newStatus } : c
            )
        );
        toast({
            title: "Status Atualizado!",
            description: `A comissão foi marcada como ${newStatus}. (Apenas visual)`
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
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total Pago</CardTitle></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-2xl font-bold">{formatCurrency(paidCommission)}</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Pendente & Vencido</CardTitle></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-2xl font-bold">{formatCurrency(pendingCommission)}</p>}</CardContent>
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
                             {isLoading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : commissions.length > 0 ? (
                                commissions.map(commission => (
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
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma comissão encontrada.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
