

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Gavel, Hammer, FileCheck2, Building, PlusCircle, Send, Wallet, Link as LinkIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getLegalRequests, addLegalRequest, type LegalRequest, type LegalRequestType, getNegotiations, type Negotiation, getUsers, type User, getRentalContracts, addRentalContract, type RentalContract, addRentalPayment, getRentalPayments, type RentalPayment, getProperties, type Property, getOtherServiceRequests, addOtherServiceRequest, type OtherServiceRequest, type OtherServiceType, getDispatcherProcess, createOrUpdateDispatcherProcess, DispatcherProcess } from "@/lib/data";
import { getClients, type Client } from "@/lib/crm-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const services = [
    { id: "rental", label: "Locação", icon: Building, description: "Administração de contratos de locação." },
    { id: "juridico", label: "Jurídico", icon: Gavel, description: "Suporte e consultoria jurídica imobiliária." },
    { id: "evaluator", label: "Avaliador", icon: Scale, description: "Serviços de avaliação de imóveis." },
    { id: "auction", label: "Leilão", icon: Hammer, description: "Gestão e participação em leilões de imóveis." },
    { id: "dispatcher", label: "Despachante", icon: FileCheck2, description: "Serviços de despachante para documentação." },
];

const legalRequestTypes: { id: LegalRequestType, label: string }[] = [
    { id: 'contract_review', label: 'Análise Contratual' },
    { id: 'document_regularization', label: 'Regularização de Documentos' },
    { id: 'due_diligence', label: 'Due Diligence Imobiliária' },
    { id: 'rental_collection', label: 'Ação de Cobrança (Aluguel)' },
    { id: 'other', label: 'Outra Solicitação' }
];

const otherServiceTypes: { id: OtherServiceType, label: string, buttonLabel: string, description: string }[] = [
    { id: 'evaluation', label: 'Avaliação de Imóvel', buttonLabel: 'Solicitar Avaliação', description: 'Peça uma avaliação profissional para um imóvel.' },
    { id: 'auction', label: 'Inclusão em Leilão', buttonLabel: 'Solicitar Inclusão', description: 'Solicite a inclusão de um imóvel no próximo leilão.' },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
const getStatusVariant = (status: LegalRequest['status'] | OtherServiceRequest['status']) => {
    switch(status) {
        case 'Em Análise': return 'status-blue';
        case 'Pendente': return 'status-orange';
        case 'Concluído': return 'success';
        default: return 'secondary';
    }
};

function LegalTabContent() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState<LegalRequest[]>([]);
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    // State to pre-fill from another tab
    const [prefilledData, setPrefilledData] = useState<{ rentalContractId?: string; description?: string; type?: LegalRequestType } | null>(null);
    
    useEffect(() => {
        fetchData();

        // Listener for custom event
        const handleTriggerLegal = (e: any) => {
            const { contract } = e.detail;
            setPrefilledData({
                rentalContractId: contract.id,
                description: `Referente ao contrato de locação do imóvel "${contract.propertyName}" com o inquilino "${contract.tenantName}".`,
                type: 'rental_collection'
            });
            setIsRequestOpen(true);
        };
        
        window.addEventListener('triggerLegalRequest', handleTriggerLegal);

        return () => {
            window.removeEventListener('triggerLegalRequest', handleTriggerLegal);
        };

    }, []);
    
    useEffect(() => {
        if (!isRequestOpen) {
            setSelectedFile(null);
            setPrefilledData(null); // Reset prefilled data when dialog closes
        }
    }, [isRequestOpen]);


    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [reqData, negData, usersData] = await Promise.all([
                getLegalRequests(),
                getNegotiations(),
                getUsers()
            ]);
            setRequests(reqData);
            setNegotiations(negData);
            setUsers(usersData);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar os dados jurídicos." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleNewRequest = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        
        const newRequest: Omit<LegalRequest, 'id'> = {
            negotiationId: formData.get('negotiationId') as string || undefined,
            rentalContractId: formData.get('rentalContractId') as string || undefined,
            requestingUserId: formData.get('requestingUserId') as string,
            type: formData.get('type') as LegalRequestType,
            description: formData.get('description') as string,
            status: 'Pendente',
            createdAt: new Date().toISOString(),
        };

        try {
            await addLegalRequest(newRequest, users, negotiations, selectedFile);
            await fetchData();
            toast({ title: "Sucesso!", description: "Sua solicitação foi enviada ao departamento jurídico." });
            setIsRequestOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível enviar a solicitação." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-6 w-6" />
                        <span>Processos e Solicitações Jurídicas</span>
                    </CardTitle>
                    <CardDescription>
                        Acompanhe as solicitações e o andamento dos processos com o departamento jurídico.
                    </CardDescription>
                </div>
                <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Nova Solicitação</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Solicitação Jurídica</DialogTitle>
                            <DialogDescription>Preencha os detalhes para solicitar um serviço ao departamento jurídico.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleNewRequest}>
                            <div className="py-4 space-y-4">
                               {prefilledData?.rentalContractId && <Input type="hidden" name="rentalContractId" value={prefilledData.rentalContractId} />}

                                <div className="space-y-2">
                                    <Label htmlFor="negotiationId">Vincular Negociação de Venda (Opcional)</Label>
                                    <Select name="negotiationId" disabled={!!prefilledData?.rentalContractId}>
                                        <SelectTrigger><SelectValue placeholder="Selecione uma negociação"/></SelectTrigger>
                                        <SelectContent>
                                            {negotiations.map(n => <SelectItem key={n.id} value={n.id}>{n.property} (Cliente: {n.client})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="requestingUserId">Solicitante</Label>
                                    <Select name="requestingUserId" required>
                                        <SelectTrigger><SelectValue placeholder="Selecione seu nome"/></SelectTrigger>
                                        <SelectContent>
                                            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipo de Serviço</Label>
                                    <Select name="type" required defaultValue={prefilledData?.type}>
                                        <SelectTrigger><SelectValue placeholder="Selecione o tipo de serviço"/></SelectTrigger>
                                        <SelectContent>
                                            {legalRequestTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição da Solicitação</Label>
                                    <Textarea id="description" name="description" placeholder="Descreva claramente o que você precisa." required defaultValue={prefilledData?.description}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="file">Anexar Documento (Opcional)</Label>
                                    <Input id="file" name="file" type="file" onChange={handleFileChange} />
                                    {selectedFile && <p className="text-xs text-muted-foreground">Arquivo selecionado: {selectedFile.name}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    <Send className="mr-2 h-4 w-4"/> {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                                </Button>
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
                            <TableHead>Ref.</TableHead>
                            <TableHead>Anexo</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full"/></TableCell></TableRow>
                            ))
                        ) : requests.length > 0 ? (
                            requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{legalRequestTypes.find(rt => rt.id === req.type)?.label || req.type}</TableCell>
                                    <TableCell>{users.find(u => u.id === req.requestingUserId)?.name || 'Desconhecido'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {req.negotiationId ? `Neg. ${req.negotiationId.substring(0,5)}...` : req.rentalContractId ? `Loc. ${req.rentalContractId.substring(0,5)}...` : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {req.fileUrl ? (
                                            <a href={req.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                <LinkIcon className="h-4 w-4 inline-block"/>
                                            </a>
                                        ) : 'N/A'}
                                    </TableCell>
                                    <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma solicitação jurídica encontrada.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function RentalTabContent() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [contracts, setContracts] = useState<RentalContract[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    const [isContractOpen, setIsContractOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [conData, propData, cliData] = await Promise.all([
                getRentalContracts(),
                getProperties(),
                getClients()
            ]);
            setContracts(conData);
            setProperties(propData.filter(p => p.status === 'Disponível' || conData.some(c => c.propertyId === p.id))); 
            setClients(cliData);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar os dados de locação." });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);
    
    const handleTriggerLegal = (contract: RentalContract) => {
        const event = new CustomEvent('triggerLegalRequest', { detail: { contract } });
        window.dispatchEvent(event);
        // Maybe switch tab? For now, just dispatch event.
        toast({ title: "Ação Iniciada", description: "Formulário de solicitação jurídica aberto e pré-preenchido." });
    };

    const handleNewContract = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        
        const propertyId = formData.get('propertyId') as string;
        const tenantId = formData.get('tenantId') as string;

        const property = properties.find(p => p.id === propertyId);
        const tenant = clients.find(c => c.id === tenantId);

        if (!property || !tenant) {
            toast({ variant: 'destructive', title: "Erro", description: "Imóvel ou inquilino inválido." });
            setIsSubmitting(false);
            return;
        }

        const newContract: Omit<RentalContract, 'id'> = {
            propertyId,
            propertyName: property.name,
            tenantId,
            tenantName: tenant.name,
            monthlyRent: parseFloat(formData.get('monthlyRent') as string),
            adminFee: parseFloat(formData.get('adminFee') as string),
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') as string,
            status: 'Ativo',
        };

        try {
            await addRentalContract(newContract);
            await fetchData();
            toast({ title: "Sucesso!", description: "Novo contrato de locação criado." });
            setIsContractOpen(false);
        } catch (error) {
             toast({ variant: 'destructive', title: "Erro", description: "Não foi possível criar o contrato." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleRegisterPayment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedContract) return;

        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);

        const newPayment: Omit<RentalPayment, 'id'> = {
            rentalContractId: selectedContract.id,
            amount: parseFloat(formData.get('amount') as string),
            paymentDate: formData.get('paymentDate') as string,
            referenceMonth: formData.get('referenceMonth') as string,
        };

        try {
            await addRentalPayment(newPayment);
            toast({ title: "Sucesso!", description: "Pagamento registrado." });
            setIsPaymentOpen(false);
        } catch (error) {
             toast({ variant: 'destructive', title: "Erro", description: "Não foi possível registrar o pagamento." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const openPaymentModal = (contract: RentalContract) => {
        setSelectedContract(contract);
        setIsPaymentOpen(true);
    };

    return (
         <Card className="mt-4">
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-6 w-6" />
                        <span>Contratos de Locação</span>
                    </CardTitle>
                    <CardDescription>
                        Gerencie todos os contratos de aluguel ativos e seus pagamentos.
                    </CardDescription>
                </div>
                <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Novo Contrato</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo Contrato de Locação</DialogTitle>
                            <DialogDescription>Vincule um imóvel a um inquilino e defina os termos.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleNewContract}>
                            <div className="py-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="propertyId">Imóvel</Label>
                                        <Select name="propertyId" required><SelectTrigger><SelectValue placeholder="Selecione um imóvel"/></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tenantId">Inquilino</Label>
                                        <Select name="tenantId" required><SelectTrigger><SelectValue placeholder="Selecione um cliente"/></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="monthlyRent">Aluguel Mensal (R$)</Label>
                                        <Input id="monthlyRent" name="monthlyRent" type="number" step="0.01" required/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="adminFee">Taxa de Adm. (%)</Label>
                                        <Input id="adminFee" name="adminFee" type="number" step="0.1" required/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="startDate">Data de Início</Label>
                                        <Input id="startDate" name="startDate" type="date" required/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="endDate">Data de Fim</Label>
                                        <Input id="endDate" name="endDate" type="date" required/>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Contrato"}</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader><TableRow><TableHead>Imóvel</TableHead><TableHead>Inquilino</TableHead><TableHead>Valor Aluguel</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 3}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full"/></TableCell></TableRow>)
                        ) : contracts.length > 0 ? (
                            contracts.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.propertyName}</TableCell>
                                    <TableCell>{c.tenantName}</TableCell>
                                    <TableCell>{formatCurrency(c.monthlyRent)}</TableCell>
                                    <TableCell><Badge variant={c.status === 'Ativo' ? 'success' : 'secondary'}>{c.status}</Badge></TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => openPaymentModal(c)}>
                                            <Wallet className="mr-2 h-4 w-4" /> Pagamento
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleTriggerLegal(c)}>
                                            <Gavel className="mr-2 h-4 w-4" /> Acionar Jurídico
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum contrato de locação ativo.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Pagamento de Aluguel</DialogTitle>
                        <DialogDescription>Contrato de: {selectedContract?.propertyName}</DialogDescription>
                    </DialogHeader>
                     <form onSubmit={handleRegisterPayment}>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="referenceMonth">Mês de Referência</Label>
                                <Input id="referenceMonth" name="referenceMonth" type="month" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="amount">Valor Pago (R$)</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={selectedContract?.monthlyRent} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="paymentDate">Data do Pagamento</Label>
                                <Input id="paymentDate" name="paymentDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                            </div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Registrar Pagamento"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

function OtherServiceTabContent({ serviceType }: { serviceType: OtherServiceType }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState<OtherServiceRequest[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isRequestOpen, setIsRequestOpen] = useState(false);

    const serviceInfo = otherServiceTypes.find(s => s.id === serviceType)!;
    const Icon = services.find(s => s.id === serviceType)?.icon || Wallet;

    useEffect(() => {
        fetchData();
    }, [serviceType]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [reqData, propData, usersData] = await Promise.all([
                getOtherServiceRequests(),
                getProperties(),
                getUsers()
            ]);
            setRequests(reqData.filter(r => r.serviceType === serviceType));
            setProperties(propData);
            setUsers(usersData);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar os dados do serviço." });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNewRequest = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        
        const newRequest: Omit<OtherServiceRequest, 'id'> = {
            serviceType: serviceType,
            propertyId: formData.get('propertyId') as string,
            requestingUserId: formData.get('requestingUserId') as string,
            notes: formData.get('notes') as string,
            status: 'Pendente',
            createdAt: new Date().toISOString(),
        };

        try {
            await addOtherServiceRequest(newRequest, users, properties);
            await fetchData();
            toast({ title: "Sucesso!", description: "Sua solicitação foi enviada." });
            setIsRequestOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível enviar a solicitação." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card className="mt-4">
            <CardHeader className="flex-row items-start justify-between">
                 <div>
                    <CardTitle className="flex items-center gap-2">
                        <Icon className="h-6 w-6" />
                        <span>{serviceInfo.label}</span>
                    </CardTitle>
                    <CardDescription>{serviceInfo.description}</CardDescription>
                </div>
                <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/>{serviceInfo.buttonLabel}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{serviceInfo.buttonLabel}</DialogTitle>
                            <DialogDescription>Preencha os detalhes para abrir a solicitação.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleNewRequest}>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="propertyId">Imóvel</Label>
                                    <Select name="propertyId" required><SelectTrigger><SelectValue placeholder="Selecione um imóvel"/></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.displayCode})</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="requestingUserId">Solicitante</Label>
                                    <Select name="requestingUserId" required><SelectTrigger><SelectValue placeholder="Selecione seu nome"/></SelectTrigger><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Observações</Label>
                                    <Textarea id="notes" name="notes" placeholder="Descreva detalhes importantes para esta solicitação."/>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}><Send className="mr-2 h-4 w-4"/>{isSubmitting ? "Enviando..." : "Enviar Solicitação"}</Button>
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
                            <TableHead>Imóvel</TableHead>
                            <TableHead>Solicitante</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             Array.from({length: 3}).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full"/></TableCell></TableRow>)
                        ) : requests.length > 0 ? (
                            requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{properties.find(p => p.id === req.propertyId)?.name || 'N/A'}</TableCell>
                                    <TableCell>{users.find(u => u.id === req.requestingUserId)?.name || 'Desconhecido'}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhuma solicitação deste tipo encontrada.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const progressItemsConfig: { label: string }[] = [
  { label: 'Contrato CV' }, { label: 'ITBI' }, { label: 'Escritura' }, { label: 'Registro' },
  { label: 'Aguardando Aprovação' }, { label: 'Procuração' }, { label: 'Engenharia' },
  { label: 'Aguardando Recursos' }, { label: 'Bacen' }, { label: 'Aguardando Assinatura' },
  { label: 'Conformidade' }, { label: 'Formulários' }, { label: 'Garantia' },
  { label: 'Pagamento de Comissão' }, { label: 'Finalizado' }, { label: 'Outros' }
];

const checklistItemsConfig: { label: string }[] = [
    { label: 'Contrato CV' }, { label: 'Procuração' }, { label: 'Débitos Condomínio' },
    { label: 'CND/IPTU' }, { label: 'Sinal Entrada Valor' }, { label: 'Financiamento em Dias' }
];


function DispatcherTabContent() {
    const { toast } = useToast();
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [selectedNegotiationId, setSelectedNegotiationId] = useState<string>('');
    const [processData, setProcessData] = useState<DispatcherProcess | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const createNewDispatcherProcess = (negotiationId: string): DispatcherProcess => ({
        id: negotiationId,
        overallStatus: 'Ativo',
        progressStatus: 'Em Andamento',
        progress: progressItemsConfig.map(item => ({ label: item.label, status: 'Pendente' })),
        checklist: checklistItemsConfig.map(item => ({ label: item.label, status: 'N/A' })),
        observations: ''
    });

    useEffect(() => {
        const fetchNegotiations = async () => {
            setIsLoading(true);
            try {
                const negs = await getNegotiations();
                // Filtra para mostrar apenas negociações de Venda ativas
                setNegotiations(negs.filter(n => n.type === 'Venda' && n.stage !== 'Venda Concluída'));
            } catch (error) {
                toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar as negociações." });
            } finally {
                setIsLoading(false);
            }
        };
        fetchNegotiations();
    }, [toast]);
    
    useEffect(() => {
        const fetchProcessData = async () => {
            if (!selectedNegotiationId) {
                setProcessData(null);
                return;
            }
            setIsLoading(true);
            try {
                let data = await getDispatcherProcess(selectedNegotiationId);
                if (!data) {
                    data = createNewDispatcherProcess(selectedNegotiationId);
                }
                setProcessData(data);
            } catch (error) {
                toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar os dados do processo." });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProcessData();
    }, [selectedNegotiationId, toast]);
    
    const handleSave = async () => {
        if (!processData) return;
        setIsSaving(true);
        try {
            await createOrUpdateDispatcherProcess(processData.id, processData);
            toast({ title: "Sucesso!", description: "Processo do despachante salvo com sucesso." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao Salvar", description: "Não foi possível salvar as alterações." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleProgressChange = (index: number, newStatus: DispatcherProgressItem['status']) => {
        if (!processData) return;
        const newProgress = [...processData.progress];
        newProgress[index].status = newStatus;
        setProcessData({ ...processData, progress: newProgress });
    };

    const handleChecklistChange = (index: number, newStatus: DispatcherChecklistItem['status']) => {
        if (!processData) return;
        const newChecklist = [...processData.checklist];
        newChecklist[index].status = newStatus;
        setProcessData({ ...processData, checklist: newChecklist });
    };
    
    const handleInputChange = (field: keyof DispatcherProcess, value: string) => {
        if (!processData) return;
        setProcessData({ ...processData, [field]: value });
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileCheck2 className="h-6 w-6" /><span>Processo do Despachante</span></CardTitle>
                <CardDescription>Acompanhe cada etapa do processo de documentação de uma venda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="max-w-md">
                    <Label htmlFor="negotiation-select">Selecione uma Negociação de Venda</Label>
                    <Select value={selectedNegotiationId} onValueChange={setSelectedNegotiationId}>
                        <SelectTrigger id="negotiation-select"><SelectValue placeholder="Escolha um processo..."/></SelectTrigger>
                        <SelectContent>
                            {negotiations.map(neg => <SelectItem key={neg.id} value={neg.id}>{neg.property} (Cliente: {neg.client})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                {isLoading && selectedNegotiationId ? (
                    <Skeleton className="h-96 w-full"/>
                ) : processData ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-2">
                                <Label>Status Geral</Label>
                                <Select value={processData.overallStatus} onValueChange={(v) => handleInputChange('overallStatus', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ativo">Ativo</SelectItem>
                                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                                        <SelectItem value="Suspenso">Suspenso</SelectItem>
                                        <SelectItem value="Concluído">Concluído</SelectItem>
                                    </SelectContent>
                                </Select>
                           </div>
                           <div className="space-y-2">
                                <Label>Status do Andamento</Label>
                                <Select value={processData.progressStatus} onValueChange={(v) => handleInputChange('progressStatus', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                        <SelectItem value="Parado">Parado</SelectItem>
                                        <SelectItem value="Outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Checklist de Andamento</h3>
                                <div className="space-y-3">
                                    {processData.progress.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                                            <Label htmlFor={`progress-${index}`} className="font-normal">{item.label}</Label>
                                            <Select value={item.status} onValueChange={(value) => handleProgressChange(index, value as any)}>
                                                <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                                    <SelectItem value="Concluído">Concluído</SelectItem>
                                                    <SelectItem value="N/A">N/A</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Verificação de Processos</h3>
                                <div className="space-y-3">
                                     {processData.checklist.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                                            <Label htmlFor={`checklist-${index}`} className="font-normal">{item.label}</Label>
                                            <RadioGroup
                                                id={`checklist-${index}`}
                                                value={item.status}
                                                onValueChange={(value) => handleChecklistChange(index, value as any)}
                                                className="flex items-center gap-4"
                                            >
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id={`checklist-${index}-sim`} /><Label htmlFor={`checklist-${index}-sim`} className="font-normal">Sim</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id={`checklist-${index}-nao`} /><Label htmlFor={`checklist-${index}-nao`} className="font-normal">Não</Label></div>
                                            </RadioGroup>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-4"/>
                                <div className="space-y-2">
                                    <Label htmlFor="observations">Observações</Label>
                                    <Textarea 
                                        id="observations" 
                                        value={processData.observations} 
                                        onChange={(e) => handleInputChange('observations', e.target.value)} 
                                        placeholder="Adicione observações relevantes aqui..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} disabled={isSaving}>
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? "Salvando..." : "Salvar Processo"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    selectedNegotiationId && <p className="text-center text-muted-foreground py-10">Este processo ainda não foi iniciado. Os dados serão criados ao salvar.</p>
                )}
            </CardContent>
        </Card>
    );
}


export default function ServicesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Outros Serviços</h1>
                <p className="text-muted-foreground">Gerencie serviços adicionais oferecidos pela imobiliária.</p>
            </div>

            <Tabs defaultValue={services[0].id} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    {services.map(service => (
                        <TabsTrigger key={service.id} value={service.id}>{service.label}</TabsTrigger>
                    ))}
                </TabsList>

                 <TabsContent value="rental"><RentalTabContent /></TabsContent>
                 <TabsContent value="juridico"><LegalTabContent /></TabsContent>
                 <TabsContent value="evaluator"><OtherServiceTabContent serviceType="evaluation" /></TabsContent>
                 <TabsContent value="auction"><OtherServiceTabContent serviceType="auction" /></TabsContent>
                 <TabsContent value="dispatcher"><DispatcherTabContent /></TabsContent>
            </Tabs>
        </div>
    );
}

    
