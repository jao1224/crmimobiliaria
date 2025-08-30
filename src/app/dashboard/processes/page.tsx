
"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, AlertCircle, CheckCircle, Hourglass, UserPlus, Trash2, Home, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProcessos, type Processo, type ProcessStatus, type ProcessStage, updateProcesso, addNotification, getNegotiations, type Negotiation, completeSaleAndGenerateCommission, getUsers, type User as AppUser } from "@/lib/data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileContext } from "@/contexts/ProfileContext";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { arrayRemove, arrayUnion, getDocs, collection } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Team = {
    id: string;
    name: string;
    memberIds: string[];
};

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
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProcess, setSelectedProcess] = useState<Processo | null>(null);
    const [isPendencyModalOpen, setPendencyModalOpen] = useState(false);
    const [isFinalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isAssignTeamOpen, setIsAssignTeamOpen] = useState(false);
    const [pendencyNote, setPendencyNote] = useState("");
    const [finalizationNote, setFinalizationNote] = useState("");
    const [newTeamId, setNewTeamId] = useState("");
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
            const [processesData, negotiationsData, usersData, teamsSnapshot] = await Promise.all([
                getProcessos(),
                getNegotiations(),
                getUsers(),
                getDocs(collection(db, "teams")),
            ]);
            setProcesses(processesData);
            setNegotiations(negotiationsData);
            setAllUsers(usersData);
            setTeams(teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar os processos."});
        } finally {
            setIsLoading(false);
        }
    };
    
    const filteredProcesses = useMemo(() => {
        if (!currentUser) return [];

        const userTeams = teams.filter(team => team.memberIds.includes(currentUser.uid)).map(t => t.name);

        if (activeProfile === 'Admin' || activeProfile === 'Imobiliária') {
            return processes;
        }

        return processes.filter(p => 
            p.realtorName === currentUser.displayName || 
            p.salespersonName === currentUser.displayName ||
            p.clientName === currentUser.displayName ||
            userTeams.includes(p.team) // Mostra se o processo está na equipe do usuário
        );
    }, [processes, activeProfile, currentUser, teams]);

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
    
    const handleOpenAssignTeam = (process: Processo) => {
        setSelectedProcess(process);
        setNewTeamId(teams.find(t => t.name === process.team)?.id || "");
        setIsAssignTeamOpen(true);
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
    
    const handleAssignTeam = async () => {
        if (!selectedProcess || !newTeamId) {
            toast({ variant: 'destructive', title: "Erro", description: "Selecione uma equipe para atribuir." });
            return;
        }
        
        const teamToAssign = teams.find(t => t.id === newTeamId);
        if (!teamToAssign) {
            toast({ variant: 'destructive', title: "Erro", description: "Equipe selecionada não encontrada." });
            return;
        }
        
        const teamName = teamToAssign.name;

        try {
            await updateProcesso(selectedProcess.id, {
                team: teamName
            });
            await refreshData();
            setNewTeamId("");
            toast({ title: "Sucesso", description: `Processo enviado para a equipe ${teamName}.` });
            setIsAssignTeamOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível atribuir o processo." });
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Gestão de Processos</h1>
                <p className="text-muted-foreground">Acompanhe todos os processos em que você está envolvido ou que foram atribuídos à sua equipe.</p>
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
                                <TableHead className="hidden md:table-cell">Equipe</TableHead>
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
                                        <TableCell className="hidden md:table-cell"><Badge variant="outline">{process.team}</Badge></TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações do Processo</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleOpenAssignTeam(process)}>Atribuir Equipe</DropdownMenuItem>
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
                            <Label className="text-muted-foreground">Equipe Responsável</Label>
                             <div className="text-sm p-3 bg-muted rounded-md min-h-12">
                                <Badge variant="outline">{selectedProcess?.team}</Badge>
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
            
            {/* Modal de Atribuir Equipe */}
            <Dialog open={isAssignTeamOpen} onOpenChange={setIsAssignTeamOpen}>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Atribuir Processo a uma Equipe</DialogTitle>
                        <DialogDescription>
                            Selecione a equipe que ficará responsável por este processo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="new-team-select">Enviar para a Equipe</Label>
                             <div className="flex gap-2 mt-1">
                                <Select value={newTeamId} onValueChange={setNewTeamId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma equipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teams.map(team => (
                                            <SelectItem key={team.id} value={team.id}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignTeamOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAssignTeam}>Atribuir Equipe</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
