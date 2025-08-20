
"use client";

import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, History, Briefcase, Landmark } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addClient, addDeal, addLead, getClients, getDeals, getLeads, convertLeadToClient, type Client, type Deal, type Lead } from "@/lib/crm-data";
import { getFinancingProcesses, getNegotiations, type FinancingProcess, type Negotiation } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ProfileContext } from "@/contexts/ProfileContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CrmPage() {
    const { activeProfile } = useContext(ProfileContext);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [leads, setLeads] = useState<Lead[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLeadDialogOpen, setLeadDialogOpen] = useState(false);
    const [isDealDialogOpen, setDealDialogOpen] = useState(false);
    const [isClientDialogOpen, setClientDialogOpen] = useState(false);
    const { toast } = useToast();

    // Estados para o Histórico do Cliente
    const [isHistoryOpen, setHistoryOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientHistory, setClientHistory] = useState<{ negotiations: Negotiation[], financings: FinancingProcess[] }>({ negotiations: [], financings: [] });
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    
     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Carrega os dados iniciais
    useEffect(() => {
        if (currentUser !== undefined) {
             refreshData();
        }
    }, [currentUser, activeProfile]);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [leadsData, dealsData, clientsData] = await Promise.all([
                getLeads(),
                getDeals(),
                getClients(),
            ]);

            const canSeeAll = activeProfile === 'Admin' || activeProfile === 'Imobiliária';
            
            if (canSeeAll || !currentUser?.displayName) {
                setLeads(leadsData);
                setDeals(dealsData);
                setClients(clientsData);
            } else {
                // Filtra para mostrar apenas os itens atribuídos ao usuário logado
                const myLeads = leadsData.filter(lead => lead.assignedTo === currentUser.displayName);
                const myClients = clientsData.filter(client => client.assignedTo === currentUser.displayName);
                // Para negócios, a lógica pode ser mais complexa. Por enquanto, mantemos todos visíveis ou filtramos por cliente.
                const myDeals = dealsData.filter(deal => myClients.some(c => c.name === deal.client));

                setLeads(myLeads);
                setDeals(myDeals);
                setClients(myClients);
            }

        } catch (error) {
            console.error("Failed to fetch CRM data:", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar dados",
                description: "Não foi possível buscar os dados do CRM.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleShowHistory = async (client: Client) => {
        setSelectedClient(client);
        setHistoryOpen(true);
        setIsHistoryLoading(true);
        try {
            const [allNegotiations, allFinancings] = await Promise.all([
                getNegotiations(),
                getFinancingProcesses()
            ]);
            const clientNegotiations = allNegotiations.filter(n => n.clientId === client.id);
            const negotiationIds = clientNegotiations.map(n => n.id);
            const clientFinancings = allFinancings.filter(f => negotiationIds.includes(f.negotiationId));

            setClientHistory({ negotiations: clientNegotiations, financings: clientFinancings });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível buscar o histórico do cliente."});
        } finally {
            setIsHistoryLoading(false);
        }
    };

    // Simula a adição de um novo lead
    const handleAddLead = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentUser) return;

        const formData = new FormData(event.currentTarget);
        const newLeadData: Omit<Lead, 'id'> = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            source: formData.get("source") as string,
            status: "Novo",
            assignedTo: currentUser.displayName || 'N/A', // Atribui ao usuário logado
        };
        
        try {
            await addLead(newLeadData);
            await refreshData();
            toast({ title: "Sucesso!", description: "Lead adicionado com sucesso." });
            setLeadDialogOpen(false);
            (event.target as HTMLFormElement).reset();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o lead." });
        }
    };

    const handleAddClient = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
         if (!currentUser) return;
        const formData = new FormData(event.currentTarget);
        const newClientData: Omit<Client, 'id'> = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            source: "Cadastro Direto",
            assignedTo: currentUser.displayName || 'N/A',
            document: formData.get("document") as string,
            civilStatus: formData.get("civilStatus") as Client['civilStatus'],
            birthDate: formData.get("birthDate") as string,
            address: formData.get("address") as string,
            monthlyIncome: parseFloat(formData.get("monthlyIncome") as string),
        };
        
        try {
            await addClient(newClientData);
            await refreshData();
            toast({ title: "Sucesso!", description: "Cliente adicionado com sucesso." });
            setClientDialogOpen(false);
            (event.target as HTMLFormElement).reset();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o cliente." });
        }
    };
    
    // Simula a adição de um novo negócio
    const handleAddDeal = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newDealData = {
            property: formData.get("property") as string,
            client: formData.get("client") as string,
            stage: "Proposta Enviada",
            value: Number(formData.get("value")),
            closeDate: formData.get("closeDate") as string,
        };
        
        try {
            await addDeal(newDealData);
            await refreshData();
            toast({ title: "Sucesso!", description: "Negócio adicionado com sucesso." });
            setDealDialogOpen(false);
            (event.target as HTMLFormElement).reset();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o negócio." });
        }
    };

    // Simula a conversão de lead em cliente
    const handleConvertLeadToClient = async (lead: Lead) => {
        try {
            await convertLeadToClient(lead);
            await refreshData();
            toast({
                title: "Conversão Realizada!",
                description: `"${lead.name}" agora é um cliente.`
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Erro na Conversão",
                description: "Não foi possível converter o lead em cliente.",
            });
        }
    };

    return (
        <>
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestão de Clientes e Leads</h1>
                    <p className="text-muted-foreground">Supervisione seus leads, negócios e relacionamentos com clientes.</p>
                </div>
                <div className="flex gap-2">
                     <Dialog open={isLeadDialogOpen} onOpenChange={setLeadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">Adicionar Lead</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Lead</DialogTitle>
                                <DialogDescription>Preencha os detalhes abaixo para criar um novo lead.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddLead}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name-lead" className="text-right">Nome</Label>
                                        <Input id="name-lead" name="name" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="email-lead" className="text-right">E-mail</Label>
                                        <Input id="email-lead" name="email" type="email" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="phone-lead" className="text-right">Telefone</Label>
                                        <Input id="phone-lead" name="phone" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="source-lead" className="text-right">Fonte</Label>
                                        <Input id="source-lead" name="source" className="col-span-3" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Salvar Lead</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isClientDialogOpen} onOpenChange={setClientDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">Adicionar Cliente</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                                <DialogDescription>Preencha os detalhes abaixo para criar um novo cliente diretamente.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddClient} className="flex-1 min-h-0">
                                <ScrollArea className="h-full pr-6 -mr-6">
                                    <div className="space-y-6 py-4">
                                        {/* Informações Pessoais */}
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <h3 className="text-lg font-medium">Informações Pessoais</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name-client">Nome Completo</Label>
                                                    <Input id="name-client" name="name" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="document-client">CPF / CNPJ</Label>
                                                    <Input id="document-client" name="document" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="birthDate-client">Data de Nascimento</Label>
                                                    <Input id="birthDate-client" name="birthDate" type="date" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="civilStatus-client">Estado Civil</Label>
                                                    <Select name="civilStatus">
                                                        <SelectTrigger id="civilStatus-client"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                                                            <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                                                            <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                                                            <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                                                            <SelectItem value="União Estável">União Estável</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Informações de Contato */}
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <h3 className="text-lg font-medium">Contato e Endereço</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email-client">E-mail</Label>
                                                    <Input id="email-client" name="email" type="email" required/>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="phone-client">Telefone / WhatsApp</Label>
                                                    <Input id="phone-client" name="phone" required/>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address-client">Endereço Completo</Label>
                                                <Input id="address-client" name="address" placeholder="Rua, número, bairro, cidade, CEP" />
                                            </div>
                                        </div>
                                        
                                        {/* Informações Financeiras */}
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <h3 className="text-lg font-medium">Informações Financeiras</h3>
                                             <div className="space-y-2">
                                                <Label htmlFor="monthlyIncome-client">Renda Mensal Comprovada (R$)</Label>
                                                <Input id="monthlyIncome-client" name="monthlyIncome" type="number" step="0.01" placeholder="5000.00" />
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                                <DialogFooter className="mt-4 pt-4 border-t bg-background">
                                    <Button type="submit">Salvar Cliente</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isDealDialogOpen} onOpenChange={setDealDialogOpen}>
                        <DialogTrigger asChild>
                             <Button>Novo Negócio</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Novo Negócio</DialogTitle>
                                <DialogDescription>Preencha os detalhes para registrar um novo negócio.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddDeal}>
                                <div className="grid gap-4 py-4">
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="property" className="text-right">Imóvel</Label>
                                        <Input id="property" name="property" className="col-span-3" required />
                                    </div>
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="client" className="text-right">Cliente</Label>
                                        <Input id="client" name="client" className="col-span-3" required />
                                    </div>
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="value" className="text-right">Valor</Label>
                                        <Input id="value" name="value" type="number" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="closeDate" className="text-right">Data Estimada</Label>
                                        <Input id="closeDate" name="closeDate" type="date" className="col-span-3" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Salvar Negócio</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Tabs defaultValue="leads">
                <TabsList>
                    <TabsTrigger value="leads">Leads</TabsTrigger>
                    <TabsTrigger value="deals">Negócios em Andamento</TabsTrigger>
                    <TabsTrigger value="clients">Clientes</TabsTrigger>
                </TabsList>
                <TabsContent value="leads">
                    <Card>
                        <CardHeader>
                            <CardTitle>Novos Leads</CardTitle>
                            <CardDescription>Leads recém-adquiridos que precisam ser contatados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="hidden md:table-cell">E-mail</TableHead>
                                        <TableHead className="hidden md:table-cell">Telefone</TableHead>
                                        <TableHead>Fonte</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Atribuído a</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : leads.length > 0 ? (
                                        leads.map(lead => (
                                            <TableRow key={lead.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                                <TableCell className="font-medium">{lead.name}</TableCell>
                                                <TableCell className="hidden md:table-cell">{lead.email}</TableCell>
                                                <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                                                <TableCell>{lead.source}</TableCell>
                                                <TableCell><Badge variant="secondary">{lead.status}</Badge></TableCell>
                                                <TableCell>{lead.assignedTo}</TableCell>
                                                <TableCell>
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleConvertLeadToClient(lead)}>Converter em Cliente</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toast({ description: `Status de "${lead.name}" atualizado.` })}>Atualizar Status</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">Nenhum lead encontrado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="deals">
                <Card>
                        <CardHeader>
                            <CardTitle>Negócios em Andamento</CardTitle>
                            <CardDescription>Negociações e processos de vendas ativos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Imóvel</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Fase</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Data Estimada</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {isLoading ? (
                                        Array.from({ length: 1 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : deals.length > 0 ? (
                                        deals.map(deal => (
                                            <TableRow key={deal.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                                <TableCell className="font-medium">{deal.property}</TableCell>
                                                <TableCell>{deal.client}</TableCell>
                                                <TableCell><Badge variant="outline">{deal.stage}</Badge></TableCell>
                                                <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}</TableCell>
                                                <TableCell>{new Date(deal.closeDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                                            </TableRow>
                                        ))
                                     ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Nenhum negócio em andamento.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="clients">
                    <Card>
                        <CardHeader>
                            <CardTitle>Clientes</CardTitle>
                            <CardDescription>Sua base de dados de clientes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                                        <TableHead className="hidden md:table-cell">Telefone</TableHead>
                                        <TableHead className="hidden lg:table-cell">Fonte Original</TableHead>
                                        <TableHead>Atribuído a</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : clients.length > 0 ? (
                                        clients.map(client => (
                                            <TableRow key={client.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                                <TableCell className="font-medium">{client.name}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{client.email}</TableCell>
                                                <TableCell className="hidden md:table-cell">{client.phone}</TableCell>
                                                <TableCell className="hidden lg:table-cell">{client.source}</TableCell>
                                                <TableCell>{client.assignedTo}</TableCell>
                                                <TableCell>
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleShowHistory(client)}>
                                                                <History className="mr-2 h-4 w-4"/>Ver Histórico
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                     ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">Nenhum cliente cadastrado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        
        {/* Modal de Histórico do Cliente */}
        <Dialog open={isHistoryOpen} onOpenChange={setHistoryOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Histórico do Cliente: {selectedClient?.name}</DialogTitle>
                    <DialogDescription>
                        Todas as negociações e processos de financiamento vinculados a este cliente.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    {isHistoryLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Briefcase className="h-5 w-5"/>Negociações</h3>
                                {clientHistory.negotiations.length > 0 ? (
                                    <div className="space-y-2">
                                        {clientHistory.negotiations.map(neg => (
                                            <div key={neg.id} className="p-3 border rounded-md bg-muted/50">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold">{neg.property}</p>
                                                    <Badge variant={neg.status === 'Finalizado' ? 'success' : 'secondary'}>{neg.status}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(neg.value)}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Vendedor: {neg.salesperson} | Captador: {neg.realtor}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">Nenhuma negociação encontrada.</p>}
                            </div>

                            <Separator/>

                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Landmark className="h-5 w-5"/>Processos de Financiamento</h3>
                                {clientHistory.financings.length > 0 ? (
                                    <div className="space-y-2">
                                    {clientHistory.financings.map(fin => (
                                        <div key={fin.id} className="p-3 border rounded-md bg-muted/50">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold">{fin.propertyName}</p>
                                                <Badge variant={fin.generalStatus === 'Concluído' ? 'success' : 'secondary'}>{fin.generalStatus}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Status do Cliente: <Badge variant={fin.clientStatus === 'Aprovado' ? 'success' : 'destructive'}>{fin.clientStatus}</Badge></p>
                                            {fin.hasPendency && <p className="text-xs text-destructive mt-1">Possui pendências</p>}
                                        </div>
                                    ))}
                                </div>
                                ) : <p className="text-sm text-muted-foreground">Nenhum processo de financiamento encontrado.</p>}
                            </div>
                        </div>
                    )}
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setHistoryOpen(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
