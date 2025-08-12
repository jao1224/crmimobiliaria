
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
import type { UserProfile } from "../layout";

const initialLeads = [
    { id: "L001", name: "João Silva", source: "Website", status: "Novo", assignedTo: "Joana Doe" },
    { id: "L002", name: "Maria Garcia", source: "Indicação", status: "Contactado", assignedTo: "Joana Doe" },
    { id: "L003", name: "David Johnson", source: "Campanha", status: "Qualificado", assignedTo: "João Roe" },
];

const initialDeals = [
    { id: "D001", property: "Apartamento Sunnyvale", client: "Alice Williams", stage: "Proposta Enviada", value: 750000, closeDate: "15/08/2024" },
    { id: "D002", property: "Loft no Centro", client: "Bob Brown", stage: "Negociação", value: 500000, closeDate: "30/07/2024" },
];

export default function CrmPage({ activeProfile }: { activeProfile?: UserProfile }) {
    const [leads, setLeads] = useState(initialLeads);
    const [deals, setDeals] = useState(initialDeals);
    const [isLeadDialogOpen, setLeadDialogOpen] = useState(false);
    const [isDealDialogOpen, setDealDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleAddLead = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newLead = {
            id: `L${String(leads.length + 1).padStart(3, '0')}`,
            name: formData.get("name") as string,
            source: formData.get("source") as string,
            status: "Novo",
            assignedTo: formData.get("assignedTo") as string,
        };
        setLeads([...leads, newLead]);
        setLeadDialogOpen(false);
        toast({ title: "Sucesso!", description: "Lead adicionado com sucesso." });
    };
    
    const handleAddDeal = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newDeal = {
            id: `D${String(deals.length + 1).padStart(3, '0')}`,
            property: formData.get("property") as string,
            client: formData.get("client") as string,
            stage: "Proposta Enviada",
            value: Number(formData.get("value")),
            closeDate: formData.get("closeDate") as string,
        };
        setDeals([...deals, newDeal]);
        setDealDialogOpen(false);
        toast({ title: "Sucesso!", description: "Negócio adicionado com sucesso." });
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
                                    {leads.map(lead => (
                                        <TableRow key={lead.id}>
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
                                                        <DropdownMenuItem onClick={() => toast({ description: `"${lead.name}" convertido em negócio.` })}>Converter em Negócio</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toast({ description: `Status de "${lead.name}" atualizado.` })}>Atualizar Status</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                                    {deals.map(deal => (
                                        <TableRow key={deal.id}>
                                            <TableCell className="font-medium">{deal.property}</TableCell>
                                            <TableCell>{deal.client}</TableCell>
                                            <TableCell><Badge variant="outline">{deal.stage}</Badge></TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}</TableCell>
                                            <TableCell>{new Date(deal.closeDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                                        </TableRow>
                                    ))}
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
                            <p>A lista de clientes será exibida aqui.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
