
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";

const negotiations = [
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Processos de Negociação</h1>
                    <p className="text-muted-foreground">Acompanhe e gerencie todas as suas negociações ativas.</p>
                </div>
                <Button>
                    Iniciar Nova Negociação
                </Button>
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
