
"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getNegotiations, addNegotiation, type Negotiation, addFinancingProcess, completeSaleAndGenerateCommission, getProperties, type Property, updateNegotiation, getUsers, type User } from "@/lib/data";
import { getClients, type Client } from "@/lib/crm-data";
import { cn } from "@/lib/utils";
import { ProfileContext } from "@/contexts/ProfileContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function NegotiationsPage() {
    const router = useRouter();
    const { activeProfile } = useContext(ProfileContext);
    const [currentUser, setCurrentUser] = useState<any | null>(null);

    const [allNegotiations, setAllNegotiations] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewNegotiationOpen, setNewNegotiationOpen] = useState(false);
    const { toast } = useToast();
    
    // Estados dos filtros
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [realtorFilter, setRealtorFilter] = useState('all');
    const [realtors, setRealtors] = useState<User[]>([]);

    const [propertyCode, setPropertyCode] = useState("");
    const [clientCode, setClientCode] = useState("");
    const [isFinanced, setIsFinanced] = useState(false);
    const [foundProperty, setFoundProperty] = useState<Property | null>(null);
    const [foundClient, setFoundClient] = useState<Client | null>(null);
    const [proposalValue, setProposalValue] = useState("");
    const [proposalDate, setProposalDate] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    
    // Dados para os selects, carregados uma vez
    const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
    const [availableClients, setAvailableClients] = useState<Client[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentUser !== undefined) {
             const fetchDropdownData = async () => {
                 const [props, clients, users] = await Promise.all([
                    getProperties(),
                    getClients(),
                    getUsers()
                ]);
                setAvailableProperties(props.filter(p => p.status === 'Disponível'));
                setAvailableClients(clients);
                setRealtors(users.filter(u => u.role === 'Corretor Autônomo' || u.role === 'Admin' || u.role === 'Imobiliária'));
            }
            fetchDropdownData();
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
    
    const filteredNegotiations = useMemo(() => {
        let negotiations = [...allNegotiations];

        // Filtro por perfil
        if (activeProfile !== 'Admin' && activeProfile !== 'Imobiliária' && currentUser) {
            negotiations = negotiations.filter(neg => 
                neg.realtor === currentUser.displayName || 
                neg.salesperson === currentUser.displayName || 
                neg.client === currentUser.displayName
            );
        }

        // Filtros da UI para Admin/Imobiliária
        if (typeFilter !== 'all') {
            negotiations = negotiations.filter(neg => neg.type.toLowerCase() === typeFilter);
        }
        if (statusFilter !== 'all') {
            negotiations = negotiations.filter(neg => neg.contractStatus.replace(/\s/g, '-').toLowerCase() === statusFilter);
        }
        if (realtorFilter !== 'all') {
            negotiations = negotiations.filter(neg => neg.realtor === realtorFilter || neg.salesperson === realtorFilter);
        }
        
        return negotiations;
    }, [allNegotiations, typeFilter, statusFilter, realtorFilter, activeProfile, currentUser]);

    // Função para aplicar os filtros manualmente
    const applyFilters = () => {
        // A filtragem agora é reativa com o `useMemo`, então este botão pode ser usado para forçar um refresh se necessário.
        // Por enquanto, ele não precisa fazer nada.
        toast({ title: "Filtros aplicados." });
    };

    const handleSearch = async () => {
        setIsSearching(true);
        // Simulação de busca
        setTimeout(() => {
            const prop = availableProperties.find(p => p.id === propertyCode);
            const cli = availableClients.find(c => c.id === clientCode);

            if (prop) {
                setFoundProperty(prop);
            } else {
                toast({ variant: 'destructive', title: "Erro", description: "Imóvel não encontrado com este ID." });
                setFoundProperty(null);
            }

            if (cli) {
                setFoundClient(cli);
            } else {
                 toast({ variant: 'destructive', title: "Erro", description: "Cliente não encontrado com este ID." });
                 setFoundClient(null);
            }

            if (prop && cli) {
                 toast({ title: "Sucesso!", description: "Dados encontrados." });
            }
            setIsSearching(false);
        }, 500);
    };

    const resetForm = () => {
        setPropertyCode("");
        setClientCode("");
        setFoundProperty(null);
        setFoundClient(null);
        setProposalValue("");
        setProposalDate("");
        setIsFinanced(false);
    };

    useEffect(() => {
        if (!isNewNegotiationOpen) {
            resetForm();
        }
    }, [isNewNegotiationOpen]);
    
    // Busca automática ao selecionar
    useEffect(() => {
        if (propertyCode && clientCode) {
            handleSearch();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyCode, clientCode]);


    const handleAddNegotiation = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!foundProperty || !foundClient || !currentUser) {
            toast({ variant: 'destructive', title: "Erro", description: "Busque e confirme os dados do imóvel, do cliente e esteja logado." });
            return;
        }
        
        const formData = new FormData(event.currentTarget);
        const responsibleSalesperson = formData.get('salesperson') as string || currentUser.displayName || "N/A";


        const newNegotiationData: Omit<Negotiation, 'id'> = {
            property: foundProperty.name,
            propertyId: foundProperty.id,
            propertyType: foundProperty.type,
            client: foundClient.name,
            clientId: foundClient.id,
            stage: "Proposta Enviada",
            type: 'Venda',
            contractStatus: "Não Gerado",
            value: Number(proposalValue),
            salesperson: responsibleSalesperson,
            realtor: foundProperty.capturedBy,
            completionDate: null,
            isFinanced: isFinanced,
            status: 'Ativo',
            processStage: 'Em andamento',
            negotiationType: 'Novo',
            category: 'Novo',
            team: 'Equipe A', // Simulado
        };
        
        const newNegotiationId = await addNegotiation(newNegotiationData);
        
        if (isFinanced) {
             const newFinancingProcess: Omit<any, 'id'> = {
                negotiationId: newNegotiationId,
                clientName: newNegotiationData.client,
                propertyName: newNegotiationData.property,
                realtorName: newNegotiationData.salesperson,
                clientStatus: 'Pendente',
                clientStatusReason: 'Aguardando documentação inicial',
                approvedValue: 0,
                bacenInfo: '',
                engineeringStatus: 'Não solicitado',
                engineeringReason: '',
                appraisalValue: 0,
                appraisalDate: '',
                docs: {
                    propertyRegistration: { updated: false, dueDate: '' },
                    paycheck: { updated: false, dueDate: '' },
                    addressProof: { updated: false, dueDate: '' },
                    clientApproval: { updated: false, dueDate: '' },
                    engineeringReport: { updated: false, dueDate: '' },
                },
                stages: { formSignature: false, compliance: false, financingResources: false, bankSignature: '', registryEntry: '', warranty: '' },
                generalStatus: 'Ativo',
                hasPendency: true,
            };
            await addFinancingProcess(newFinancingProcess);
            toast({ title: "Sucesso!", description: "Nova negociação iniciada e processo de financiamento criado para o correspondente." });
        } else {
            toast({ title: "Sucesso!", description: "Nova negociação iniciada." });
        }
        
        await refreshData();
        setNewNegotiationOpen(false);
    };
    
    const handleGenerateContract = async (negotiation: Negotiation) => {
        try {
            await updateNegotiation(negotiation.id, { 
                stage: "Contrato Gerado", 
                contractStatus: "Pendente Assinaturas" 
            });
            await refreshData();
            toast({ title: "Sucesso!", description: "Contrato gerado. Redirecionando..." });
            router.push(`/dashboard/negotiations/${negotiation.id}/contract`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o status do contrato.' });
        }
    }

    const handleCompleteSale = async (neg: Negotiation) => {
        const { success, message } = await completeSaleAndGenerateCommission(neg);
        if (success) {
            await refreshData(); 
            toast({
                title: "Venda Concluída!",
                description: message
            });
        } else {
             toast({
                variant: "destructive",
                title: "Erro ao Concluir Venda",
                description: message
            });
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
    
    const getContractStatusVariant = (status: Negotiation['contractStatus']): VariantProps<typeof badgeVariants>['variant'] => {
        switch (status) {
            case 'Não Gerado': return 'destructive';
            case 'Pendente Assinaturas': return 'status-orange';
            case 'Assinado': return 'success';
            case 'Cancelado': return 'destructive';
            default: return 'secondary';
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Processos de Negociação</h1>
                    <p className="text-muted-foreground">Acompanhe e gerencie todas as suas negociações ativas.</p>
                </div>
                <Dialog open={isNewNegotiationOpen} onOpenChange={setNewNegotiationOpen}>
                    <DialogTrigger asChild>
                        <Button>Iniciar Nova Negociação</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Iniciar Nova Negociação</DialogTitle>
                            <DialogDescription>
                                Selecione um imóvel e um cliente da lista para buscar os dados.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddNegotiation}>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Imóvel</Label>
                                        <Select value={propertyCode} onValueChange={setPropertyCode} required>
                                            <SelectTrigger><SelectValue placeholder="Selecione um imóvel" /></SelectTrigger>
                                            <SelectContent>
                                                {availableProperties.map(prop => (
                                                    <SelectItem key={prop.id} value={prop.id}>
                                                        {prop.name} ({prop.id.toUpperCase()})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cliente</Label>
                                        <Select value={clientCode} onValueChange={setClientCode} required>
                                            <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                                            <SelectContent>
                                                {availableClients.map(cli => (
                                                    <SelectItem key={cli.id} value={cli.id}>
                                                        {cli.name} ({cli.id.toUpperCase()})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {(isSearching || foundProperty || foundClient) && (
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                                         <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Imóvel Encontrado</h4>
                                            {isSearching ? <Skeleton className="h-12 w-full" /> : foundProperty ? (
                                                <div className="text-sm text-muted-foreground">
                                                    <p className="font-medium text-foreground">{foundProperty.name}</p>
                                                    <p>{foundProperty.address}</p>
                                                    <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundProperty.price)}</p>
                                                </div>
                                            ) : <p className="text-sm text-destructive">Selecione um imóvel.</p>}
                                        </div>
                                         <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Cliente Encontrado</h4>
                                             {isSearching ? <Skeleton className="h-12 w-full" /> : foundClient ? (
                                                <div className="text-sm text-muted-foreground">
                                                    <p className="font-medium text-foreground">{foundClient.name}</p>
                                                    <p>Fonte: {foundClient.source}</p>
                                                </div>
                                            ) : <p className="text-sm text-destructive">Selecione um cliente.</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="value">Valor da Proposta (R$)</Label>
                                            <Input id="value" name="value" type="number" placeholder="750000" required value={proposalValue} onChange={e => setProposalValue(e.target.value)} disabled={!foundProperty || !foundClient} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date">Data da Proposta</Label>
                                            <Input id="date" name="date" type="date" required value={proposalDate} onChange={e => setProposalDate(e.target.value)} disabled={!foundProperty || !foundClient} />
                                        </div>
                                    </div>
                                    
                                     {(activeProfile === 'Admin' || activeProfile === 'Imobiliária') && (
                                        <div className="space-y-2">
                                            <Label htmlFor="salesperson">Vendedor Responsável</Label>
                                            <Select name="salesperson" defaultValue={currentUser?.displayName || ''}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione um vendedor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {realtors.map(realtor => (
                                                        <SelectItem key={realtor.id} value={realtor.name}>
                                                            {realtor.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="financed" checked={isFinanced} onCheckedChange={(checked) => setIsFinanced(checked as boolean)} disabled={!foundProperty || !foundClient} />
                                        <Label htmlFor="financed">É financiado?</Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="border-t pt-4">
                                <Button type="submit" disabled={!foundProperty || !foundClient || !proposalValue || !proposalDate}>Criar Negociação</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Negociações em Andamento</CardTitle>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <CardDescription>
                           Selecione os filtros para buscar as negociações.
                        </CardDescription>
                         {(activeProfile === 'Admin' || activeProfile === 'Imobiliária') && (
                        <div className="flex flex-wrap items-center gap-2">
                             <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Filtrar por Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Tipos</SelectItem>
                                    <SelectItem value="Venda">Venda</SelectItem>
                                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                                    <SelectItem value="Leilão">Leilão</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Filtrar por Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="nao-gerado">Não Gerado</SelectItem>
                                    <SelectItem value="pendente-assinaturas">Pendente Assinaturas</SelectItem>
                                    <SelectItem value="assinado">Assinado</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={realtorFilter} onValueChange={setRealtorFilter}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder="Filtrar por Responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Responsáveis</SelectItem>
                                    {realtors.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cód.</TableHead>
                                <TableHead>Imóvel</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Fase</TableHead>
                                <TableHead>Contrato</TableHead>
                                <TableHead className="hidden lg:table-cell">Vendedor</TableHead>
                                <TableHead className="hidden lg:table-cell">Captador</TableHead>
                                <TableHead>
                                  <span className="sr-only">Ações</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={10}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredNegotiations.length > 0 ? (
                                filteredNegotiations.map((neg) => (
                                <TableRow
                                    key={neg.id}
                                    onClick={() => router.push(`/dashboard/negotiations/${neg.id}/contract`)}
                                    className={cn(
                                        "transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1"
                                    )}
                                >
                                    <TableCell className="font-mono text-xs text-muted-foreground">{neg.id.toUpperCase()}</TableCell>
                                    <TableCell className="font-medium">
                                        {neg.property}
                                    </TableCell>
                                    <TableCell>{neg.client}</TableCell>
                                    <TableCell className="hidden md:table-cell">{neg.type}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(neg.value)}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getStageVariant(neg.stage)}
                                            className={'whitespace-nowrap'}
                                        >
                                            {neg.stage}
                                        </Badge>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant={getContractStatusVariant(neg.contractStatus)} className="whitespace-nowrap">{neg.contractStatus}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{neg.salesperson}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{neg.realtor}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    aria-haspopup="true"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Alternar menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/processes`)}>Ver Processo</DropdownMenuItem>
                                                {neg.contractStatus === 'Não Gerado' ? (
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleGenerateContract(neg); }}>
                                                        Gerar Contrato
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/negotiations/${neg.id}/contract`)}>
                                                        Ver/Editar Contrato
                                                    </DropdownMenuItem>
                                                )}
                                                 <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={(e) => { e.stopPropagation(); handleCompleteSale(neg); }}
                                                    disabled={neg.stage === 'Venda Concluída' || neg.stage === 'Aluguel Ativo'}
                                                    className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                                >
                                                    Concluir Venda
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                 <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">Nenhum processo de negociação encontrado.</TableCell>
                                 </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    