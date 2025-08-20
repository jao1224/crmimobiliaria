

"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Search, Archive, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getNegotiations, addNegotiation, type Negotiation, addFinancingProcess, completeSaleAndGenerateCommission, getProperties, type Property, updateNegotiation, getUsers, type User, archiveNegotiation, deleteNegotiation } from "@/lib/data";
import { getClients, type Client } from "@/lib/crm-data";
import { cn } from "@/lib/utils";
import { ProfileContext } from "@/contexts/ProfileContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AssignNegotiationDialog } from "@/components/dashboard/assign-negotiation-dialog";
import Link from "next/link";


export default function NegotiationsPage() {
    const router = useRouter();
    const { activeProfile } = useContext(ProfileContext);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [allNegotiations, setAllNegotiations] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewNegotiationOpen, setNewNegotiationOpen] = useState(false);
    const { toast } = useToast();
    
    // Estados dos filtros
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [realtorFilter, setRealtorFilter] = useState('all');
    const [allUsers, setAllUsers] = useState<User[]>([]); // Para os filtros e diálogos

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

    // Estados para o diálogo de atribuição e exclusão
    const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user as any);
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
                setAllUsers(users); // Armazena todos os usuários
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
        let negotiations = allNegotiations.filter(neg => !neg.isArchived);

        if (currentUser && activeProfile !== 'Admin' && activeProfile !== 'Imobiliária') {
            negotiations = negotiations.filter(neg => 
                neg.realtorId === currentUser.uid || 
                neg.salespersonId === currentUser.uid || 
                neg.clientId === currentUser.uid
            );
        }
        
        if (activeProfile === 'Admin' || activeProfile === 'Imobiliária') {
            if (typeFilter !== 'all') {
                negotiations = negotiations.filter(neg => neg.type.toLowerCase() === typeFilter);
            }
            if (statusFilter !== 'all') {
                negotiations = negotiations.filter(neg => neg.contractStatus.replace(/\s/g, '-').toLowerCase() === statusFilter);
            }
            if (realtorFilter !== 'all') {
                const selectedUser = allUsers.find(u => u.id === realtorFilter);
                if (selectedUser) {
                    negotiations = negotiations.filter(neg => neg.realtorId === selectedUser.id || neg.salespersonId === selectedUser.id);
                }
            }
        }
        
        return negotiations;
    }, [allNegotiations, typeFilter, statusFilter, realtorFilter, activeProfile, currentUser, allUsers]);


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
        if (propertyCode) {
             const prop = availableProperties.find(p => p.id === propertyCode);
             if (prop) {
                setFoundProperty(prop);
                setProposalValue(prop.price.toString()); // Preenche o valor da proposta
             } else {
                setFoundProperty(null);
             }
        } else {
            setFoundProperty(null);
            setProposalValue("");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyCode]);

    useEffect(() => {
        if (clientCode) {
            const cli = availableClients.find(c => c.id === clientCode);
            setFoundClient(cli || null);
        } else {
            setFoundClient(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientCode]);


    const handleAddNegotiation = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!foundProperty || !foundClient || !currentUser) {
            toast({ variant: 'destructive', title: "Erro", description: "Busque e confirme os dados do imóvel, do cliente e esteja logado." });
            return;
        }
        
        const formData = new FormData(event.currentTarget);
        const responsibleSalespersonId = formData.get('salespersonId') as string || currentUser.uid;
        const responsibleSalesperson = allUsers.find(u => u.id === responsibleSalespersonId);

        const newNegotiationData: Omit<Negotiation, 'id'> = {
            property: foundProperty.name,
            propertyId: foundProperty.id,
            propertyDisplayCode: foundProperty.displayCode,
            propertyType: foundProperty.type,
            client: foundClient.name,
            clientId: foundClient.id,
            stage: "Proposta Enviada",
            type: 'Venda',
            contractStatus: "Não Gerado",
            value: Number(proposalValue),
            salesperson: responsibleSalesperson?.name || "N/A",
            salespersonId: responsibleSalespersonId,
            realtor: foundProperty.capturedBy,
            realtorId: foundProperty.capturedById,
            completionDate: null,
            createdAt: new Date().toISOString(),
            isFinanced: isFinanced,
            status: 'Ativo',
            processStage: 'Em andamento',
            negotiationType: 'Novo',
            category: 'Novo',
            team: 'Equipe A', // Simulado
            isArchived: false,
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

    const handleOpenAssignDialog = (negotiation: Negotiation) => {
        setSelectedNegotiation(negotiation);
        setAssignDialogOpen(true);
    };
    
    const handleArchiveNegotiation = async (negotiationId: string) => {
        try {
            await archiveNegotiation(negotiationId);
            await refreshData();
            toast({ title: "Negociação Arquivada", description: "A negociação foi movida para os arquivos." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível arquivar a negociação." });
        }
    };

    const handleOpenDeleteDialog = (negotiation: Negotiation) => {
        setSelectedNegotiation(negotiation);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedNegotiation) return;
        try {
            await deleteNegotiation(selectedNegotiation);
            await refreshData();
            toast({ title: "Negociação Excluída", description: "A negociação foi removida permanentemente e registrada no Feed de Atividades." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a negociação." });
        } finally {
            setDeleteDialogOpen(false);
        }
    };


    const handleAssignNegotiation = async (negotiationId: string, newSalespersonId: string) => {
        try {
            const newSalesperson = allUsers.find(u => u.id === newSalespersonId);
            if (!newSalesperson) {
                toast({ variant: "destructive", title: "Erro", description: "Usuário selecionado não encontrado." });
                return;
            }
            await updateNegotiation(negotiationId, { salesperson: newSalesperson.name, salespersonId: newSalesperson.id });
            await refreshData();
            toast({ title: "Sucesso!", description: "Negociação atribuída com sucesso." });
            setAssignDialogOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível atribuir a negociação." });
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
        <>
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Processos de Negociação</h1>
                    <p className="text-muted-foreground">Acompanhe e gerencie todas as suas negociações.</p>
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
                                                        {prop.name} ({prop.displayCode})
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
                                                        {cli.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                                     <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Imóvel Selecionado</h4>
                                        {foundProperty ? (
                                            <div className="text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground">{foundProperty.name}</p>
                                                <p>{foundProperty.address}</p>
                                                <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundProperty.price)}</p>
                                            </div>
                                        ) : <p className="text-sm text-destructive">Nenhum imóvel selecionado.</p>}
                                    </div>
                                     <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Cliente Selecionado</h4>
                                         {foundClient ? (
                                            <div className="text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground">{foundClient.name}</p>
                                                <p>Documento: {foundClient.document || 'N/A'}</p>
                                                <p>Responsável: {foundClient.assignedTo}</p>
                                            </div>
                                        ) : <p className="text-sm text-destructive">Nenhum cliente selecionado.</p>}
                                    </div>
                                </div>

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
                                            <Label htmlFor="salespersonId">Vendedor Responsável</Label>
                                            <Select name="salespersonId" defaultValue={currentUser?.uid || ''}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione um vendedor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allUsers.map(realtor => (
                                                        <SelectItem key={realtor.id} value={realtor.id}>
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
                           <Link href="/dashboard/negotiations/archived" className="text-sm text-primary hover:underline ml-2">Ver Arquivadas</Link>
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
                                    {allUsers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
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
                                <TableHead className="hidden md:table-cell">Data Criação</TableHead>
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
                                    <TableCell className="font-mono text-xs text-muted-foreground">{neg.propertyDisplayCode}</TableCell>
                                    <TableCell className="font-medium">
                                        {neg.property}
                                    </TableCell>
                                    <TableCell>{neg.client}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {neg.createdAt ? new Date(neg.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                    </TableCell>
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
                                                {(activeProfile === 'Admin' || activeProfile === 'Imobiliária') && (
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenAssignDialog(neg); }}>
                                                        Enviar/Atribuir
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchiveNegotiation(neg.id); }}>
                                                    Arquivar
                                                </DropdownMenuItem>
                                                 <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={(e) => { e.stopPropagation(); handleCompleteSale(neg); }}
                                                    disabled={neg.stage === 'Venda Concluída' || neg.stage === 'Aluguel Ativo'}
                                                    className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                                >
                                                    Concluir Venda
                                                </DropdownMenuItem>
                                                 <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(neg); }}
                                                >
                                                    Excluir
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

        <AssignNegotiationDialog
            isOpen={isAssignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            negotiation={selectedNegotiation}
            users={allUsers}
            onAssign={handleAssignNegotiation}
        />
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação é irreversível. A negociação será permanentemente excluída. Um registro do evento será criado no Feed de Atividades.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteConfirm}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                    >
                        Excluir Negociação
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </>
    );
}
