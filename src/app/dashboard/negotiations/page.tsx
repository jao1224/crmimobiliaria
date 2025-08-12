
"use client";

import { useState, useEffect, useMemo, useContext } from "react";
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
import type { UserProfile } from "../layout";
import { ProfileContext } from "@/contexts/ProfileContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, writeBatch, query, where } from "firebase/firestore";
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
    commissionRate: number;
};
type Property = { id: string; name: string; address: string; price: number; commission: number; };
type Client = { id: string; name: string; doc: string; };


const mockUsers: Record<UserProfile, string | null> = {
    'Admin': null,
    'Imobiliária': null,
    'Corretor Autônomo': 'Sofia Lima', 
    'Investidor': 'Bob Brown', 
    'Construtora': null,
};


export default function NegotiationsPage() {
    const router = useRouter();
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [isNewNegotiationOpen, setNewNegotiationOpen] = useState(false);
    const { toast } = useToast();
    const { activeProfile } = useContext(ProfileContext);
    
    const [propertyCode, setPropertyCode] = useState("");
    const [clientDoc, setClientDoc] = useState("");
    const [foundProperty, setFoundProperty] = useState<Property | null>(null);
    const [foundClient, setFoundClient] = useState<Client | null>(null);
    const [proposalValue, setProposalValue] = useState("");
    const [proposalDate, setProposalDate] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNegotiations = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "deals"));
            const negotiationsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
            setNegotiations(negotiationsList);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as negociações." });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchNegotiations();
    }, []);

    const filteredNegotiations = useMemo(() => {
        const currentUserName = activeProfile ? mockUsers[activeProfile] : null;

        if (!currentUserName) {
            return negotiations;
        }
        
        if (activeProfile === 'Investidor') {
             return negotiations.filter(neg => neg.client === currentUserName);
        }

        return negotiations.filter(neg => 
            neg.salesperson === currentUserName || neg.realtor === currentUserName
        );
    }, [negotiations, activeProfile]);


    const handleSearch = async () => {
        setIsSearching(true);
        try {
            // Busca de Imóvel
            const propertiesQuery = query(collection(db, "properties"), where("id", "==", propertyCode));
            const propertySnap = await getDocs(propertiesQuery);
            const property = propertySnap.docs.length > 0 ? { id: propertySnap.docs[0].id, ...propertySnap.docs[0].data() } as Property : null;
            
            // Busca de Cliente
            const clientsQuery = query(collection(db, "clients"), where("doc", "==", clientDoc));
            const clientSnap = await getDocs(clientsQuery);
            const client = clientSnap.docs.length > 0 ? { id: clientSnap.docs[0].id, ...clientSnap.docs[0].data() } as Client : null;

            setFoundProperty(property);
            setFoundClient(client);
            
            if (!property) {
                toast({ variant: 'destructive', title: "Erro", description: "Imóvel não encontrado." });
            }
            if (!client) {
                toast({ variant: 'destructive', title: "Erro", description: "Cliente não encontrado." });
            }
            if (property && client) {
                 toast({ title: "Sucesso!", description: "Dados encontrados." });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Ocorreu um erro ao buscar os dados." });
        }
        setIsSearching(false);
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


    const handleAddNegotiation = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!foundProperty || !foundClient) {
            toast({ variant: 'destructive', title: "Erro", description: "Busque e confirme os dados do imóvel e do cliente antes de criar." });
            return;
        }

        const newNegotiationData = {
            property: foundProperty.name,
            propertyId: foundProperty.id,
            client: foundClient.name,
            clientId: foundClient.id,
            stage: "Proposta Enviada",
            contractStatus: "Não Gerado",
            value: Number(proposalValue),
            commissionRate: foundProperty.commission,
            salesperson: "Joana Doe", // Placeholder
            realtor: "Carlos Pereira", // Placeholder
            closeDate: proposalDate,
        };

        try {
            await addDoc(collection(db, "deals"), newNegotiationData);
            setNewNegotiationOpen(false);
            toast({ title: "Sucesso!", description: "Nova negociação iniciada." });
            fetchNegotiations(); // Re-fetch
        } catch (error) {
             toast({ variant: 'destructive', title: "Erro", description: "Não foi possível criar a negociação." });
        }
    };
    
    const handleGenerateContract = (negotiationId: string) => {
        const dealDocRef = doc(db, "deals", negotiationId);
        const batch = writeBatch(db);
        batch.update(dealDocRef, { stage: "Contrato Gerado", contractStatus: "Pendente" });
        
        batch.commit().then(() => {
            toast({ title: "Sucesso!", description: "Contrato gerado. Redirecionando..." });
            fetchNegotiations();
            router.push(`/dashboard/negotiations/${negotiationId}/contract`);
        }).catch(() => {
            toast({ variant: 'destructive', title: "Erro", description: "Falha ao atualizar o status do contrato." });
        });
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
                                        <Input id="property-code" value={propertyCode} onChange={e => setPropertyCode(e.target.value)} placeholder="Insira o código do imóvel (Ex: 1, 2)" required />
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
                        {isLoading ? "Carregando..." : 
                            filteredNegotiations.length > 0 
                            ? `Uma lista de ${filteredNegotiations.length} processo(s) de negociação.`
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
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredNegotiations.length > 0 ? (
                                filteredNegotiations.map((neg) => (
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

    