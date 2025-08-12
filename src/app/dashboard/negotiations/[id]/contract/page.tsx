
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { initialNegotiations } from "@/app/dashboard/negotiations/page";
import { initialProperties } from "@/app/dashboard/properties/page";
import { notFound, useParams } from "next/navigation";
import { Printer } from "lucide-react";

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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Contrato de Compra e Venda</h1>
                    <p className="text-muted-foreground">Negociação ID: {negotiation.id}</p>
                </div>
                <Button onClick={handlePrint} variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Contrato
                </Button>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardContent className="p-8">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <h2 className="text-xl font-semibold">CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL</h2>
                        </div>

                        {/* Parties */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">VENDEDOR(ES):</h3>
                                <p><strong>Nome:</strong> [NOME DO PROPRIETÁRIO], <strong>CPF/CNPJ:</strong> [DOCUMENTO DO PROPRIETÁRIO], residente e domiciliado em [ENDEREÇO DO PROPRIETÁRIO].</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">COMPRADOR(A):</h3>
                                <p><strong>Nome:</strong> {client.name}, <strong>CPF/CNPJ:</strong> {client.doc}, residente e domiciliado em {client.address}.</p>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">INTERVENIENTE ANUENTE (IMOBILIÁRIA):</h3>
                                <p><strong>Razão Social:</strong> LeadFlow Imobiliária Ltda., <strong>CNPJ:</strong> 00.123.456/0001-00, com sede em [Endereço da Imobiliária], representada por seu corretor responsável.</p>
                                <p><strong>Corretor Responsável:</strong> {realtor.name}, <strong>CRECI:</strong> {realtor.creci}.</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Object */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">CLÁUSULA PRIMEIRA - DO OBJETO</h3>
                            <p className="text-justify">
                                O presente contrato tem por objeto a promessa de compra e venda do imóvel a seguir descrito: {property.name}, localizado na {property.address}, com área total de [ÁREA] m², matrícula nº [MATRÍCULA DO IMÓVEL] do [Nº] Cartório de Registro de Imóveis de [CIDADE].
                            </p>
                        </div>
                        
                        {/* Price and Payment */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">CLÁUSULA SEGUNDA - DO PREÇO E DA FORMA DE PAGAMENTO</h3>
                            <p className="text-justify">
                                O valor total da presente transação é de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negotiation.value)}</strong>, a ser pago pelo COMPRADOR(A) ao VENDEDOR(ES) da seguinte forma:
                            </p>
                             <p className="text-justify pl-4">
                                a) Sinal de <strong>R$ [VALOR DO SINAL]</strong>, pago neste ato através de [FORMA DE PAGAMENTO DO SINAL].<br/>
                                b) O restante de <strong>R$ [VALOR RESTANTE]</strong> será pago em [NÚMERO DE PARCELAS] parcelas ou através de financiamento bancário até a data de [DATA LIMITE].
                            </p>
                        </div>

                        {/* Commission */}
                        <div className="space-y-2">
                             <h3 className="font-semibold">CLÁUSULA TERCEIRA - DA COMISSÃO DE CORRETAGEM</h3>
                             <p className="text-justify">
                                Os honorários devidos pela intermediação desta negociação, no montante de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.commission)}</strong>, correspondentes a [PERCENTUAL]% do valor da venda, são de responsabilidade do VENDEDOR(ES), a serem pagos à INTERVENIENTE ANUENTE na data da compensação do sinal.
                             </p>
                        </div>

                        {/* General Clauses */}
                         <div className="space-y-2">
                             <h3 className="font-semibold">CLÁUSULA QUARTA - DAS DISPOSIÇÕES GERAIS</h3>
                             <p className="text-justify">
                                 O COMPRADOR(A) declara ter vistoriado o imóvel, recebendo-o no estado em que se encontra. Todas as despesas de transferência, como ITBI, escritura e registro, correrão por conta do COMPRADOR(A).
                             </p>
                        </div>

                        <Separator />

                        {/* Signatures */}
                        <div className="pt-8 text-center space-y-8">
                             <div>_________________________<br/><strong>{client.name}</strong><br/>COMPRADOR(A)</div>
                             <div>_________________________<br/><strong>[NOME DO PROPRIETÁRIO]</strong><br/>VENDEDOR(ES)</div>
                             <div>_________________________<br/><strong>{realtor.name} (CRECI: {realtor.creci})</strong><br/>INTERVENIENTE ANUENTE</div>
                        </div>

                        <div className="text-center text-sm text-muted-foreground pt-8">
                            <p>Local e Data: [CIDADE], {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

