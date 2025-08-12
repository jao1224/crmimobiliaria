
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { initialNegotiations } from "@/app/dashboard/negotiations/page";
import { initialProperties } from "@/app/dashboard/properties/page";
import { notFound, useParams } from "next/navigation";
import { Printer, Save, FileUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Mock data for clients
const mockClients = [
    { id: "L001", doc: "111.222.333-44", name: "João Silva", address: "Rua das Flores, 123, São Paulo, SP" },
    { id: "L002", doc: "222.333.444-55", name: "Maria Garcia", address: "Avenida Central, 456, Rio de Janeiro, RJ" },
    { id: "C001", doc: "333.444.555-66", name: "Alice Williams", address: "Praça da Sé, 789, São Paulo, SP" },
    { id: "C002", doc: "444.555.666-77", name: "Bob Brown", address: "Rua Copacabana, 101, Rio de Janeiro, RJ"},
    { id: "C003", doc: "555.666.777-88", name: "Charlie Davis", address: "Avenida Paulista, 1500, São Paulo, SP"},
];

const mockRealtors = {
    "Carlos Pereira": { name: "Carlos Pereira", creci: "12345-F" },
    "Sofia Lima": { name: "Sofia Lima", creci: "67890-J" },
}

export default function ContractPage() {
    const params = useParams();
    const { toast } = useToast();
    const negotiationId = params.id as string;

    const negotiation = initialNegotiations.find(n => n.id === negotiationId);
    if (!negotiation) {
        notFound();
    }

    const property = initialProperties.find(p => p.name === negotiation.property);
    const client = mockClients.find(c => c.name === negotiation.client);
    const realtor = (mockRealtors as any)[negotiation.realtor];

    if (!property || !client || !realtor) {
         notFound();
    }
    
    const handlePrint = () => {
        window.print();
    };
    
    const handleSave = () => {
        toast({ title: "Sucesso!", description: "Contrato salvo com sucesso."});
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
                    <p className="text-muted-foreground">Negociação ID: {negotiation.id}</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} variant="default">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
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
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="contract-file">Arquivo do Contrato</Label>
                        <Input id="contract-file" type="file" />
                    </div>
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
                                        <Label htmlFor="seller-name">Nome</Label>
                                        <Input id="seller-name" placeholder="Nome do Proprietário" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="seller-doc">CPF/CNPJ</Label>
                                        <Input id="seller-doc" placeholder="Documento do Proprietário" />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-1">
                                         <Label htmlFor="seller-address">Endereço</Label>
                                        <Input id="seller-address" placeholder="Endereço Completo do Proprietário" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">COMPRADOR(A):</h3>
                                <p className="border p-4 rounded-md bg-muted/50">
                                    <strong>Nome:</strong> {client.name}, <strong>CPF/CNPJ:</strong> {client.doc}, residente e domiciliado em {client.address}.
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
                                    <Label htmlFor="property-area">Área (m²)</Label>
                                    <Input id="property-area" placeholder="Ex: 120" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="property-registration">Matrícula do Imóvel</Label>
                                    <Input id="property-registration" placeholder="Nº da Matrícula" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="property-registry-office">Cartório de Registro</Label>
                                    <Input id="property-registry-office" placeholder="Ex: 1º Cartório de Registro de Imóveis de São Paulo" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Price and Payment */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">CLÁUSULA SEGUNDA - DO PREÇO E DA FORMA DE PAGAMENTO</h3>
                            <p className="text-justify text-sm">
                                O valor total da presente transação é de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negotiation.value)}</strong>, a ser pago pelo COMPRADOR(A) ao VENDEDOR(ES).
                            </p>
                             <Label htmlFor="payment-terms">Forma de Pagamento Detalhada</Label>
                             <Textarea id="payment-terms" placeholder="Descreva os termos de pagamento. Ex: a) Sinal de R$ 50.000,00... b) O restante de R$ 700.000,00 será pago via financiamento bancário..." className="min-h-[100px]" />
                        </div>

                        {/* Commission */}
                        <div className="space-y-2">
                             <h3 className="font-semibold">CLÁUSULA TERCEIRA - DA COMISSÃO DE CORRETAGEM</h3>
                             <Label htmlFor="commission-clause">Texto da Cláusula de Comissão</Label>
                             <Textarea id="commission-clause" className="min-h-[120px]" defaultValue={`Os honorários devidos pela intermediação desta negociação, no montante de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.commission)}, correspondentes a [PERCENTUAL]% do valor da venda, são de responsabilidade do VENDEDOR(ES), a serem pagos à INTERVENIENTE ANUENTE na data da compensação do sinal.`} />
                        </div>

                        {/* General Clauses */}
                         <div className="space-y-2">
                             <h3 className="font-semibold">CLÁUSULA QUARTA - DAS DISPOSIÇÕES GERAIS</h3>
                             <Label htmlFor="general-clauses">Texto das Disposições Gerais</Label>
                             <Textarea id="general-clauses" className="min-h-[100px]" defaultValue={`O COMPRADOR(A) declara ter vistoriado o imóvel, recebendo-o no estado em que se encontra. Todas as despesas de transferência, como ITBI, escritura e registro, correrão por conta do COMPRADOR(A).`} />
                        </div>
                        
                        <div className="space-y-2">
                             <h3 className="font-semibold">CLÁUSULAS ADICIONAIS</h3>
                             <Label htmlFor="additional-clauses">Cláusulas Adicionais (Opcional)</Label>
                             <Textarea id="additional-clauses" className="min-h-[100px]" placeholder="Adicione aqui outras cláusulas, se necessário." />
                        </div>

                        <Separator />

                        {/* Signatures */}
                        <div className="pt-8 text-center space-y-8">
                             <div>_________________________<br/><strong>{client.name}</strong><br/>COMPRADOR(A)</div>
                             <div>_________________________<br/><strong className="uppercase">[NOME DO PROPRIETÁRIO]</strong><br/>VENDEDOR(ES)</div>
                             <div>_________________________<br/><strong>{realtor.name} (CRECI: {realtor.creci})</strong><br/>INTERVENIENTE ANUENTE</div>
                        </div>

                        <div className="text-center text-sm text-muted-foreground pt-8">
                             <div className="grid grid-cols-2 gap-4 mx-auto max-w-sm">
                                <Input placeholder="Cidade" defaultValue="São Paulo" />
                                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
