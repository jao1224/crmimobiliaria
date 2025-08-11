import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const leads = [
    { id: "L001", name: "João Silva", source: "Website", status: "Novo", assignedTo: "Joana Doe" },
    { id: "L002", name: "Maria Garcia", source: "Indicação", status: "Contactado", assignedTo: "Joana Doe" },
    { id: "L003", name: "David Johnson", source: "Campanha", status: "Qualificado", assignedTo: "João Roe" },
];

const deals = [
    { id: "D001", property: "Apartamento Sunnyvale", client: "Alice Williams", stage: "Proposta Enviada", value: 750000, closeDate: "15/08/2024" },
    { id: "D002", property: "Loft no Centro", client: "Bob Brown", stage: "Negociação", value: 500000, closeDate: "30/07/2024" },
];

export default function CrmPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestão de Clientes e Leads</h1>
                    <p className="text-muted-foreground">Supervisione seus leads, negócios e relacionamentos com clientes.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Adicionar Lead</Button>
                    <Button>Novo Negócio</Button>
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
                                                        <DropdownMenuItem>Converter em Negócio</DropdownMenuItem>
                                                        <DropdownMenuItem>Atualizar Status</DropdownMenuItem>
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
                                            <TableCell>{deal.closeDate}</TableCell>
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
