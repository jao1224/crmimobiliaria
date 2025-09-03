
"use client";

import { useState, useEffect, useContext } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, History, Briefcase, Landmark, Trash2, PlusCircle, UserPlus, Handshake, Link as LinkIcon, FileText, Building } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addClient, addLead, getClients, getLeads, convertLeadToClient, deleteClient, type Client, type Lead, getConstrutoras, addConstrutora, type Construtora } from "@/lib/crm-data";
import { getFinancingProcesses, getNegotiations, type FinancingProcess, type Negotiation } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ProfileContext } from "@/contexts/ProfileContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type CrmTab = "leads" | "clients" | "construtoras";
const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);


export default function CrmPage() {
    const { activeProfile } = useContext(ProfileContext);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [leads, setLeads] = useState<Lead[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [construtoras, setConstrutoras] = useState<Construtora[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLeadDialogOpen, setLeadDialogOpen] = useState(false);
    const [isClientDialogOpen, setClientDialogOpen] = useState(false);
    const [isConstrutoraDialogOpen, setIsConstrutoraDialogOpen] = useState(false);
    const { toast } = useToast();
    
    const [activeTab, setActiveTab] = useState<CrmTab>("leads");

    // Estados para os Modais
    const [isHistoryOpen, setHistoryOpen] = useState(false);
    const [isDetailOpen, setDetailOpen] = useState(false);
    const [isConvertLeadOpen, setConvertLeadOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
            const [leadsData, clientsData, construtorasData] = await Promise.all([
                getLeads(),
                getClients(),
                getConstrutoras(),
            ]);

            const canSeeAll = activeProfile === 'Admin' || activeProfile === 'Imobiliária';
            
            if (canSeeAll || !currentUser?.displayName) {
                setLeads(leadsData);
                setClients(clientsData);
            } else {
                // Filtra para mostrar apenas os itens atribuídos ao usuário logado
                const myLeads = leadsData.filter(lead => lead.assignedTo === currentUser.displayName);
                const myClients = clientsData.filter(client => client.assignedTo === currentUser.displayName);
                
                setLeads(myLeads);
                setClients(myClients);
            }
            setConstrutoras(construtorasData);

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
    
    const handleShowDetails = (client: Client) => {
        setSelectedClient(client);
        setDetailOpen(true);
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

        const form = event.currentTarget;
        const formData = new FormData(form);
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
            form.reset();
            setLeadDialogOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o lead." });
        }
    };

    const handleAddClient = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
         if (!currentUser) return;
        const form = event.currentTarget;
        const formData = new FormData(form);
        const newClientData: Omit<Client, 'id'> = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            source: "Cadastro Direto",
            assignedTo: currentUser.displayName || 'N/A',
            document: formData.get("document") as string,
            civilStatus: formData.get("civilStatus") as Client['civilStatus'],
            birthDate: formData.get("birthDate") as string,
            profession: formData.get("profession") as string,
            address: formData.get("address") as string,
            monthlyIncome: parseFloat(formData.get("monthlyIncome") as string),
            bankInfo: formData.get("bankInfo") as string,
        };
        
        try {
            await addClient(newClientData);
            await refreshData();
            toast({ title: "Sucesso!", description: "Cliente adicionado com sucesso." });
            form.reset();
            setClientDialogOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o cliente." });
        }
    };

    const handleAddConstrutora = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const newConstrutoraData: Omit<Construtora, 'id'> = {
            name: formData.get("name") as string,
            cnpj: formData.get("cnpj") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            address: formData.get("address") as string,
            responsible: formData.get("responsible") as string,
        };

        try {
            await addConstrutora(newConstrutoraData);
            await refreshData();
            toast({ title: "Sucesso!", description: "Construtora adicionada com sucesso." });
            form.reset();
            setIsConstrutoraDialogOpen(false);
        } catch (error) {
             toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar a construtora." });
        }
    };
    
    const handleOpenConvertDialog = (lead: Lead) => {
        setLeadToConvert(lead);
        setConvertLeadOpen(true);
    };

    const handleConfirmConvertLead = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!leadToConvert) return;
        
        const form = event.currentTarget;
        const formData = new FormData(form);
        
        const clientData: Omit<Client, 'id'> = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            source: leadToConvert.source,
            assignedTo: leadToConvert.assignedTo,
            document: formData.get("document") as string,
            civilStatus: formData.get("civilStatus") as Client['civilStatus'],
            birthDate: formData.get("birthDate") as string,
            profession: formData.get("profession") as string,
            address: formData.get("address") as string,
            monthlyIncome: parseFloat(formData.get("monthlyIncome") as string),
            bankInfo: formData.get("bankInfo") as string,
        };

        try {
            await convertLeadToClient(leadToConvert.id, clientData);
            await refreshData();
            toast({
                title: "Conversão Realizada!",
                description: `"${leadToConvert.name}" agora é um cliente.`
            });
            setConvertLeadOpen(false);
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Erro na Conversão",
                description: "Não foi possível converter o lead em cliente.",
            });
        }
    };


    const handleOpenDeleteDialog = (client: Client) => {
        setClientToDelete(client);
        setDeleteDialogOpen(true);
    };
    
    const handleDeleteClientConfirm = async () => {
        if (!clientToDelete) return;
        try {
            await deleteClient(clientToDelete.id);
            await refreshData();
            toast({ title: "Cliente Excluído", description: `O cliente "${clientToDelete.name}" e todos os seus dados foram removidos.`});
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o cliente." });
        } finally {
            setDeleteDialogOpen(false);
            setClientToDelete(null);
        }
    };
    
    const renderAddButton = () => {
        switch (activeTab) {
            case 'leads':
                return (
                    <Dialog open={isLeadDialogOpen} onOpenChange={setLeadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lead</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Lead</DialogTitle>
                                <DialogDescription>Preencha os detalhes abaixo para criar um novo lead.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddLead}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name-lead" className="text-right">Nome</Label><Input id="name-lead" name="name" className="col-span-3" required /></div>
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email-lead" className="text-right">E-mail</Label><Input id="email-lead" name="email" type="email" className="col-span-3" required /></div>
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone-lead" className="text-right">Telefone</Label><Input id="phone-lead" name="phone" className="col-span-3" required /></div>
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="source-lead" className="text-right">Fonte</Label><Input id="source-lead" name="source" className="col-span-3" required /></div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setLeadDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit">Salvar Lead</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                );
            case 'clients':
                 return (
                    <Dialog open={isClientDialogOpen} onOpenChange={setClientDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><UserPlus className="mr-2 h-4 w-4" /> Adicionar Cliente</Button>
                        </DialogTrigger>
                         <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                                <DialogDescription>Preencha os detalhes abaixo para criar um novo cliente diretamente.</DialogDescription>
                            </DialogHeader>
                            <form id="addClientForm" onSubmit={handleAddClient}>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-4 rounded-lg border p-4"><h3 className="text-lg font-medium">Informações Pessoais</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="name-client">Nome Completo</Label><Input id="name-client" name="name" required /></div><div className="space-y-2"><Label htmlFor="document-client">CPF / CNPJ</Label><Input id="document-client" name="document" /></div><div className="space-y-2"><Label htmlFor="birthDate-client">Data de Nascimento</Label><Input id="birthDate-client" name="birthDate" type="date" /></div><div className="space-y-2"><Label htmlFor="profession-client">Profissão</Label><Input id="profession-client" name="profession" /></div><div className="space-y-2"><Label htmlFor="civilStatus-client">Estado Civil</Label><Select name="civilStatus"><SelectTrigger id="civilStatus-client"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem><SelectItem value="Casado(a)">Casado(a)</SelectItem><SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem><SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem><SelectItem value="União Estável">União Estável</SelectItem></SelectContent></Select></div></div></div>
                                    <div className="space-y-4 rounded-lg border p-4"><h3 className="text-lg font-medium">Contato e Endereço</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="email-client">E-mail</Label><Input id="email-client" name="email" type="email" required/></div><div className="space-y-2"><Label htmlFor="phone-client">Telefone / WhatsApp</Label><Input id="phone-client" name="phone" required/></div></div><div className="space-y-2"><Label htmlFor="address-client">Endereço Completo</Label><Input id="address-client" name="address" placeholder="Rua, número, bairro, cidade, CEP" /></div></div>
                                    <div className="space-y-4 rounded-lg border p-4"><h3 className="text-lg font-medium">Informações Financeiras</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="monthlyIncome-client">Renda Mensal (R$)</Label><Input id="monthlyIncome-client" name="monthlyIncome" type="number" step="0.01" placeholder="5000.00" /></div><div className="space-y-2"><Label htmlFor="bankInfo-client">Conta Bancária (PIX)</Label><Input id="bankInfo-client" name="bankInfo" placeholder="Chave PIX ou dados da conta"/></div></div></div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setClientDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit" form="addClientForm">Salvar Cliente</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                );
             case 'construtoras':
                return (
                    <Dialog open={isConstrutoraDialogOpen} onOpenChange={setIsConstrutoraDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Building className="mr-2 h-4 w-4" /> Adicionar Construtora</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Nova Construtora</DialogTitle>
                                <DialogDescription>Preencha os detalhes da construtora.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddConstrutora}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2"><Label htmlFor="name-construtora">Nome da Construtora</Label><Input id="name-construtora" name="name" required /></div>
                                    <div className="space-y-2"><Label htmlFor="cnpj-construtora">CNPJ</Label><Input id="cnpj-construtora" name="cnpj" required /></div>
                                    <div className="space-y-2"><Label htmlFor="email-construtora">E-mail</Label><Input id="email-construtora" name="email" type="email" required /></div>
                                    <div className="space-y-2"><Label htmlFor="phone-construtora">Telefone</Label><Input id="phone-construtora" name="phone" required /></div>
                                    <div className="space-y-2"><Label htmlFor="address-construtora">Endereço</Label><Input id="address-construtora" name="address" required /></div>
                                    <div className="space-y-2"><Label htmlFor="responsible-construtora">Responsável</Label><Input id="responsible-construtora" name="responsible" /></div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsConstrutoraDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit">Salvar Construtora</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                );
            default:
                return null;
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
                    {renderAddButton()}
                </div>
            </div>
            <Tabs defaultValue="leads" onValueChange={(value) => setActiveTab(value as CrmTab)}>
                <TabsList>
                    <TabsTrigger value="leads">Leads</TabsTrigger>
                    <TabsTrigger value="clients">Clientes</TabsTrigger>
                    <TabsTrigger value="construtoras">Construtoras</TabsTrigger>
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
                                            <TableRow key={lead.id} className={cn("transition-all duration-200 hover:bg-secondary")}>
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
                                                            <DropdownMenuItem onClick={() => handleOpenConvertDialog(lead)}>Converter em Cliente</DropdownMenuItem>
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
                                            <TableRow key={client.id} onClick={() => handleShowDetails(client)} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary")}>
                                                <TableCell className="font-medium">{client.name}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{client.email}</TableCell>
                                                <TableCell className="hidden md:table-cell">{client.phone}</TableCell>
                                                <TableCell className="hidden lg:table-cell">{client.source}</TableCell>
                                                <TableCell>{client.assignedTo}</TableCell>
                                                <TableCell>
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onSelect={() => handleShowHistory(client)}>
                                                                <History className="mr-2 h-4 w-4"/>Ver Histórico
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onSelect={() => handleOpenDeleteDialog(client)} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir Cliente
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
                 <TabsContent value="construtoras">
                    <Card>
                        <CardHeader>
                            <CardTitle>Construtoras</CardTitle>
                            <CardDescription>Lista de construtoras e parceiros de empreendimentos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome da Construtora</TableHead>
                                        <TableHead>CNPJ</TableHead>
                                        <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                                        <TableHead className="hidden md:table-cell">Telefone</TableHead>
                                        <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : construtoras.length > 0 ? (
                                        construtoras.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell>{c.cnpj}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{c.email}</TableCell>
                                                <TableCell className="hidden md:table-cell">{c.phone}</TableCell>
                                                <TableCell className="hidden lg:table-cell">{c.responsible}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                     ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">Nenhuma construtora cadastrada.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        
        {/* Modal de Detalhes do Cliente */}
         <Dialog open={isDetailOpen} onOpenChange={setDetailOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh]">
                {selectedClient && (
                    <>
                    <DialogHeader>
                        <DialogTitle>Detalhes do Cliente</DialogTitle>
                        <DialogDescription>
                            Informações completas de {selectedClient.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-6 pr-6 py-4">
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold text-lg">Informações Pessoais</h3>
                                 <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><Label className="text-muted-foreground">Nome</Label><p>{selectedClient.name}</p></div>
                                    <div><Label className="text-muted-foreground">CPF/CNPJ</Label><p>{selectedClient.document || "Não informado"}</p></div>
                                    <div><Label className="text-muted-foreground">Data de Nascimento</Label><p>{selectedClient.birthDate ? new Date(selectedClient.birthDate + "T00:00:00").toLocaleDateString('pt-BR') : "Não informado"}</p></div>
                                    <div><Label className="text-muted-foreground">Estado Civil</Label><p>{selectedClient.civilStatus || "Não informado"}</p></div>
                                    <div><Label className="text-muted-foreground">Profissão</Label><p>{selectedClient.profession || "Não informado"}</p></div>
                                 </div>
                            </div>
                             <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold text-lg">Contato e Origem</h3>
                                 <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><Label className="text-muted-foreground">E-mail</Label><p>{selectedClient.email}</p></div>
                                    <div><Label className="text-muted-foreground">Telefone</Label><p>{selectedClient.phone}</p></div>
                                    <div className="col-span-2"><Label className="text-muted-foreground">Endereço</Label><p>{selectedClient.address || "Não informado"}</p></div>
                                    <div><Label className="text-muted-foreground">Fonte</Label><p>{selectedClient.source}</p></div>
                                    <div><Label className="text-muted-foreground">Corretor Responsável</Label><p>{selectedClient.assignedTo}</p></div>
                                 </div>
                            </div>
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold text-lg">Informações Financeiras</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <Label className="text-muted-foreground">Renda Mensal</Label>
                                        <p>{selectedClient.monthlyIncome ? formatCurrency(selectedClient.monthlyIncome) : "Não informado"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Conta Bancária (PIX)</Label>
                                        <p>{selectedClient.bankInfo || "Não informado"}</p>
                                    </div>
                                </div>
                            </div>
                             <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold text-lg">Documentos Anexados</h3>
                                <div className="text-sm text-muted-foreground space-y-2">
                                  {(selectedClient.documentUrls && selectedClient.documentUrls.length > 0) ? (
                                    selectedClient.documentUrls.map((doc, index) => (
                                        <a 
                                            key={index}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                                        >
                                            <FileText className="h-5 w-5 text-primary" />
                                            <span className="truncate text-foreground hover:underline">{doc.name}</span>
                                            <LinkIcon className="h-4 w-4 ml-auto" />
                                        </a>
                                    ))
                                  ) : (
                                    <p>Nenhum documento anexado a este cliente.</p>
                                  )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                         <Button variant="secondary" onClick={() => { setDetailOpen(false); handleShowHistory(selectedClient); }}>
                            <History className="mr-2 h-4 w-4"/>Ver Histórico
                        </Button>
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>Fechar</Button>
                    </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>


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
        
        {/* Modal de Conversão de Lead */}
        {leadToConvert && (
            <Dialog open={isConvertLeadOpen} onOpenChange={setConvertLeadOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Converter Lead em Cliente</DialogTitle>
                        <DialogDescription>Complete as informações de "{leadToConvert.name}" para convertê-lo em um cliente.</DialogDescription>
                    </DialogHeader>
                    <form id="convertLeadForm" onSubmit={handleConfirmConvertLead}>
                        <div className="space-y-6 py-4">
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="text-lg font-medium">Informações Pessoais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="name-convert">Nome Completo</Label><Input id="name-convert" name="name" required defaultValue={leadToConvert.name} /></div>
                                    <div className="space-y-2"><Label htmlFor="document-convert">CPF / CNPJ</Label><Input id="document-convert" name="document" /></div>
                                    <div className="space-y-2"><Label htmlFor="birthDate-convert">Data de Nascimento</Label><Input id="birthDate-convert" name="birthDate" type="date" /></div>
                                    <div className="space-y-2"><Label htmlFor="profession-convert">Profissão</Label><Input id="profession-convert" name="profession" /></div>
                                    <div className="space-y-2"><Label htmlFor="civilStatus-convert">Estado Civil</Label><Select name="civilStatus"><SelectTrigger id="civilStatus-convert"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem><SelectItem value="Casado(a)">Casado(a)</SelectItem><SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem><SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem><SelectItem value="União Estável">União Estável</SelectItem></SelectContent></Select></div>
                                </div>
                            </div>
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="text-lg font-medium">Contato e Endereço</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="email-convert">E-mail</Label><Input id="email-convert" name="email" type="email" required defaultValue={leadToConvert.email} /></div>
                                    <div className="space-y-2"><Label htmlFor="phone-convert">Telefone / WhatsApp</Label><Input id="phone-convert" name="phone" required defaultValue={leadToConvert.phone}/></div>
                                </div>
                                <div className="space-y-2"><Label htmlFor="address-convert">Endereço Completo</Label><Input id="address-convert" name="address" placeholder="Rua, número, bairro, cidade, CEP" /></div>
                            </div>
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="text-lg font-medium">Informações Financeiras</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="monthlyIncome-convert">Renda Mensal (R$)</Label><Input id="monthlyIncome-convert" name="monthlyIncome" type="number" step="0.01" placeholder="5000.00" /></div>
                                    <div className="space-y-2"><Label htmlFor="bankInfo-convert">Conta Bancária (PIX)</Label><Input id="bankInfo-convert" name="bankInfo" placeholder="Chave PIX ou dados da conta"/></div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setConvertLeadOpen(false)}>Cancelar</Button>
                            <Button type="submit" form="convertLeadForm">Confirmar Conversão</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        )}
        
         <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente
                        "{clientToDelete?.name}" e todas as suas negociações associadas.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteClientConfirm}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                    >
                        Excluir Cliente
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}
