
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addClient, addDeal, addLead, getClients, getDeals, getLeads, convertLeadToClient, type Client, type Deal, type Lead } from "@/lib/crm-data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function CrmPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLeadDialogOpen, setLeadDialogOpen] = useState(false);
    const [isDealDialogOpen, setDealDialogOpen] = useState(false);
    const [isClientDialogOpen, setClientDialogOpen] = useState(false);
    const { toast } = useToast();

    // Carrega os dados iniciais
    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [leadsData, dealsData, clientsData] = await Promise.all([
                getLeads(),
                getDeals(),
                getClients(),
            ]);
            setLeads(leadsData);
            setDeals(dealsData);
            setClients(clientsData);
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

    // Simula a adição de um novo lead
    const handleAddLead = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newLeadData = {
            name: formData.get("name") as string,
            source: formData.get("source") as string,
            status: "Novo",
            assignedTo: formData.get("assignedTo") as string,
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
        const formData = new FormData(event.currentTarget);
        const newClientData = {
            name: formData.get("name") as string,
            source: formData.get("source") as string,
            assignedTo: formData.get("assignedTo") as string,
            document: formData.get("document") as string,
            address: formData.get("address") as string,
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
                                        <Label htmlFor="source-lead" className="text-right">Fonte</Label>
                                        <Input id="source-lead" name="source" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="assignedTo-lead" className="text-right">Atribuído a</Label>
                                        <Input id="assignedTo-lead" name="assignedTo" className="col-span-3" required />
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
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                                <DialogDescription>Preencha os detalhes abaixo para criar um novo cliente diretamente.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddClient}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name-client" className="text-right">Nome</Label>
                                        <Input id="name-client" name="name" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="source-client" className="text-right">Fonte</Label>
                                        <Input id="source-client" name="source" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="assignedTo-client" className="text-right">Atribuído a</Label>
                                        <Input id="assignedTo-client" name="assignedTo" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="document-client" className="text-right">Documento</Label>
                                        <Input id="document-client" name="document" placeholder="CPF ou CNPJ" className="col-span-3" />
                                    </div>
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="address-client" className="text-right">Endereço</Label>
                                        <Input id="address-client" name="address" placeholder="Endereço do cliente" className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
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
                                                <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : leads.length > 0 ? (
                                        leads.map(lead => (
                                            <TableRow key={lead.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                                <TableCell className="font-medium">{lead.name}</TableCell>
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
                                            <TableCell colSpan={5} className="h-24 text-center">Nenhum lead encontrado.</TableCell>
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
                                        <TableHead>Fonte Original</TableHead>
                                        <TableHead>Atribuído a</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : clients.length > 0 ? (
                                        clients.map(client => (
                                            <TableRow key={client.id} className={cn("transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1")}>
                                                <TableCell className="font-medium">{client.name}</TableCell>
                                                <TableCell>{client.source}</TableCell>
                                                <TableCell>{client.assignedTo}</TableCell>
                                                <TableCell>
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                     ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">Nenhum cliente cadastrado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
