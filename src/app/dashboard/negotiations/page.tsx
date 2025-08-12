
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Tipos
type Negotiation = {
    id: string;
    property: string;
    propertyId: string;
    client: string;
    clientId: string;
    stage: string;
    value: number;
    salesperson: string;
    realtor: string;
    contractStatus: string;
};
type Property = { id: string; name: string; address: string; price: number; commission: number; };
type Client = { id: string; name: string; doc: string; };

const initialNegotiations: Negotiation[] = [
    { id: 'neg1', property: 'Apartamento Vista Mar', propertyId: 'prop1', client: 'João Comprador', clientId: 'cli1', stage: 'Proposta Enviada', value: 850000, salesperson: 'Joana Doe', realtor: 'Carlos Pereira', contractStatus: 'Não Gerado' },
    { id: 'neg2', property: 'Casa com Piscina', propertyId: 'prop2', client: 'Maria Investidora', clientId: 'cli2', stage: 'Em Negociação', value: 1200000, salesperson: 'Joana Doe', realtor: 'Sofia Lima', contractStatus: 'Não Gerado' },
    { id: 'neg3', property: 'Terreno Comercial', propertyId: 'prop3', client: 'Construtora Build S.A.', clientId: 'cli3', stage: 'Contrato Gerado', value: 2500000, salesperson: 'Admin', realtor: 'Carlos Pereira', contractStatus: 'Pendente' },
];

const mockProperties: Property[] = [
    { id: 'prop1', name: 'Apartamento Vista Mar', address: 'Av. Beira Mar, 123', price: 900000, commission: 2.5 },
];

const mockClients: Client[] = [
     { id: 'cli1', name: 'João Comprador', doc: '111.222.333-44' },
];


export default function NegotiationsPage() {
    const router = useRouter();
    const [negotiations, setNegotiations] = useState<Negotiation[]>(initialNegotiations);
    const [isNewNegotiationOpen, setNewNegotiationOpen] = useState(false);
    const { toast } = useToast();
    
    const [propertyCode, setPropertyCode] = useState("");
    const [clientDoc, setClientDoc] = useState("");
    const [foundProperty, setFoundProperty] = useState<Property | null>(null);
    const [foundClient, setFoundClient] = useState<Client | null>(null);
    const [proposalValue, setProposalValue] = useState("");
    const [proposalDate, setProposalDate] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // No longer loading from DB

    const handleSearch = async () => {
        setIsSearching(true);
        // Simulação de busca
        setTimeout(() => {
            const prop = mockProperties.find(p => p.id === propertyCode);
            const cli = mockClients.find(c => c.doc === clientDoc);

            if (prop) {
                setFoundProperty(prop);
            } else {
                toast({ variant: 'destructive', title: "Erro", description: "Imóvel não encontrado." });
                setFoundProperty(null);
            }

            if (cli) {
                setFoundClient(cli);
            } else {
                 toast({ variant: 'destructive', title: "Erro", description: "Cliente não encontrado." });
                 setFoundClient(null);
            }

            if (prop && cli) {
                 toast({ title: "Sucesso!", description: "Dados encontrados (simulado)." });
            }
            setIsSearching(false);
        }, 1000);
    };

    const resetForm = () => {
        setPropertyCode("");
        setClientDoc("");
        setFoundProperty(null);
        setFoundClient(null);
        setProposalValue("");
        setProposalDate("");
    };

    useEffect(() => {
        if (!isNewNegotiationOpen) {
            resetForm();
        }
    }, [isNewNegotiationOpen]);


    const handleAddNegotiation = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!foundProperty || !foundClient) {
            toast({ variant: 'destructive', title: "Erro", description: "Busque e confirme os dados do imóvel e do cliente." });
            return;
        }

        const newNegotiation: Negotiation = {
            id: `neg${Date.now()}`,
            property: foundProperty.name,
            propertyId: foundProperty.id,
            client: foundClient.name,
            clientId: foundClient.id,
            stage: "Proposta Enviada",
            contractStatus: "Não Gerado",
            value: Number(proposalValue),
            salesperson: "Joana Doe",
            realtor: "Carlos Pereira",
        };
        setNegotiations(prev => [...prev, newNegotiation]);
        setNewNegotiationOpen(false);
        toast({ title: "Sucesso!", description: "Nova negociação iniciada (simulado)." });
    };
    
    const handleGenerateContract = (negotiationId: string) => {
        setNegotiations(prev => prev.map(neg => 
            neg.id === negotiationId ? { ...neg, stage: "Contrato Gerado", contractStatus: "Pendente" } : neg
        ));
        toast({ title: "Sucesso!", description: "Contrato gerado. Redirecionando..." });
        router.push(`/dashboard/negotiations/${negotiationId}/contract`);
    }

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
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Iniciar Nova Negociação</DialogTitle>
                            <DialogDescription>
                                Insira o ID do imóvel e o documento do cliente para buscar os dados.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddNegotiation}>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="property-code">Imóvel (ID)</Label>
                                        <Input id="property-code" value={propertyCode} onChange={e => setPropertyCode(e.target.value)} placeholder="Ex: prop1" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="client-doc">Cliente (CPF ou CNPJ)</Label>
                                        <Input id="client-doc" value={clientDoc} onChange={e => setClientDoc(e.target.value)} placeholder="Ex: 111.222.333-44" required />
                                    </div>
                                </div>

                                {(foundProperty || foundClient) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                                         <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Imóvel Encontrado</h4>
                                            {foundProperty ? (
                                                <div className="text-sm text-muted-foreground">
                                                    <p className="font-medium text-foreground">{foundProperty.name}</p>
                                                    <p>{foundProperty.address}</p>
                                                    <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundProperty.price)}</p>
                                                </div>
                                            ) : <p className="text-sm text-destructive">Nenhum imóvel encontrado.</p>}
                                        </div>
                                         <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Cliente Encontrado</h4>
                                            {foundClient ? (
                                                <div className="text-sm text-muted-foreground">
                                                    <p className="font-medium text-foreground">{foundClient.name}</p>
                                                    <p>Doc: {foundClient.doc}</p>
                                                </div>
                                            ) : <p className="text-sm text-destructive">Nenhum cliente encontrado.</p>}
                                        </div>
                                    </div>
                                )}


                                <div className="border-t pt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="value">Valor da Proposta (R$)</Label>
                                            <Input id="value" name="value" type="number" placeholder="750000" required value={proposalValue} onChange={e => setProposalValue(e.target.value)} disabled={!foundProperty || !foundClient} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date">Data da Proposta</Label>
                                            <Input id="date" name="date" type="date" required value={proposalDate} onChange={e => setProposalDate(e.target.value)} disabled={!foundProperty || !foundClient} />
                                        </div>
                                    </div>
                                    {(!foundProperty || !foundClient) && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            Os campos de proposta serão liberados após a busca e confirmação dos dados do imóvel e do cliente.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="border-t pt-4 gap-2 sm:justify-between">
                                <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching || !propertyCode || !clientDoc}>
                                    <Search className="mr-2 h-4 w-4" />
                                    {isSearching ? "Buscando..." : "Buscar Dados"}
                                </Button>
                                <Button type="submit" disabled={!foundProperty || !foundClient || !proposalValue || !proposalDate}>Criar Negociação</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Negociações em Andamento</CardTitle>
                    <CardDescription>
                        {
                            negotiations.length > 0 
                            ? `Uma lista de ${negotiations.length} processo(s) de negociação.`
                            : "Nenhum processo de negociação encontrado."
                        }
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
                                <TableHead>Contrato</TableHead>
                                <TableHead>Vendedor</TableHead>
                                <TableHead>Captador</TableHead>
                                <TableHead>
                                  <span className="sr-only">Ações</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {negotiations.length > 0 ? (
                                negotiations.map((neg) => (
                                <TableRow key={neg.id}>
                                    <TableCell className="font-medium">{neg.property}</TableCell>
                                    <TableCell>{neg.client}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(neg.value)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{neg.stage}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant={neg.contractStatus === "Não Gerado" ? "secondary" : "default"}>{neg.contractStatus}</Badge>
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
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/negotiations/${neg.id}/contract`)}>Ver Detalhes</DropdownMenuItem>
                                                <DropdownMenuItem>Mover para Contrato</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleGenerateContract(neg.id)} disabled={neg.contractStatus !== 'Não Gerado'}>
                                                    Gerar Contrato
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                 <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">Nenhum processo de negociação encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
