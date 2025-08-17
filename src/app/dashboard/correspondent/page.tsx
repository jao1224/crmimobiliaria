
"use client";

import { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PlusCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFinancingProcesses, getServiceRequests, realtors, addServiceRequest, type FinancingProcess, type ServiceRequest, type ServiceRequestType, type FinancingStatus, type EngineeringStatus, type GeneralProcessStatus } from "@/lib/data";
import { ProfileContext } from "@/contexts/ProfileContext";
import type { UserProfile } from "../layout";
import { cn } from "@/lib/utils";


const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

const correspondentPermissions: UserProfile[] = ['Admin', 'Imobiliária'];

export default function CorrespondentPage() {
    const [processes, setProcesses] = useState<FinancingProcess[]>([]);
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<FinancingProcess | null>(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isRequestModalOpen, setRequestModalOpen] = useState(false);
    const [requestType, setRequestType] = useState<ServiceRequestType>('credit_approval');

    const { toast } = useToast();
    
    useEffect(() => {
        setProcesses(getFinancingProcesses());
        setRequests(getServiceRequests());
    }, []);

    const handleRowClick = (process: FinancingProcess) => {
        setSelectedProcess(process);
        setDetailModalOpen(true);
    };

    const handleSaveChanges = (updatedProcess: FinancingProcess) => {
        // Simula a verificação de pendências
        const hasClientPendency = updatedProcess.clientStatus !== 'Aprovado' || updatedProcess.bacenInfo.includes('restrição');
        const hasEngineeringPendency = updatedProcess.engineeringStatus !== 'Aprovado';
        const hasDocsPendency = Object.values(updatedProcess.docs).some(doc => !doc.updated);
        
        updatedProcess.hasPendency = hasClientPendency || hasEngineeringPendency || hasDocsPendency;

        setProcesses(prev => prev.map(p => p.id === updatedProcess.id ? updatedProcess : p));
        toast({ title: "Sucesso", description: "Processo de financiamento atualizado." });
        setDetailModalOpen(false);
    };

    const handleNewRequest = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        const newRequest: ServiceRequest = {
            id: `req${Date.now()}`,
            type: requestType,
            realtorName: formData.get('realtorName') as string,
            clientInfo: formData.get('clientInfo') as string,
            propertyInfo: formData.get('propertyInfo') as string,
            status: 'Pendente',
            date: new Date().toISOString()
        };
        
        addServiceRequest(newRequest);
        setRequests(getServiceRequests()); // Recarrega os dados
        
        toast({ title: "Sucesso", description: "Nova solicitação enviada ao correspondente." });
        setRequestModalOpen(false);
        event.currentTarget.reset();
    };


    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Correspondente Bancário</h1>
                <p className="text-muted-foreground">Gerencie os processos de financiamento e as solicitações dos corretores.</p>
            </div>

             <Tabs defaultValue="processes">
                <TabsList>
                    <TabsTrigger value="processes">Meus Processos</TabsTrigger>
                    <TabsTrigger value="requests">Solicitações</TabsTrigger>
                </TabsList>
                <TabsContent value="processes">
                     <Card>
                        <CardHeader>
                            <CardTitle>Processos de Financiamento</CardTitle>
                            <CardDescription>Acompanhe o andamento de todos os processos de financiamento ativos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Imóvel</TableHead>
                                        <TableHead>Corretor</TableHead>
                                        <TableHead>Status Cliente</TableHead>
                                        <TableHead>Status Engenharia</TableHead>
                                        <TableHead>Status Geral</TableHead>
                                        <TableHead className="text-center">Pendências</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processes.map(proc => (
                                        <TableRow key={proc.id} onClick={() => handleRowClick(proc)} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                            <TableCell className="font-medium">{proc.clientName}</TableCell>
                                            <TableCell>{proc.propertyName}</TableCell>
                                            <TableCell>{proc.realtorName}</TableCell>
                                            <TableCell><Badge variant={proc.clientStatus === 'Aprovado' ? 'success' : 'secondary'}>{proc.clientStatus}</Badge></TableCell>
                                            <TableCell><Badge variant={proc.engineeringStatus === 'Aprovado' ? 'success' : 'secondary'}>{proc.engineeringStatus}</Badge></TableCell>
                                            <TableCell><Badge>{proc.generalStatus}</Badge></TableCell>
                                            <TableCell className="text-center">
                                                {proc.hasPendency && <AlertTriangle className="h-5 w-5 text-destructive inline-block" />}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="requests">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>Solicitações de Corretores</CardTitle>
                                <CardDescription>Gerencie as solicitações de aprovação de crédito, laudos e outros serviços.</CardDescription>
                            </div>
                            <Dialog open={isRequestModalOpen} onOpenChange={setRequestModalOpen}>
                                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Nova Solicitação</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Criar Nova Solicitação</DialogTitle>
                                        <DialogDescription>Preencha os dados para enviar uma solicitação ao correspondente.</DialogDescription>
                                    </DialogHeader>
                                     <form onSubmit={handleNewRequest}>
                                         <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Tipo de Solicitação</Label>
                                                <Select value={requestType} onValueChange={(v) => setRequestType(v as any)} required>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="credit_approval">Aprovação de Crédito</SelectItem>
                                                        <SelectItem value="engineering_report">Laudo de Engenharia</SelectItem>
                                                        <SelectItem value="property_registration">Matrícula Atualizada</SelectItem>
                                                        <SelectItem value="account_opening">Abertura de Conta</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Seu Nome (Corretor)</Label>
                                                <Select name="realtorName" required>
                                                    <SelectTrigger><SelectValue placeholder="Selecione seu nome"/></SelectTrigger>
                                                    <SelectContent>
                                                        {realtors.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                             {(requestType === 'credit_approval' || requestType === 'account_opening') && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="clientInfo">Informações do Cliente</Label>
                                                    <Textarea id="clientInfo" name="clientInfo" placeholder="Nome completo, CPF, Renda, etc." required/>
                                                </div>
                                             )}
                                             {(requestType === 'engineering_report' || requestType === 'property_registration') && (
                                                 <div className="space-y-2">
                                                    <Label htmlFor="propertyInfo">Informações do Imóvel</Label>
                                                    <Textarea id="propertyInfo" name="propertyInfo" placeholder="Endereço completo, matrícula, área, etc." required/>
                                                </div>
                                             )}
                                         </div>
                                        <DialogFooter>
                                            <Button type="submit"><Send className="mr-2 h-4 w-4"/>Enviar Solicitação</Button>
                                        </DialogFooter>
                                     </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map(req => (
                                        <TableRow key={req.id} className="transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1">
                                            <TableCell>{new Date(req.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-medium">{
                                                {
                                                    'credit_approval': 'Aprovação de Crédito',
                                                    'engineering_report': 'Laudo de Engenharia',
                                                    'property_registration': 'Matrícula Atualizada',
                                                    'account_opening': 'Abertura de Conta'
                                                }[req.type]
                                            }</TableCell>
                                            <TableCell>{req.realtorName}</TableCell>
                                            <TableCell><Badge variant={req.status === 'Concluído' ? 'success' : 'secondary'}>{req.status}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de Detalhes do Processo */}
            <Dialog open={isDetailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedProcess && <ProcessDetailForm process={selectedProcess} onSave={handleSaveChanges} onCancel={() => setDetailModalOpen(false)} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Componente do formulário de detalhes do processo para evitar re-renderização massiva
function ProcessDetailForm({ process, onSave, onCancel }: { process: FinancingProcess, onSave: (p: FinancingProcess) => void, onCancel: () => void }) {
    const { activeProfile } = useContext(ProfileContext);
    const canEdit = correspondentPermissions.includes(activeProfile);

    const [formData, setFormData] = useState<FinancingProcess>(process);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value }));
    };
    
    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: Number(value) }));
    };

    const handleSelectChange = (id: keyof FinancingProcess, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleNestedInputChange = (group: keyof FinancingProcess, id: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [group]: { ...(prev as any)[group], [id]: value } }));
    };
    
    const handleCheckboxChange = (group: keyof FinancingProcess, id: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [group]: { ...(prev as any)[group], [id]: { ...((prev as any)[group] as any)[id], updated: checked } } }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Detalhes do Processo de Financiamento</DialogTitle>
                <DialogDescription>Negociação ID: {formData.negotiationId} - {formData.propertyName}</DialogDescription>
            </DialogHeader>
            <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna 1 */}
                <div className="space-y-4">
                     <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader><CardTitle className="text-base">Status do Cliente</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.clientStatus} onValueChange={v => handleSelectChange('clientStatus', v)} disabled={!canEdit}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Aprovado">Aprovado</SelectItem>
                                        <SelectItem value="Reprovado">Reprovado</SelectItem>
                                        <SelectItem value="Condicionado">Condicionado</SelectItem>
                                        <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="approvedValue">Valor Aprovado (R$)</Label>
                                <Input id="approvedValue" type="number" value={formData.approvedValue} onChange={handleNumberInputChange} disabled={!canEdit} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="clientStatusReason">Motivo/Observação</Label>
                                <Textarea id="clientStatusReason" value={formData.clientStatusReason} onChange={handleInputChange} disabled={!canEdit} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader><CardTitle className="text-base">Consulta Bacen</CardTitle></CardHeader>
                        <CardContent>
                             <Textarea id="bacenInfo" value={formData.bacenInfo} onChange={handleInputChange} placeholder="Informações do Bacen..." disabled={!canEdit}/>
                        </CardContent>
                    </Card>
                </div>
                {/* Coluna 2 */}
                <div className="space-y-4">
                    <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader><CardTitle className="text-base">Engenharia</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.engineeringStatus} onValueChange={v => handleSelectChange('engineeringStatus', v)} disabled={!canEdit}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Não solicitado">Não solicitado</SelectItem>
                                        <SelectItem value="Aprovado">Aprovado</SelectItem>
                                        <SelectItem value="Reprovado">Reprovado</SelectItem>
                                        <SelectItem value="Pendência">Pendência</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="engineeringReason">Motivo da Pendência</Label>
                                <Input id="engineeringReason" value={formData.engineeringReason} onChange={handleInputChange} disabled={!canEdit} />
                            </div>
                            <div className="flex gap-4">
                                <div className="space-y-2 w-1/2">
                                    <Label htmlFor="appraisalDate">Data Laudo</Label>
                                    <Input id="appraisalDate" type="date" value={formData.appraisalDate} onChange={handleInputChange} disabled={!canEdit} />
                                </div>
                                <div className="space-y-2 w-1/2">
                                    <Label htmlFor="appraisalValue">Valor Laudo</Label>
                                    <Input id="appraisalValue" type="number" value={formData.appraisalValue} onChange={handleNumberInputChange} disabled={!canEdit} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader><CardTitle className="text-base">Etapas do Processo</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                           <div className="flex items-center space-x-2"><Checkbox checked={formData.stages.formSignature} onCheckedChange={(c) => handleNestedInputChange('stages', 'formSignature', c as boolean)} id="formSignature" disabled={!canEdit}/><Label htmlFor="formSignature">Assinatura de Formulários</Label></div>
                           <div className="flex items-center space-x-2"><Checkbox checked={formData.stages.compliance} onCheckedChange={(c) => handleNestedInputChange('stages', 'compliance', c as boolean)} id="compliance" disabled={!canEdit}/><Label htmlFor="compliance">Conformidade</Label></div>
                           <div className="flex items-center space-x-2"><Checkbox checked={formData.stages.financingResources} onCheckedChange={(c) => handleNestedInputChange('stages', 'financingResources', c as boolean)} id="financingResources" disabled={!canEdit}/><Label htmlFor="financingResources">Recursos p/ Financiar</Label></div>
                           <div className="space-y-1"><Label htmlFor="bankSignature">Assinatura no Banco</Label><Input id="bankSignature" type="date" value={formData.stages.bankSignature} onChange={e => handleNestedInputChange('stages', 'bankSignature', e.target.value)} disabled={!canEdit} /></div>
                           <div className="space-y-1"><Label htmlFor="registryEntry">Entrada no Cartório</Label><Input id="registryEntry" type="date" value={formData.stages.registryEntry} onChange={e => handleNestedInputChange('stages', 'registryEntry', e.target.value)} disabled={!canEdit} /></div>
                           <div className="space-y-1"><Label htmlFor="warranty">Garantia</Label><Input id="warranty" type="date" value={formData.stages.warranty} onChange={e => handleNestedInputChange('stages', 'warranty', e.target.value)} disabled={!canEdit} /></div>
                        </CardContent>
                    </Card>
                </div>
                 {/* Coluna 3 */}
                <div className="space-y-4">
                    <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader><CardTitle className="text-base">Documentação</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <div className="flex items-center space-x-2"><Checkbox id="doc-mat" checked={formData.docs.propertyRegistration.updated} onCheckedChange={c => handleCheckboxChange('docs', 'propertyRegistration', c as boolean)} disabled={!canEdit}/><Label htmlFor="doc-mat">Matrícula Atualizada</Label></div>
                             <div className="flex items-center space-x-2"><Checkbox id="doc-cc" checked={formData.docs.paycheck.updated} onCheckedChange={c => handleCheckboxChange('docs', 'paycheck', c as boolean)} disabled={!canEdit}/><Label htmlFor="doc-cc">Contracheque</Label></div>
                             <div className="flex items-center space-x-2"><Checkbox id="doc-end" checked={formData.docs.addressProof.updated} onCheckedChange={c => handleCheckboxChange('docs', 'addressProof', c as boolean)} disabled={!canEdit}/><Label htmlFor="doc-end">Endereço</Label></div>
                             <div className="flex items-center space-x-2"><Checkbox id="doc-aprov" checked={formData.docs.clientApproval.updated} onCheckedChange={c => handleCheckboxChange('docs', 'clientApproval', c as boolean)} disabled={!canEdit}/><Label htmlFor="doc-aprov">Aprovação do Cliente</Label></div>
                             <div className="flex items-center space-x-2"><Checkbox id="doc-laudo" checked={formData.docs.engineeringReport.updated} onCheckedChange={c => handleCheckboxChange('docs', 'engineeringReport', c as boolean)} disabled={!canEdit}/><Label htmlFor="doc-laudo">Laudo de Engenharia</Label></div>
                        </CardContent>
                    </Card>
                    <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader><CardTitle className="text-base">Status Geral do Processo</CardTitle></CardHeader>
                        <CardContent>
                            <Select value={formData.generalStatus} onValueChange={v => handleSelectChange('generalStatus', v)} disabled={!canEdit}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                                    <SelectItem value="Concluído">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={!canEdit}>Salvar Alterações</Button>
            </DialogFooter>
        </form>
    );
}
