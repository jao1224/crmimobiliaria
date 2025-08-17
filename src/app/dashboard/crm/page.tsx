
"use client";

import { useState } from "react";
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
import { addClient, addDeal, addLead, getClients, getDeals, getLeads, type Client, type Deal, type Lead } from "@/lib/crm-data";
import { cn } from "@/lib/utils";

export default function CrmPage() {
    const [leads, setLeads] = useState<Lead[]>(getLeads());
    const [deals, setDeals] = useState<Deal[]>(getDeals());
    const [clients, setClients] = useState<Client[]>(getClients());
    const [isLeadDialogOpen, setLeadDialogOpen] = useState(false);
    const [isDealDialogOpen, setDealDialogOpen] = useState(false);
    const { toast } = useToast();

    // Simula a adição de um novo lead
    const handleAddLead = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newLead: Lead = {
            id: `lead${Date.now()}`,
            name: formData.get("name") as string,
            source: formData.get("source") as string,
            status: "Novo",
            assignedTo: formData.get("assignedTo") as string,
        };
        addLead(newLead);
        setLeads(getLeads()); // Recarrega os leads para incluir o novo
        toast({ title: "Sucesso!", description: "Lead adicionado com sucesso." });
        setLeadDialogOpen(false);
    };
    
    // Simula a adição de um novo negócio
    const handleAddDeal = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newDeal: Deal = {
            id: `deal${Date.now()}`,
            property: formData.get("property") as string,
            client: formData.get("client") as string,
            stage: "Proposta Enviada",
            value: Number(formData.get("value")),
            closeDate: formData.get("closeDate") as string,
        };
        addDeal(newDeal);
        setDeals(getDeals()); // Recarrega os negócios para incluir o novo
        toast({ title: "Sucesso!", description: "Negócio adicionado com sucesso." });
        setDealDialogOpen(false);
    };

    // Simula a conversão de lead em cliente
    const handleConvertLeadToClient = (lead: Lead) => {
        const newClient: Client = {
            id: `client${Date.now()}`,
            name: lead.name,
            source: lead.source,
            assignedTo: lead.assignedTo,
        };
        addClient(newClient);
        setClients(getClients());
        // Remove o lead da lista original
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        toast({
            title: "Conversão Realizada!",
            description: `"${lead.name}" agora é um cliente.`
        });
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
                                        <Label htmlFor="name" className="text-right">Nome</Label>
                                        <Input id="name" name="name" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="source" className="text-right">Fonte</Label>
                                        <Input id="source" name="source" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="assignedTo" className="text-right">Atribuído a</Label>
                                        <Input id="assignedTo" name="assignedTo" className="col-span-3" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Salvar Lead</Button>
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
                                    {leads.length > 0 ? (
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
                                    {deals.length > 0 ? (
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
                                    {clients.length > 0 ? (
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
