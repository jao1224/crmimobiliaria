
"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowLeft, ArchiveRestore } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { getNegotiations, type Negotiation, markAsDeleted } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ProfileContext } from "@/contexts/ProfileContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

export default function DeletedNegotiationsPage() {
    const router = useRouter();
    const { activeProfile } = useContext(ProfileContext);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allNegotiations, setAllNegotiations] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user as any);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentUser !== undefined) {
            refreshData();
        }
    }, [currentUser]);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const data = await getNegotiations();
            setAllNegotiations(data);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao buscar negociações" });
        } finally {
            setIsLoading(false);
        }
    };

    const deletedNegotiations = useMemo(() => {
        let negotiations = allNegotiations.filter(neg => neg.isDeleted);

        if (currentUser && activeProfile !== 'Admin' && activeProfile !== 'Imobiliária') {
            negotiations = negotiations.filter(neg =>
                neg.realtorId === currentUser.uid ||
                neg.salespersonId === currentUser.uid ||
                neg.clientId === currentUser.uid
            );
        }
        return negotiations;
    }, [allNegotiations, activeProfile, currentUser]);
    
    const handleRestoreNegotiation = async (negotiationId: string) => {
        try {
            await markAsDeleted(negotiationId, false);
            await refreshData();
            toast({ title: "Negociação Restaurada", description: "A negociação foi movida de volta para a lista principal." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível restaurar a negociação." });
        }
    };

    const getStageVariant = (stage: Negotiation['stage']): VariantProps<typeof badgeVariants>['variant'] => {
        switch (stage) {
            case 'Proposta Enviada': return 'status-blue';
            case 'Em Negociação': return 'status-orange';
            case 'Contrato Gerado': return 'success';
            case 'Venda Concluída': return 'success';
            case 'Aluguel Ativo': return 'success';
            default: return 'secondary';
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Voltar</span>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Histórico de Exclusão</h1>
                    <p className="text-muted-foreground">Veja as negociações que foram marcadas como excluídas.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Negociações Excluídas</CardTitle>
                    <CardDescription>
                        Esta é uma lista de todas as negociações que foram excluídas. Elas podem ser restauradas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Imóvel</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fase</TableHead>
                                <TableHead>Vendedor</TableHead>
                                <TableHead>
                                  <span className="sr-only">Ações</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : deletedNegotiations.length > 0 ? (
                                deletedNegotiations.map((neg) => (
                                <TableRow key={neg.id}>
                                    <TableCell className="font-medium">{neg.property}</TableCell>
                                    <TableCell>{neg.client}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStageVariant(neg.stage)} className={'whitespace-nowrap'}>
                                            {neg.stage}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{neg.salesperson}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRestoreNegotiation(neg.id)}
                                        >
                                            <ArchiveRestore className="mr-2 h-4 w-4" />
                                            Restaurar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                 <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma negociação no histórico de exclusão.</TableCell>
                                 </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    