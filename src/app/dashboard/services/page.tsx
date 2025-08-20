

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Gavel, Hammer, FileCheck2, Building, PlusCircle, Send, Wallet, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getLegalRequests, addLegalRequest, type LegalRequest, type LegalRequestType, getNegotiations, type Negotiation, getUsers, type User, getRentalContracts, addRentalContract, type RentalContract, addRentalPayment, getRentalPayments, type RentalPayment, getProperties, type Property } from "@/lib/data";
import { getClients, type Client } from "@/lib/crm-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const services = [
    { id: "rental", label: "Locação", icon: Building, description: "Administração de contratos de locação." },
    { id: "juridico", label: "Jurídico", icon: Gavel, description: "Suporte e consultoria jurídica imobiliária." },
    { id: "evaluator", label: "Avaliador", icon: Scale, description: "Serviços de avaliação de imóveis." },
    { id: "auction", label: "Leilão", icon: Hammer, description: "Gestão e participação em leilões de imóveis." },
    { id: "dispatcher", label: "Despachante", icon: FileCheck2, description: "Serviços de despachante para documentação." },
];

const requestTypes: { id: LegalRequestType, label: string }[] = [
    { id: 'contract_review', label: 'Análise Contratual' },
    { id: 'document_regularization', label: 'Regularização de Documentos' },
    { id: 'due_diligence', label: 'Due Diligence Imobiliária' },
    { id: 'other', label: 'Outra Solicitação' }
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);


function LegalTabContent() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState<LegalRequest[]>([]);
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isRequestOpen, setIsRequestOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleNewRequest = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        
        const newRequest: Omit<LegalRequest, 'id'> = {
            negotiationId: formData.get('negotiationId') as string,
            requestingUserId: formData.get('requestingUserId') as string,
            type: formData.get('type') as LegalRequestType,
            description: formData.get('description') as string,
            status: 'Pendente',
            createdAt: new Date().toISOString(),
        };

        try {
            await addLegalRequest(newRequest, users, negotiations);
            await fetchData();
            toast({ title: "Sucesso!", description: "Sua solicitação foi enviada ao departamento jurídico." });
            setIsRequestOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível enviar a solicitação." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getStatusVariant = (status: LegalRequest['status']) => {
        switch(status) {
            case 'Em Análise': return 'status-blue';
            case 'Pendente': return 'status-orange';
            case 'Concluído': return 'success';
            default: return 'secondary';
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
                                <div className="space-y-2">
                                    <Label htmlFor="negotiationId">Negociação (Opcional)</Label>
                                    <Select name="negotiationId">
                                        <SelectTrigger><SelectValue placeholder="Vincular a uma negociação"/></SelectTrigger>
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
                                    <Select name="type" required>
                                        <SelectTrigger><SelectValue placeholder="Selecione o tipo de serviço"/></SelectTrigger>
                                        <SelectContent>
                                            {requestTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição da Solicitação</Label>
                                    <Textarea id="description" name="description" placeholder="Descreva claramente o que você precisa." required/>
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
                            <TableHead>Negociação Vinculada</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full"/></TableCell></TableRow>
                            ))
                        ) : requests.length > 0 ? (
                            requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{requestTypes.find(rt => rt.id === req.type)?.label || req.type}</TableCell>
                                    <TableCell>{users.find(u => u.id === req.requestingUserId)?.name || 'Desconhecido'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{negotiations.find(n => n.id === req.negotiationId)?.property || 'N/A'}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma solicitação jurídica encontrada.</TableCell></TableRow>
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

    // Estados para modais
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
            setProperties(propData.filter(p => p.status === 'Disponível')); // Apenas imóveis disponíveis
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
            // Poderíamos adicionar a lógica para buscar e exibir os pagamentos aqui
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
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openPaymentModal(c)}>
                                            <Wallet className="mr-2 h-4 w-4" /> Registrar Pagamento
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


export default function ServicesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Outros Serviços</h1>
                <p className="text-muted-foreground">Gerencie serviços adicionais oferecidos pela imobiliária.</p>
            </div>

            <Tabs defaultValue={services[0].id} className="w-full">
                <TabsList className="flex-wrap h-auto">
                    {services.map(service => (
                        <TabsTrigger key={service.id} value={service.id}>{service.label}</TabsTrigger>
                    ))}
                </TabsList>

                 <TabsContent value="rental">
                    <RentalTabContent />
                </TabsContent>

                <TabsContent value="juridico">
                    <LegalTabContent />
                </TabsContent>

                {services.filter(s => s.id !== 'juridico' && s.id !== 'rental').map(service => {
                    const Icon = service.icon;
                    return (
                        <TabsContent key={service.id} value={service.id}>
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Icon className="h-6 w-6" />
                                        <span>{service.label}</span>
                                    </CardTitle>
                                    <CardDescription>
                                        {service.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                                    <p className="text-muted-foreground">O módulo de <span className="font-semibold">{service.label}</span> será implementado em breve.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
