
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
import { initialProperties } from "../properties/page";
import type { UserProfile } from "../layout";

export const initialNegotiations = [
    {
        id: "NEG001",
        property: "Apartamento Sunnyvale",
        client: "Alice Williams",
        stage: "Proposta Enviada",
        contractStatus: "Não Gerado",
        value: 750000,
        salesperson: "Joana Doe",
        realtor: "Carlos Pereira",
    },
    {
        id: "NEG002",
        property: "Loft no Centro",
        client: "Bob Brown",
        stage: "Negociação",
        contractStatus: "Não Gerado",
        value: 500000,
        salesperson: "João Roe",
        realtor: "Sofia Lima",
    },
     {
        id: "NEG003",
        property: "Vila Lakeside",
        client: "Charlie Davis",
        stage: "Contrato Gerado",
        contractStatus: "Pendente",
        value: 2500000,
        salesperson: "Joana Doe",
        realtor: "Carlos Pereira",
    },
    {
        id: "NEG004",
        property: "Casa Greenfield",
        client: "David Johnson",
        stage: "Visita Agendada",
        contractStatus: "Não Gerado",
        value: 1200000,
        salesperson: "Sofia Lima",
        realtor: "Sofia Lima",
    },
    {
        id: "NEG005",
        property: "Casa Familiar Suburbana",
        client: "Maria Garcia",
        stage: "Proposta Recebida",
        contractStatus: "Não Gerado",
        value: 850000,
        salesperson: "Sofia Lima",
        realtor: "Carlos Pereira",
    },
];

// Mock data for clients
const mockClients = [
    { id: "L001", doc: "111.222.333-44", name: "João Silva", source: "Website", status: "Novo", assignedTo: "Joana Doe" },
    { id: "L002", doc: "222.333.444-55", name: "Maria Garcia", source: "Indicação", status: "Contactado", assignedTo: "Joana Doe" },
    { id: "C001", doc: "333.444.555-66", name: "Alice Williams", source: "Indicação", status: "Cliente", assignedTo: "Joana Doe" },
    { id: "C002", doc: "444.555.666-77", name: "Bob Brown", source: "Website", status: "Cliente", assignedTo: "João Roe" },
    { id: "C003", doc: "555.666.777-88", name: "Charlie Davis", source: "Campanha", status: "Cliente", assignedTo: "Joana Doe" },
];

const mockUsers: Record<UserProfile, string | null> = {
    'Admin': null,
    'Imobiliária': null,
    'Corretor Autônomo': 'Sofia Lima', 
    'Investidor': 'Bob Brown', 
    'Construtora': null,
};


export default function NegotiationsPage({ activeProfile }: { activeProfile: UserProfile }) {
    const router = useRouter();
    const [negotiations, setNegotiations] = useState(initialNegotiations);
    const [isNewNegotiationOpen, setNewNegotiationOpen] = useState(false);
    const { toast } = useToast();
    
    // State for the new negotiation form
    const [propertyCode, setPropertyCode] = useState("");
    const [clientDoc, setClientDoc] = useState("");
    const [foundProperty, setFoundProperty] = useState<any>(null);
    const [foundClient, setFoundClient] = useState<any>(null);
    const [proposalValue, setProposalValue] = useState("");
    const [proposalDate, setProposalDate] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const filteredNegotiations = useMemo(() => {
        const currentUserName = activeProfile ? mockUsers[activeProfile] : null;

        if (!currentUserName) {
            return negotiations; // Shows all for Admin/Imobiliária
        }
        
        return negotiations.filter(neg => 
            neg.salesperson === currentUserName || neg.realtor === currentUserName
        );
    }, [negotiations, activeProfile]);


    const handleSearch = () => {
        setIsSearching(true);
        // Simulate API call
        setTimeout(() => {
            const property = initialProperties.find(p => p.id === propertyCode);
            const client = mockClients.find(c => c.doc === clientDoc);
            
            setFoundProperty(property || null);
            setFoundClient(client || null);
            
            if (!property) {
                toast({ variant: 'destructive', title: "Erro", description: "Imóvel não encontrado." });
            }
            if (!client) {
                toast({ variant: 'destructive', title: "Erro", description: "Cliente não encontrado." });
            }
            if (property && client) {
                 toast({ title: "Sucesso!", description: "Dados encontrados." });
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
            toast({ variant: 'destructive', title: "Erro", description: "Busque e confirme os dados do imóvel e do cliente antes de criar." });
            return;
        }

        const newNegotiation = {
            id: `NEG${String(negotiations.length + 1).padStart(3, '0')}`,
            property: foundProperty.name,
            client: foundClient.name,
            stage: "Proposta Enviada",
            contractStatus: "Não Gerado",
            value: Number(proposalValue),
            salesperson: "Joana Doe", // Placeholder
            realtor: "Carlos Pereira", // Placeholder
        };
        setNegotiations([newNegotiation, ...negotiations]);
        setNewNegotiationOpen(false);
        toast({ title: "Sucesso!", description: "Nova negociação iniciada." });
    };
    
    const handleGenerateContract = (negotiationId: string) => {
        setNegotiations(negotiations.map(neg => 
            neg.id === negotiationId ? { ...neg, stage: "Contrato Gerado", contractStatus: "Pendente" } : neg
        ));
        toast({ title: "Sucesso!", description: "Contrato gerado. Redirecionando..." });
        router.push(`/dashboard/negotiations/${negotiationId}/contract`);
    }

    const isFilteredView = activeProfile && mockUsers[activeProfile];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {isFilteredView ? 'Meus Processos' : 'Processos de Negociação'}
                    </h1>
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
                                Insira o código do imóvel e o documento do cliente para buscar os dados.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddNegotiation}>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="property-code">Imóvel (Código)</Label>
                                        <Input id="property-code" value={propertyCode} onChange={e => setPropertyCode(e.target.value)} placeholder="Insira o código do imóvel" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="client-doc">Cliente (CPF ou CNPJ)</Label>
                                        <Input id="client-doc" value={clientDoc} onChange={e => setClientDoc(e.target.value)} placeholder="Insira o documento do cliente" required />
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
                        {filteredNegotiations.length > 0 
                            ? `Uma lista de ${filteredNegotiations.length} processo(s) de negociação.`
                            : "Nenhum processo de negociação encontrado para este perfil."
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
                            {filteredNegotiations.map((neg) => (
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    