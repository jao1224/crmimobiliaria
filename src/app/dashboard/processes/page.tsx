
"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, AlertCircle, CheckCircle, Hourglass, UserPlus, Trash2, Home } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProcessos, type Processo, type ProcessStatus, type ProcessStage, updateProcesso, addNotification, getNegotiations, type Negotiation, completeSaleAndGenerateCommission, getUsers } from "@/lib/data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileContext } from "@/contexts/ProfileContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { arrayRemove, arrayUnion } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const getStatusVariant = (status: ProcessStatus) => {
    switch (status) {
        case 'Ativo': return 'default';
        case 'Suspenso': return 'warning';
        case 'Cancelado': return 'destructive';
        case 'Finalizado': return 'default';
        default: return 'secondary';
    }
};

const getStageVariant = (stage: ProcessStage) => {
    switch (stage) {
        case 'Em andamento': return 'warning';
        case 'Pendência': return 'status-orange';
        case 'Finalizado': return 'default';
        default: return 'secondary';
    }
};

export default function ProcessesPage() {
    const { activeProfile } = useContext(ProfileContext);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [processes, setProcesses] = useState<Processo[]>([]);
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]); // Para o select de partes
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProcess, setSelectedProcess] = useState<Processo | null>(null);
    const [isPendencyModalOpen, setPendencyModalOpen] = useState(false);
    const [isFinalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isManagePartiesOpen, setManagePartiesOpen] = useState(false);
    const [pendencyNote, setPendencyNote] = useState("");
    const [finalizationNote, setFinalizationNote] = useState("");
    const [newPartyId, setNewPartyId] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
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
            const [processesData, negotiationsData, usersData] = await Promise.all([
                getProcessos(),
                getNegotiations(),
                getUsers()
            ]);
            setProcesses(processesData);
            setNegotiations(negotiationsData);
            setAllUsers(usersData);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar os processos."});
        } finally {
            setIsLoading(false);
        }
    };
    
    const filteredProcesses = useMemo(() => {
        if (activeProfile === 'Admin' || activeProfile === 'Imobiliária') {
            return processes;
        }
        if (currentUser?.displayName) {
            if (activeProfile === 'Construtora') {
                 return processes.filter(p => p.realtorName === currentUser.displayName);
            }
            return processes.filter(p => 
                p.realtorName === currentUser.displayName || 
                p.salespersonName === currentUser.displayName ||
                p.clientName === currentUser.displayName
            );
        }
        return [];
    }, [processes, activeProfile, currentUser]);

    const handleOpenPendencyModal = (process: Processo) => {
        setSelectedProcess(process);
        setPendencyNote(process.observations || "");
        setPendencyModalOpen(true);
    };

    const handleOpenFinalizeModal = (process: Processo) => {
        setSelectedProcess(process);
        setFinalizationNote("");
        setFinalizeModalOpen(true);
    };

    const handleOpenDetailModal = (process: Processo) => {
        setSelectedProcess(process);
        setDetailModalOpen(true);
    };
    
    const handleOpenManageParties = (process: Processo) => {
        setSelectedProcess(process);
        setManagePartiesOpen(true);
    };

    const handleSavePendency = async () => {
        if (!selectedProcess) return;
        try {
            await updateProcesso(selectedProcess.id, {
                stage: 'Pendência',
                observations: pendencyNote
            });
            await addNotification({
                title: "Pendência Registrada!",
                description: `No processo do imóvel ${selectedProcess.propertyName} (${selectedProcess.propertyDisplayCode}) - Vendedor: ${selectedProcess.salespersonName}.`,
            });
            await refreshData();
            toast({ title: "Pendência Registrada!", description: `Uma nova observação foi adicionada ao processo ${selectedProcess.processoDisplayCode}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a pendência.'});
        }
        setPendencyModalOpen(false);
    };

    const handleFinalizeProcess = async () => {
        if (!selectedProcess) return;

        // Encontra a negociação correspondente
        const negotiation = negotiations.find(n => n.id === selectedProcess.negotiationId);
        if (!negotiation) {
            toast({ variant: 'destructive', title: "Erro Crítico", description: "A negociação vinculada a este processo não foi encontrada." });
            return;
        }

        try {
            const { success, message } = await completeSaleAndGenerateCommission(negotiation, finalizationNote);
            
            if (success) {
                await refreshData();
                toast({ title: "Processo Finalizado!", description: message });
            } else {
                 toast({ variant: 'destructive', title: "Atenção", description: message });
            }

        } catch(error) {
            toast({ variant: "destructive", title: "Erro ao Finalizar", description: "Não foi possível finalizar o processo e gerar comissões." });
        }
        
        setFinalizeModalOpen(false);
    };
    
    const handleAddParty = async () => {
        if (!selectedProcess || !newPartyId) {
            toast({ variant: 'destructive', title: "Erro", description: "Selecione uma parte para adicionar." });
            return;
        }
        
        const partyToAdd = allUsers.find(u => u.id === newPartyId);
        if (!partyToAdd) {
            toast({ variant: 'destructive', title: "Erro", description: "Usuário selecionado não encontrado." });
            return;
        }
        
        const partyName = partyToAdd.name;

        try {
            await updateProcesso(selectedProcess.id, {
                involvedParties: arrayUnion(partyName)
            });
            await refreshData();
            // Atualizar o estado local para o modal
            setSelectedProcess(prev => ({
                ...prev!,
                involvedParties: [...(prev?.involvedParties || []), partyName]
            }));
            setNewPartyId("");
            toast({ title: "Sucesso", description: "Parte envolvida adicionada." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível adicionar a parte." });
        }
    };
    
    const handleRemoveParty = async (partyToRemove: string) => {
        if (!selectedProcess) return;
        
        try {
            await updateProcesso(selectedProcess.id, {
                involvedParties: arrayRemove(partyToRemove)
            });
            await refreshData();
             setSelectedProcess(prev => ({
                ...prev!,
                involvedParties: (prev?.involvedParties || []).filter(p => p !== partyToRemove)
            }));
            toast({ title: "Sucesso", description: "Parte envolvida removida." });
        } catch (error) {
             toast({ variant: 'destructive', title: "Erro", description: "Não foi possível remover a parte." });
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Gestão de Processos</h1>
                <p className="text-muted-foreground">Acompanhe todos os processos em que você está envolvido.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Meus Processos</CardTitle>
                    <CardDescription>Lista de todos os processos ativos, com pendências ou finalizados.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Cód. Proc.</TableHead>
                                <TableHead>Data Criação</TableHead>
                                <TableHead>Fase Atual</TableHead>
                                <TableHead>Imóvel</TableHead>
                                <TableHead>Vendedor</TableHead>
                                <TableHead className="hidden md:table-cell">Captador</TableHead>
                                <TableHead><span className="sr-only">Ações</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredProcesses.length > 0 ? (
                                filteredProcesses.map(process => (
                                    <TableRow key={process.id} onClick={() => handleOpenDetailModal(process)} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                        <TableCell><Badge variant={getStatusVariant(process.status)}>{process.status}</Badge></TableCell>
                                        <TableCell className="font-mono text-xs">{process.processoDisplayCode}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {process.createdAt ? new Date(process.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {process.stage === 'Pendência' && <AlertCircle className="h-4 w-4 text-status-orange" />}
                                                {process.stage === 'Em andamento' && <Hourglass className="h-4 w-4 text-status-blue" />}
                                                {process.stage === 'Finalizado' && <CheckCircle className="h-4 w-4 text-primary" />}
                                                <Badge variant={getStageVariant(process.stage)}>{process.stage}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {process.propertyName}
                                            <div className="text-xs text-muted-foreground font-mono">{process.propertyDisplayCode}</div>
                                        </TableCell>
                                        <TableCell>{process.salespersonName}</TableCell>
                                        <TableCell className="hidden md:table-cell">{process.realtorName}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => {e.stopPropagation()}}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações do Processo</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleOpenManageParties(process)}>Gerenciar Partes</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleOpenPendencyModal(process)}>Marcar Pendência</DropdownMenuItem>
                                                    <DropdownMenuSeparator/>
                                                    <DropdownMenuItem 
                                                        onSelect={() => handleOpenFinalizeModal(process)}
                                                        className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                                        disabled={process.status === 'Finalizado' || process.status === 'Cancelado'}
                                                    >
                                                        Finalizar Processo
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">Nenhum processo encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de Detalhes */}
            <Dialog open={isDetailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes do Processo</DialogTitle>
                        <DialogDescription>
                            Processo da Negociação: <span className="font-bold font-mono">{selectedProcess?.processoDisplayCode}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Imóvel</Label>
                                <p className="font-semibold">{selectedProcess?.propertyName} ({selectedProcess?.propertyDisplayCode})</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Cliente</Label>
                                <p className="font-semibold">{selectedProcess?.clientName}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Vendedor</Label>
                                <p className="font-semibold">{selectedProcess?.salespersonName}</p>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-muted-foreground">Captador</Label>
                                <p className="font-semibold">{selectedProcess?.realtorName}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label className="text-muted-foreground">Status</Label>
                                <div><Badge variant={getStatusVariant(selectedProcess?.status || 'Ativo')}>{selectedProcess?.status}</Badge></div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Andamento</Label>
                                <div><Badge variant={getStageVariant(selectedProcess?.stage || 'Em andamento')}>{selectedProcess?.stage}</Badge></div>
                            </div>
                        </div>
                         <div className="space-y-1">
                            <Label className="text-muted-foreground">Observações</Label>
                            <p className="text-sm p-3 bg-muted rounded-md min-h-20">{selectedProcess?.observations || "Nenhuma observação registrada."}</p>
                        </div>
                         <div className="space-y-1">
                            <Label className="text-muted-foreground">Outras Partes Envolvidas</Label>
                             <div className="text-sm p-3 bg-muted rounded-md min-h-12">
                                {selectedProcess?.involvedParties && selectedProcess.involvedParties.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {selectedProcess.involvedParties.map((party, index) => <li key={index}>{party}</li>)}
                                    </ul>
                                ) : "Nenhuma outra parte envolvida."}
                             </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setDetailModalOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Pendência */}
            <Dialog open={isPendencyModalOpen} onOpenChange={setPendencyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Marcar Pendência no Processo</DialogTitle>
                        <DialogDescription>
                            Adicione uma observação sobre a pendência. Todos os envolvidos no processo 
                            serão notificados (simulado). Processo: <span className="font-bold">{selectedProcess?.processoDisplayCode}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="pendency-note">Motivo / Observação da Pendência</Label>
                        <Textarea 
                            id="pendency-note" 
                            className="min-h-32" 
                            value={pendencyNote}
                            onChange={(e) => setPendencyNote(e.target.value)}
                            placeholder="Ex: Falta a certidão de nascimento do comprador."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendencyModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSavePendency}>Salvar Pendência</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Finalização */}
            <Dialog open={isFinalizeModalOpen} onOpenChange={setFinalizeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finalizar Processo</DialogTitle>
                        <DialogDescription>
                            Adicione uma nota de finalização para este processo.
                             Processo: <span className="font-bold">{selectedProcess?.processoDisplayCode}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="finalization-note">Nota de Finalização</Label>
                        <Textarea 
                            id="finalization-note" 
                            className="min-h-32" 
                            value={finalizationNote}
                            onChange={(e) => setFinalizationNote(e.target.value)}
                            placeholder="Ex: Documentação entregue, processo concluído com sucesso."
                        />
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setFinalizeModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFinalizeProcess}>Concluir e Finalizar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Modal de Gerenciar Partes Envolvidas */}
            <Dialog open={isManagePartiesOpen} onOpenChange={setManagePartiesOpen}>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Gerenciar Partes Envolvidas</DialogTitle>
                        <DialogDescription>
                            Adicione ou remova imobiliárias e corretores parceiros neste processo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="new-party-select">Adicionar Nova Parte</Label>
                             <div className="flex gap-2 mt-1">
                                <Select value={newPartyId} onValueChange={setNewPartyId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um usuário" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allUsers
                                            .filter(user => !(selectedProcess?.involvedParties || []).includes(user.name))
                                            .map(user => (
                                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddParty}><UserPlus className="h-4 w-4"/></Button>
                            </div>
                        </div>
                         <div>
                            <h4 className="text-sm font-medium mb-2">Partes Atuais</h4>
                            <div className="p-3 bg-muted rounded-md min-h-24 max-h-48 overflow-y-auto">
                                {selectedProcess?.involvedParties && selectedProcess.involvedParties.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedProcess.involvedParties.map((party, index) => (
                                            <li key={index} className="flex items-center justify-between text-sm">
                                                <span>{party}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveParty(party)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma parte adicional envolvida.</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setManagePartiesOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
