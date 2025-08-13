
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter, useParams } from "next/navigation";
import { Printer, Save, Upload, FileText, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Tipos para os dados simulados
type Negotiation = { id: string; property: string; propertyId: string; client: string; clientId: string; value: number; realtor: string; commissionRate: number; contractDetails?: ContractDetails; contractUrl?: string; };
type Property = { id: string; name: string; address: string; price: number; };
type Client = { id: string; name: string; doc: string; address: string; };
type ContractDetails = {
    sellerName: string;
    sellerDoc: string;
    sellerAddress: string;
    propertyArea: string;
    propertyRegistration: string;
    propertyRegistryOffice: string;
    paymentTerms: string;
    commissionClause: string;
    generalClauses: string;
    additionalClauses: string;
    city: string;
    date: string;
};

// Dados simulados
const mockNegotiation: Negotiation = {
    id: "deal123",
    property: "Apartamento Vista Mar",
    propertyId: "prop456",
    client: "João Comprador",
    clientId: "client789",
    value: 850000,
    realtor: "Carlos Pereira",
    commissionRate: 2.5,
};

const mockProperty: Property = {
    id: "prop456",
    name: "Apartamento Vista Mar",
    address: "Avenida Beira Mar, 123, Meireles, Fortaleza",
    price: 900000
};

const mockClient: Client = {
    id: "client789",
    name: "João Comprador",
    doc: "123.456.789-00",
    address: "Rua das Flores, 45, Aldeota, Fortaleza"
};

const mockRealtors = {
    "Carlos Pereira": { name: "Carlos Pereira", creci: "12345-F" },
    "Sofia Lima": { name: "Sofia Lima", creci: "67890-J" },
}


export default function ContractPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const negotiationId = params.id;

    const [negotiation, setNegotiation] = useState<Negotiation | null>(mockNegotiation);
    const [property, setProperty] = useState<Property | null>(mockProperty);
    const [client, setClient] = useState<Client | null>(mockClient);
    const [isLoading, setIsLoading] = useState(false); // Simulando, sem carregamento real
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [contractData, setContractData] = useState<ContractDetails>({
        sellerName: "Ana Vendedora",
        sellerDoc: "987.654.321-00",
        sellerAddress: "Rua dos Vendedores, 1010, Centro, Fortaleza",
        propertyArea: "150",
        propertyRegistration: "Matrícula 98765 do 2º CRI",
        propertyRegistryOffice: "2º Cartório de Registro de Imóveis de Fortaleza",
        paymentTerms: "a) Sinal de R$ 85.000,00 no ato da assinatura. b) O restante de R$ 765.000,00 será pago via financiamento bancário em até 60 dias.",
        commissionClause: "", // Será preenchido abaixo
        generalClauses: "O COMPRADOR(A) declara ter vistoriado o imóvel, recebendo-o no estado em que se encontra. Todas as despesas de transferência, como ITBI, escritura e registro, correrão por conta do COMPRADOR(A).",
        additionalClauses: "",
        city: "Fortaleza",
        date: new Date().toISOString().split('T')[0],
    });
    
    // Preenche cláusula de comissão com base nos dados simulados
    useEffect(() => {
        if (negotiation?.value && negotiation.commissionRate) {
            const commissionValue = negotiation.value * (negotiation.commissionRate / 100);
            const defaultCommissionClause = `Os honorários devidos pela intermediação desta negociação, no montante de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionValue)}, correspondentes a ${negotiation.commissionRate}% do valor da venda, são de responsabilidade do VENDEDOR(ES), a serem pagos à INTERVENIENTE ANUENTE na data da compensação do sinal.`;
            setContractData(prev => ({...prev, commissionClause: defaultCommissionClause}));
        }
    }, [negotiation]);

    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setContractData(prev => ({ ...prev, [id]: value }));
    };

    if (isLoading) { // Embora falso, mantemos a estrutura para futura re-integração
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
                <Skeleton className="h-40 w-full" />
                <div className="relative">
                    <Separator />
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-sm text-muted-foreground">OU</div>
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent className="p-8 space-y-6">
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-24 w-full" />
                         <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!negotiation || !property || !client) {
        // next/navigation notFound() is recommended for pages, but this is a component
        // Return a message or a skeleton loader
        return <div>Negociação não encontrada.</div>;
    }
    
    const realtor = (mockRealtors as any)[negotiation.realtor];

    if (!realtor) {
        return <div>Corretor não encontrado.</div>;
    }
    
    const handlePrint = () => {
        window.print();
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        // Simula salvamento
        setTimeout(() => {
             toast({ title: "Sucesso!", description: "Contrato salvo (simulado)."});
             setIsSaving(false);
        }, 1000);
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast({ variant: "destructive", title: "Nenhum arquivo selecionado" });
            return;
        }
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setNegotiation(prev => prev ? {...prev, contractUrl: base64String} : null);
                toast({ title: "Sucesso!", description: "Arquivo do contrato enviado." });
                setIsUploading(false);
            };
            reader.onerror = (error) => {
                console.error("File reading error:", error);
                toast({ variant: "destructive", title: "Erro de Leitura", description: "Não foi possível ler o arquivo selecionado."});
                setIsUploading(false);
            };
        } catch (error) {
            console.error("Upload error:", error);
            toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro durante o envio."});
            setIsUploading(false);
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between print:hidden">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
                        <p className="text-muted-foreground">Negociação ID: {negotiationId}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} variant="default" disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Salvando..." : "Salvar Editor"}
                    </Button>
                    <Button onClick={handlePrint} variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir / Gerar PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Anexar Contrato Externo</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                     <p className="text-sm text-muted-foreground">
                        Se preferir, você pode anexar um arquivo de contrato (PDF, DOCX) diretamente do seu computador.
                     </p>
                    <div className="flex items-end gap-2">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="contract-file">Arquivo do Contrato</Label>
                            <Input id="contract-file" type="file" onChange={handleFileChange} />
                        </div>
                        <Button onClick={handleFileUpload} disabled={!selectedFile || isUploading}>
                            <Upload className="mr-2 h-4 w-4" />
                            {isUploading ? "Enviando..." : "Enviar"}
                        </Button>
                    </div>
                     {negotiation.contractUrl && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-md p-3">
                            <FileText className="h-5 w-5" />
                            <span className="font-medium">Contrato Anexado:</span>
                             <a href={negotiation.contractUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline hover:text-emerald-800">
                                Visualizar Contrato
                                <LinkIcon className="h-4 w-4" />
                            </a>
                        </div>
                    )}
                 </CardContent>
            </Card>

            <div className="relative">
                <Separator />
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-sm text-muted-foreground">OU</div>
            </div>
            
            <Card className="print:shadow-none print:border-none">
                <CardHeader>
                    <CardTitle>Editor de Contrato de Compra e Venda</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h2 className="text-xl font-semibold">CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL</h2>
                        </div>

                        {/* Parties */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">VENDEDOR(ES):</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                                    <div className="space-y-1">
                                        <Label htmlFor="sellerName">Nome</Label>
                                        <Input id="sellerName" placeholder="Nome do Proprietário" value={contractData.sellerName} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="sellerDoc">CPF/CNPJ</Label>
                                        <Input id="sellerDoc" placeholder="Documento do Proprietário" value={contractData.sellerDoc} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-1">
                                         <Label htmlFor="sellerAddress">Endereço</Label>
                                        <Input id="sellerAddress" placeholder="Endereço Completo do Proprietário" value={contractData.sellerAddress} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">COMPRADOR(A):</h3>
                                <p className="border p-4 rounded-md bg-muted/50">
                                    <strong>Nome:</strong> {client.name}, <strong>CPF/CNPJ:</strong> {client.doc || 'N/A'}, residente e domiciliado em {client.address || 'N/A'}.
                                </p>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">INTERVENIENTE ANUENTE (IMOBILIÁRIA):</h3>
                                 <p className="border p-4 rounded-md bg-muted/50">
                                    <strong>Razão Social:</strong> LeadFlow Imobiliária Ltda., <strong>CNPJ:</strong> 00.123.456/0001-00, com sede em [Endereço da Imobiliária], representada por seu corretor responsável.<br/>
                                    <strong>Corretor Responsável:</strong> {realtor.name}, <strong>CRECI:</strong> {realtor.creci}.
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Object */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">CLÁUSULA PRIMEIRA - DO OBJETO</h3>
                            <p className="text-justify text-sm">
                                O presente contrato tem por objeto a promessa de compra e venda do imóvel a seguir descrito: <strong>{property.name}</strong>, localizado na <strong>{property.address}</strong>.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="propertyArea">Área (m²)</Label>
                                    <Input id="propertyArea" placeholder="Ex: 120" value={contractData.propertyArea} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="propertyRegistration">Matrícula do Imóvel</Label>
                                    <Input id="propertyRegistration" placeholder="Nº da Matrícula" value={contractData.propertyRegistration} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="propertyRegistryOffice">Cartório de Registro</Label>
                                    <Input id="propertyRegistryOffice" placeholder="Ex: 1º Cartório de Registro de Imóveis de São Paulo" value={contractData.propertyRegistryOffice} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Price and Payment */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">CLÁUSULA SEGUNDA - DO PREÇO E DA FORMA DE PAGAMENTO</h3>
                            <p className="text-justify text-sm">
                                O valor total da presente transação é de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negotiation.value)}</strong>, a ser pago pelo COMPRADOR(A) ao VENDEDOR(ES).
                            </p>
                             <Label htmlFor="paymentTerms">Forma de Pagamento Detalhada</Label>
                             <Textarea id="paymentTerms" placeholder="Descreva os termos de pagamento. Ex: a) Sinal de R$ 50.000,00... b) O restante de R$ 700.000,00 será pago via financiamento bancário..." className="min-h-[100px]" value={contractData.paymentTerms} onChange={handleInputChange} />
                        </div>

                        {/* Commission */}
                        <div className="space-y-2">
                             <h3 className="font-semibold">CLÁUSULA TERCEIRA - DA COMISSÃO DE CORRETAGEM</h3>
                             <Label htmlFor="commissionClause">Texto da Cláusula de Comissão</Label>
                             <Textarea id="commissionClause" className="min-h-[120px]" value={contractData.commissionClause} onChange={handleInputChange} />
                        </div>

                        {/* General Clauses */}
                         <div className="space-y-2">
                             <h3 className="font-semibold">CLÁUSULA QUARTA - DAS DISPOSIÇÕES GERAIS</h3>
                             <Label htmlFor="generalClauses">Texto das Disposições Gerais</Label>
                             <Textarea id="generalClauses" className="min-h-[100px]" value={contractData.generalClauses} onChange={handleInputChange} />
                        </div>
                        
                        <div className="space-y-2">
                             <h3 className="font-semibold">CLÁUSULAS ADICIONAIS</h3>
                             <Label htmlFor="additionalClauses">Cláusulas Adicionais (Opcional)</Label>
                             <Textarea id="additionalClauses" className="min-h-[100px]" placeholder="Adicione aqui outras cláusulas, se necessário." value={contractData.additionalClauses} onChange={handleInputChange} />
                        </div>

                        <Separator />

                        {/* Signatures */}
                        <div className="pt-8 text-center space-y-8">
                             <div>_________________________<br/><strong>{client.name}</strong><br/>COMPRADOR(A)</div>
                             <div>_________________________<br/><strong className="uppercase">{contractData.sellerName || '[NOME DO PROPRIETÁRIO]'}</strong><br/>VENDEDOR(ES)</div>
                             <div>_________________________<br/><strong>{realtor.name} (CRECI: {realtor.creci})</strong><br/>INTERVENIENTE ANUENTE</div>
                        </div>

                        <div className="text-center text-sm text-muted-foreground pt-8">
                             <div className="grid grid-cols-2 gap-4 mx-auto max-w-sm">
                                <Input id="city" placeholder="Cidade" value={contractData.city} onChange={handleInputChange} />
                                <Input id="date" type="date" value={contractData.date} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
