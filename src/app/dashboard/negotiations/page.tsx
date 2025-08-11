
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const initialNegotiations = [
    {
        id: "NEG001",
        property: "Apartamento Sunnyvale",
        client: "Alice Williams",
        stage: "Proposta Enviada",
        value: 750000,
        salesperson: "Joana Doe",
        realtor: "Carlos Pereira",
    },
    {
        id: "NEG002",
        property: "Loft no Centro",
        client: "Bob Brown",
        stage: "Negociação",
        value: 500000,
        salesperson: "João Roe",
        realtor: "Sofia Lima",
    },
     {
        id: "NEG003",
        property: "Vila Lakeside",
        client: "Charlie Davis",
        stage: "Contrato Gerado",
        value: 2500000,
        salesperson: "Joana Doe",
        realtor: "Carlos Pereira",
    },
];

export default function NegotiationsPage() {
    const [negotiations, setNegotiations] = useState(initialNegotiations);
    const [isNewNegotiationOpen, setNewNegotiationOpen] = useState(false);
    const { toast } = useToast();

    const handleAddNegotiation = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newNegotiation = {
            id: `NEG${String(negotiations.length + 1).padStart(3, '0')}`,
            property: `Imóvel: ${formData.get("property-code") as string}`,
            client: `Cliente: ${formData.get("client-doc") as string}`,
            stage: "Proposta Enviada",
            value: Number(formData.get("value")),
            salesperson: "Joana Doe", // Placeholder
            realtor: "Carlos Pereira", // Placeholder
        };
        setNegotiations([newNegotiation, ...negotiations]);
        setNewNegotiationOpen(false);
        toast({ title: "Sucesso!", description: "Nova negociação iniciada." });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Processos de Negociação</h1>
                    <p className="text-muted-foreground">Acompanhe e gerencie todas as suas negociações ativas.</p>
                </div>
                <Dialog open={isNewNegotiationOpen} onOpenChange={setNewNegotiationOpen}>
                    <DialogTrigger asChild>
                        <Button>Iniciar Nova Negociação</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Iniciar Nova Negociação</DialogTitle>
                            <DialogDescription>
                                Preencha as informações abaixo para iniciar um novo processo de negociação.
                                O sistema buscará os detalhes do imóvel e do cliente.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddNegotiation}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="property-code">Imóvel (Código ou Matrícula)</Label>
                                    <Input id="property-code" name="property-code" placeholder="Insira o código ou matrícula do imóvel" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="client-doc">Cliente (CPF ou CNPJ)</Label>
                                    <Input id="client-doc" name="client-doc" placeholder="Insira o documento do cliente comprador" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="value">Valor da Proposta (R$)</Label>
                                        <Input id="value" name="value" type="number" placeholder="750000" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Data da Proposta</Label>
                                        <Input id="date" name="date" type="date" required />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Criar Negociação</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Negociações em Andamento</CardTitle>
                    <CardDescription>
                        Uma lista de todos os processos de negociação.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Imóvel</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Fase</TableHead>
                                <TableHead>Vendedor</TableHead>
                                <TableHead>Captador</TableHead>
                                <TableHead>
                                  <span className="sr-only">Ações</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {negotiations.map((neg) => (
                                <TableRow key={neg.id}>
                                    <TableCell className="font-medium">{neg.property}</TableCell>
                                    <TableCell>{neg.client}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(neg.value)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{neg.stage}</Badge>
                                    </TableCell>
                                    <TableCell>{neg.salesperson}</TableCell>
                                    <TableCell>{neg.realtor}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Alternar menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                                <DropdownMenuItem>Avançar Fase</DropdownMenuItem>
                                                <DropdownMenuItem>Gerar Contrato</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
