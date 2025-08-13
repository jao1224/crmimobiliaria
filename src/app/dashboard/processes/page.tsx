
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, Landmark, Users, DollarSign, Building, User, Phone, Mail, FileSignature, Banknote, Group, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Dados simulados para o processo
const processData = {
    negotiation: {
        type: "Repasse com Financiamento",
        property: {
            name: "Apartamento Vista Mar",
            address: "Av. Beira Mar, 123, Apto 101 - Meireles, Fortaleza-CE",
            registration: "Matrícula 12345 do 2º CRI",
        },
        seller: {
            name: "Ana Vendedora Silva",
            doc: "111.222.333-44",
            phone: "(85) 98888-7777",
            email: "ana.vendedora@email.com",
        },
        buyer: {
            name: "João Comprador de Souza",
            doc: "555.666.777-88",
        }
    },
    team: {
        captador: "Carlos Pereira",
        captadorTeam: "Equipe de Revenda",
        vendedor: "Sofia Lima",
        vendedorGerente: "Gerente Admin"
    },
    values: {
        saleValue: 850000,
        negotiatedValue: 840000,
        downPayment: 150000,
    },
    responsibles: {
        sector: "Repasse",
        correspondent: "Banco Parceiro S.A."
    },
    finance: {
        status: "Comissões Pendentes",
        notes: "Aguardando pagamento do sinal para liberar comissão do captador.",
    },
    correspondent: {
        status: "Análise de Crédito",
        notes: "Cliente enviou a documentação inicial. Aguardando análise do banco.",
    }
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);


export default function ProcessesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Processo Administrativo da Negociação</h1>
                <p className="text-muted-foreground">Visão consolidada de todas as etapas e informações da negociação: <span className="font-semibold">{processData.negotiation.property.name}</span></p>
            </div>

            {/* Cabeçalho "PDF" não-editável */}
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <FileSignature className="h-6 w-6"/>
                        Resumo da Negociação
                    </CardTitle>
                    <CardDescription>
                        Esta é uma visão geral consolidada do processo. A edição é feita nos módulos específicos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Dados da Negociação */}
                    <div className="space-y-4">
                         <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground"/>Dados da Negociação</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
                            <div><Label>Tipo de Negócio</Label><p className="text-sm font-medium">{processData.negotiation.type}</p></div>
                            <div><Label>Imóvel</Label><p className="text-sm font-medium">{processData.negotiation.property.name}</p></div>
                            <div><Label>Endereço</Label><p className="text-sm font-medium">{processData.negotiation.property.address}</p></div>
                            <div><Label>Matrícula</Label><p className="text-sm font-medium">{processData.negotiation.property.registration}</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-sm"><User className="h-4 w-4"/>Vendedor</h4>
                                <p className="text-sm"><span className="font-medium">Nome:</span> {processData.negotiation.seller.name}</p>
                                <p className="text-sm"><span className="font-medium">CPF:</span> {processData.negotiation.seller.doc}</p>
                                <p className="text-sm"><span className="font-medium">Contato:</span> {processData.negotiation.seller.phone} / {processData.negotiation.seller.email}</p>
                            </div>
                            <div className="p-4 border rounded-lg space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-sm"><User className="h-4 w-4"/>Comprador</h4>
                                <p className="text-sm"><span className="font-medium">Nome:</span> {processData.negotiation.buyer.name}</p>
                                <p className="text-sm"><span className="font-medium">CPF:</span> {processData.negotiation.buyer.doc}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />
                    
                     {/* Equipe Envolvida */}
                    <div className="space-y-4">
                         <h3 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground"/>Equipe Envolvida</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
                            <div><Label>Captador</Label><p className="text-sm font-medium">{processData.team.captador}</p></div>
                            <div><Label>Equipe do Captador</Label><p className="text-sm font-medium">{processData.team.captadorTeam}</p></div>
                            <div><Label>Corretor da Venda</Label><p className="text-sm font-medium">{processData.team.vendedor}</p></div>
                            <div><Label>Gerente da Venda</Label><p className="text-sm font-medium">{processData.team.vendedorGerente}</p></div>
                        </div>
                    </div>

                    <Separator/>

                    {/* Valores e Responsáveis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-muted-foreground"/>Valores</h3>
                             <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex justify-between items-center"><span className="text-sm">Valor de Venda:</span> <span className="font-semibold">{formatCurrency(processData.values.saleValue)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-sm">Valor Negociado:</span> <span className="font-semibold text-primary">{formatCurrency(processData.values.negotiatedValue)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-sm">Valor de Entrada (Sinal):</span> <span className="font-semibold">{formatCurrency(processData.values.downPayment)}</span></div>
                             </div>
                        </div>
                         <div className="space-y-4">
                             <h3 className="font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-muted-foreground"/>Responsáveis</h3>
                             <div className="p-4 border rounded-lg space-y-3">
                                 <div className="flex justify-between items-center"><span className="text-sm">Setor Responsável:</span> <Badge variant="secondary">{processData.responsibles.sector}</Badge></div>
                                 <div className="flex justify-between items-center"><span className="text-sm">Correspondente:</span> <span className="font-medium">{processData.responsibles.correspondent}</span></div>
                             </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* Área de Ações e Acompanhamento */}
            <Card>
                <CardHeader>
                    <CardTitle>Acompanhamento do Processo</CardTitle>
                    <CardDescription>Área para os setores responsáveis atualizarem o andamento de suas tarefas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="finance">
                        <TabsList>
                            <TabsTrigger value="finance">Financeiro</TabsTrigger>
                            <TabsTrigger value="correspondent">Correspondente</TabsTrigger>
                            <TabsTrigger value="administrative">Administrativo</TabsTrigger>
                        </TabsList>
                        <TabsContent value="finance" className="mt-4">
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        <span>Status Financeiro</span>
                                        <Badge variant="warning">{processData.finance.status}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Label>Última Atualização / Observações</Label>
                                    <p className="text-sm border p-3 rounded-md bg-background min-h-24">{processData.finance.notes}</p>
                                    <Label htmlFor="finance-update">Adicionar nova atualização:</Label>
                                    <Textarea id="finance-update" placeholder="Ex: Pagamento de sinal confirmado. Liberando comissão..."/>
                                    <Button size="sm">Salvar Atualização Financeira</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="correspondent" className="mt-4">
                             <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        <span>Status do Financiamento</span>
                                        <Badge variant="status-blue">{processData.correspondent.status}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <Label>Última Atualização / Observações</Label>
                                    <p className="text-sm border p-3 rounded-md bg-background min-h-24">{processData.correspondent.notes}</p>
                                    <Label htmlFor="correspondent-update">Adicionar nova atualização:</Label>
                                    <Textarea id="correspondent-update" placeholder="Ex: Crédito aprovado com ressalvas. Aguardando laudo da engenharia..."/>
                                    <Button size="sm">Salvar Atualização do Correspondente</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="administrative" className="mt-4">
                             <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        <span>Status Administrativo / Contrato</span>
                                        <Badge>Contrato Gerado</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <Label>Última Atualização / Observações</Label>
                                    <p className="text-sm border p-3 rounded-md bg-background min-h-24">Contrato de compra e venda gerado no sistema. Aguardando assinaturas.</p>
                                    <Label htmlFor="admin-update">Adicionar nova atualização:</Label>
                                    <Textarea id="admin-update" placeholder="Ex: Coleta de assinatura do vendedor concluída."/>
                                    <Button size="sm">Salvar Atualização Administrativa</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
