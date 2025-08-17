
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, AlertCircle, CheckCircle, Hourglass } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getNegotiations, type Negotiation, type ProcessStatus, type ProcessStage, completeSaleAndGenerateCommission } from "@/lib/data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";


const getStatusVariant = (status: ProcessStatus) => {
    switch (status) {
        case 'Ativo': return 'success';
        case 'Suspenso': return 'warning';
        case 'Cancelado': return 'destructive';
        case 'Finalizado': return 'default';
        default: return 'secondary';
    }
};

const getStageVariant = (stage: ProcessStage) => {
    switch (stage) {
        case 'Em andamento': return 'status-blue';
        case 'Pendência': return 'status-orange';
        case 'Finalizado': return 'default';
        default: return 'secondary';
    }
};

export default function ProcessesPage() {
    const [processes, setProcesses] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProcess, setSelectedProcess] = useState<Negotiation | null>(null);
    const [isPendencyModalOpen, setPendencyModalOpen] = useState(false);
    const [isFinalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [pendencyNote, setPendencyNote] = useState("");
    const [finalizationNote, setFinalizationNote] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        refreshProcesses();
    }, []);

    const refreshProcesses = async () => {
        setIsLoading(true);
        try {
            const data = await getNegotiations();
            setProcesses(data);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar os processos."});
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenPendencyModal = (process: Negotiation) => {
        setSelectedProcess(process);
        setPendencyNote(process.observations || "");
        setPendencyModalOpen(true);
    };

    const handleOpenFinalizeModal = (process: Negotiation) => {
        setSelectedProcess(process);
        setFinalizationNote("");
        setFinalizeModalOpen(true);
    };

    const handleSavePendency = async () => {
        if (!selectedProcess) return;
        try {
            await updateDoc(doc(db, 'negotiations', selectedProcess.id), {
                processStage: 'Pendência',
                observations: pendencyNote
            });
            await refreshProcesses();
            toast({ title: "Pendência Registrada!", description: `Uma nova observação foi adicionada ao processo ${selectedProcess.id.toUpperCase()}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a pendência.'});
        }
        setPendencyModalOpen(false);
    };

    const handleFinalizeProcess = async () => {
        if (!selectedProcess) return;

        const { success, message } = await completeSaleAndGenerateCommission(selectedProcess, finalizationNote);

        if (success) {
            await refreshProcesses();
            toast({ title: "Processo Finalizado!", description: message });
        } else {
            toast({ variant: "destructive", title: "Erro ao Finalizar", description: message });
        }
        
        setFinalizeModalOpen(false);
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
                                <TableHead>Código</TableHead>
                                <TableHead>Andamento</TableHead>
                                <TableHead>Tipo Negociação</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Imóvel</TableHead>
                                <TableHead>Vendedor</TableHead>
                                <TableHead>Captador</TableHead>
                                <TableHead>Equipe</TableHead>
                                <TableHead>Observações</TableHead>
                                <TableHead><span className="sr-only">Ações</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={11}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : processes.length > 0 ? (
                                processes.map(process => (
                                    <TableRow key={process.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                        <TableCell><Badge variant={getStatusVariant(process.status)}>{process.status}</Badge></TableCell>
                                        <TableCell className="font-mono text-xs">{process.id.toUpperCase()}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {process.processStage === 'Pendência' && <AlertCircle className="h-4 w-4 text-status-orange" />}
                                                {process.processStage === 'Em andamento' && <Hourglass className="h-4 w-4 text-status-blue" />}
                                                {process.processStage === 'Finalizado' && <CheckCircle className="h-4 w-4 text-primary" />}
                                                <Badge variant={getStageVariant(process.processStage)}>{process.processStage}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>{process.negotiationType}</TableCell>
                                        <TableCell>{process.category}</TableCell>
                                        <TableCell className="font-medium">{process.property}</TableCell>
                                        <TableCell>{process.salesperson}</TableCell>
                                        <TableCell>{process.realtor}</TableCell>
                                        <TableCell>{process.team}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs max-w-xs truncate">{process.observations}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações do Processo</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleOpenPendencyModal(process)}>Marcar Pendência</DropdownMenuItem>
                                                    <DropdownMenuSeparator/>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleOpenFinalizeModal(process)}
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
                                    <TableCell colSpan={11} className="h-24 text-center">Nenhum processo encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de Pendência */}
            <Dialog open={isPendencyModalOpen} onOpenChange={setPendencyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Marcar Pendência no Processo</DialogTitle>
                        <DialogDescription>
                            Adicione uma observação sobre a pendência. Todos os envolvidos no processo 
                            serão notificados (simulado). Processo: <span className="font-bold">{selectedProcess?.id.toUpperCase()}</span>
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
                            Insira os detalhes finais sobre o que cada parte (corretor, gerente, etc.) tem a receber.
                             Processo: <span className="font-bold">{selectedProcess?.id.toUpperCase()}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="finalization-note">Detalhes do Recebimento</Label>
                        <Textarea 
                            id="finalization-note" 
                            className="min-h-32" 
                            value={finalizationNote}
                            onChange={(e) => setFinalizationNote(e.target.value)}
                            placeholder="Ex: Corretor Vendedor: R$ 5.000,00. Corretor Captador: R$ 3.000,00. Gerente: R$ 1.000,00."
                        />
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setFinalizeModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFinalizeProcess}>Concluir e Finalizar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
