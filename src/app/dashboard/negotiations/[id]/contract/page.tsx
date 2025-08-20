

"use client";

import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter, useParams } from "next/navigation";
import { Printer, Save, Upload, FileText, Link as LinkIcon, ArrowLeft, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ProfileContext } from "@/contexts/ProfileContext";
import type { UserProfile } from "@/app/dashboard/layout";
import { getNegotiations, getProperties, type Property, type Negotiation, type ContractDetails, type Contrato, createOrUpdateContrato, getContrato } from "@/lib/data";
import { getClients, type Client } from "@/lib/crm-data";
import { doc, getDoc } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


const contractEditPermissions: UserProfile[] = ['Admin', 'Imobiliária'];


export default function ContractPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const negotiationId = params.id as string;
    
    const { activeProfile } = useContext(ProfileContext);
    const canEdit = contractEditPermissions.includes(activeProfile);

    const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
    const [property, setProperty] = useState<Property | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [realtor, setRealtor] = useState<{name: string, creci: string} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const [contrato, setContrato] = useState<Contrato | null>(null);
    const [contractData, setContractData] = useState<ContractDetails>({
        sellers: [{ name: "Ana Vendedora", doc: "987.654.321-00", address: "Rua dos Vendedores, 1010, Centro, Fortaleza" }],
        buyers: [{ name: "", doc: "", address: "" }],
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
    
    // Carrega os dados da negociação e do contrato associado
    useEffect(() => {
        const fetchData = async () => {
            if (!negotiationId) return;
            setIsLoading(true);

            try {
                const negDocRef = doc(db, 'negociacoes', negotiationId);
                const negDocSnap = await getDoc(negDocRef);

                if (negDocSnap.exists()) {
                    const foundNegotiation = { id: negDocSnap.id, ...negDocSnap.data() } as Negotiation;
                    setNegotiation(foundNegotiation);

                    // Buscar imóvel, cliente e corretor
                    const propDocRef = doc(db, 'imoveis', foundNegotiation.propertyId);
                    const clientDocRef = doc(db, 'clientes', foundNegotiation.clientId);
                    
                    const [propDocSnap, clientDocSnap] = await Promise.all([
                        getDoc(propDocRef),
                        getDoc(clientDocRef)
                    ]);
                    
                    const foundProperty = propDocSnap.exists() ? { id: propDocSnap.id, ...propDocSnap.data() } as Property : null;
                    const foundClient = clientDocSnap.exists() ? { id: clientDocSnap.id, ...clientDocSnap.data() } as Client : null;

                    setProperty(foundProperty);
                    setClient(foundClient);
                    setRealtor({ name: foundNegotiation.realtor, creci: "N/A" }); // Simulado

                    // Pré-preencher os dados dos compradores e vendedores
                    const buyers = foundClient ? [{ name: foundClient.name, doc: foundClient.document || 'N/A', address: foundClient.address || 'N/A' }] : [];
                    const sellers = foundProperty?.ownerInfo?.split('\n').map(line => {
                        const [name, doc, ...addressParts] = line.split(',');
                        return { name: name?.trim() || '', doc: doc?.trim() || '', address: addressParts.join(',').trim() || '' };
                    }).filter(s => s.name) || [{ name: 'Proprietário não informado', doc: '', address: '' }];


                    // Buscar ou inicializar o contrato
                    if (foundNegotiation.contratoId) {
                        const existingContrato = await getContrato(foundNegotiation.contratoId);
                        if (existingContrato) {
                            setContrato(existingContrato);
                            setContractData(existingContrato.details);
                        } else {
                            // Se não houver contrato salvo, mas houver dados, pré-preenche
                             setContractData(prev => ({...prev, buyers, sellers}));
                        }
                    } else {
                        setContractData(prev => ({...prev, buyers, sellers}));
                    }
                    
                    if (foundProperty && !foundNegotiation.contratoId) { // Só preenche se for um contrato novo
                        const commissionRate = foundProperty.commission || 5;
                        const commissionValue = foundNegotiation.value * (commissionRate / 100);
                        const defaultCommissionClause = `Os honorários devidos pela intermediação desta negociação, no montante de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionValue)}, correspondentes a ${commissionRate}% do valor da venda, são de responsabilidade do VENDEDOR(ES), a serem pagos à INTERVENIENTE ANUENTE na data da compensação do sinal.`;
                        setContractData(prev => ({...prev, commissionClause: defaultCommissionClause}));
                    }


                } else {
                    toast({ variant: 'destructive', title: "Erro", description: "Negociação não encontrada." });
                }
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar os dados do contrato." });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [negotiationId, toast]);
    
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setContractData(prev => ({ ...prev, [id]: value }));
    };
    
    const handlePartyChange = (partyType: 'buyers' | 'sellers', index: number, field: 'name' | 'doc' | 'address', value: string) => {
        setContractData(prev => {
            const updatedParties = [...(prev[partyType] || [])];
            updatedParties[index] = { ...updatedParties[index], [field]: value };
            return { ...prev, [partyType]: updatedParties };
        });
    };

    const addParty = (partyType: 'buyers' | 'sellers') => {
        setContractData(prev => ({
            ...prev,
            [partyType]: [...(prev[partyType] || []), { name: '', doc: '', address: '' }]
        }));
    };

    const removeParty = (partyType: 'buyers' | 'sellers', index: number) => {
        setContractData(prev => ({
            ...prev,
            [partyType]: (prev[partyType] || []).filter((_, i) => i !== index)
        }));
    };


    if (isLoading) {
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
    
    if (!negotiation || !property || !client || !realtor) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-xl font-semibold">Negociação não encontrada</h2>
                <p className="text-muted-foreground">Não foi possível carregar os dados para o ID: {negotiationId}</p>
                <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
            </div>
        );
    }

    const handleDownloadPdf = async () => {
        if (!property || !client || !realtor || !negotiation) return;
        
        setIsGeneratingPdf(true);
        try {
            const functions = getFunctions(db.app, 'southamerica-east1');
            const generateContractPdf = httpsCallable(functions, 'generateContractPdf');
            
            const fullContractData = {
                buyers: contractData.buyers,
                sellers: contractData.sellers,
                realtorName: realtor.name,
                realtorCreci: realtor.creci,
                propertyName: property.name,
                propertyCode: property.displayCode,
                propertyAddress: property.address,
                propertyArea: contractData.propertyArea,
                propertyRegistration: contractData.propertyRegistration,
                propertyRegistryOffice: contractData.propertyRegistryOffice,
                negotiationValue: new Intl.NumberFormat('pt-BR').format(negotiation.value),
                paymentTerms: contractData.paymentTerms,
                commissionClause: contractData.commissionClause,
                generalClauses: contractData.generalClauses,
                additionalClauses: contractData.additionalClauses,
                city: contractData.city,
                date: new Date(contractData.date).toLocaleDateString('pt-BR'),
            };

            const result = await generateContractPdf(fullContractData) as any;
            const pdfBase64 = result.data.pdfBase64;

            const byteCharacters = atob(pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Contrato-${property.displayCode}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            toast({ title: "PDF Gerado!", description: "O download do contrato foi iniciado." });

        } catch (error) {
            console.error("Erro ao gerar PDF: ", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível gerar o PDF. Verifique o console para mais detalhes." });
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await createOrUpdateContrato(negotiationId, { details: contractData });
            toast({ title: "Contrato Salvo!", description: "As informações do editor foram salvas com sucesso."});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o contrato.' });
        } finally {
             setIsSaving(false);
        }
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

            if (!allowedTypes.includes(file.type)) {
                toast({
                    variant: "destructive",
                    title: "Formato de arquivo inválido",
                    description: "Por favor, selecione um arquivo PDF, DOC, ou DOCX.",
                });
                e.target.value = ''; // Limpa o input
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast({ variant: "destructive", title: "Nenhum arquivo selecionado" });
            return;
        }
        setIsUploading(true);
        
        try {
            const storageRef = ref(storage, `contracts/${negotiationId}/${selectedFile.name}`);
            await uploadBytes(storageRef, selectedFile);
            const downloadUrl = await getDownloadURL(storageRef);

            const contratoId = await createOrUpdateContrato(negotiationId, {
                fileUrl: downloadUrl,
                fileName: selectedFile.name,
                fileType: selectedFile.type,
            });

            const updatedContrato = await getContrato(contratoId);
            setContrato(updatedContrato);

            toast({ title: "Sucesso!", description: "Arquivo do contrato enviado." });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro de Upload', description: 'Não foi possível enviar o arquivo.' });
        } finally {
            setIsUploading(false);
            setSelectedFile(null); 
            const inputFile = document.getElementById('contract-file') as HTMLInputElement;
            if(inputFile) inputFile.value = "";
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="no-print flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
                        <p className="text-muted-foreground">
                          ID da Negociação: {negotiationId} | Cód. Imóvel: {negotiation.propertyDisplayCode}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} variant="outline" disabled={isSaving || !canEdit}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Salvando..." : "Salvar Editor"}
                    </Button>
                    <Button onClick={handleDownloadPdf} variant="default" disabled={isGeneratingPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        {isGeneratingPdf ? "Gerando PDF..." : "Baixar PDF"}
                    </Button>
                </div>
            </div>

            <Card className="no-print">
                <CardHeader>
                    <CardTitle>Anexar Contrato Externo</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                     <p className="text-sm text-muted-foreground">
                        Se preferir, você pode anexar um arquivo de contrato (PDF, DOC, DOCX) diretamente do seu computador.
                     </p>
                    <div className="flex items-end gap-2">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="contract-file">Arquivo do Contrato</Label>
                            <Input id="contract-file" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                        </div>
                        <Button onClick={handleFileUpload} disabled={!selectedFile || isUploading}>
                            <Upload className="mr-2 h-4 w-4" />
                            {isUploading ? "Enviando..." : "Enviar"}
                        </Button>
                    </div>
                     {contrato?.fileUrl && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-md p-3">
                            <FileText className="h-5 w-5" />
                            <span className="font-medium">Contrato Anexado:</span>
                             <a href={contrato.fileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-800">
                                {contrato.fileName || 'Visualizar Contrato'} <LinkIcon className="h-4 w-4 inline-block ml-1" />
                            </a>
                        </div>
                    )}
                 </CardContent>
            </Card>

            <div className="relative no-print">
                <Separator />
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-sm text-muted-foreground">OU</div>
            </div>
            
            <div className="printable-area">
                <Card className="print:shadow-none print:border-none">
                    <CardHeader className="no-print">
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
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold">VENDEDOR(ES):</h3>
                                        <Button type="button" size="sm" variant="outline" onClick={() => addParty('sellers')} disabled={!canEdit}>Adicionar Vendedor</Button>
                                    </div>
                                    <div className="space-y-4">
                                        {contractData.sellers?.map((seller, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md relative">
                                                <div className="space-y-1">
                                                    <Label htmlFor={`sellerName-${index}`}>Nome</Label>
                                                    <Input id={`sellerName-${index}`} placeholder="Nome do Proprietário" value={seller.name} onChange={(e) => handlePartyChange('sellers', index, 'name', e.target.value)} disabled={!canEdit} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`sellerDoc-${index}`}>CPF/CNPJ</Label>
                                                    <Input id={`sellerDoc-${index}`} placeholder="Documento do Proprietário" value={seller.doc} onChange={(e) => handlePartyChange('sellers', index, 'doc', e.target.value)} disabled={!canEdit} />
                                                </div>
                                                <div className="col-span-1 md:col-span-2 space-y-1">
                                                    <Label htmlFor={`sellerAddress-${index}`}>Endereço</Label>
                                                    <Input id={`sellerAddress-${index}`} placeholder="Endereço Completo do Proprietário" value={seller.address} onChange={(e) => handlePartyChange('sellers', index, 'address', e.target.value)} disabled={!canEdit} />
                                                </div>
                                                {contractData.sellers.length > 1 && canEdit && (
                                                    <Button type="button" size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => removeParty('sellers', index)}>Remover</Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">COMPRADOR(A/ES):</h3>
                                     <div className="space-y-4">
                                        {(contractData.buyers || []).map((buyer, index) => (
                                             <div key={index} className="border p-4 rounded-md bg-muted/50">
                                                <p><strong>Nome:</strong> {buyer.name}, <strong>CPF/CNPJ:</strong> {buyer.doc}, residente e domiciliado em {buyer.address}.</p>
                                             </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">INTERVENIENTE ANUENTE (IMOBILIÁRIA):</h3>
                                    <p className="border p-4 rounded-md bg-muted/50">
                                        <strong>Razão Social:</strong> Ideal Imóveis Ltda., <strong>CNPJ:</strong> 00.123.456/0001-00, com sede em [Endereço da Imobiliária], representada por seu corretor responsável.<br/>
                                        <strong>Corretor Responsável:</strong> {realtor.name}, <strong>CRECI:</strong> {realtor.creci}.
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Object */}
                            <div className="space-y-2">
                                <h3 className="font-semibold">CLÁUSULA PRIMEIRA - DO OBJETO</h3>
                                <p className="text-justify text-sm">
                                    O presente contrato tem por objeto a promessa de compra e venda do imóvel a seguir descrito: <strong>{property.name} (Cód. {property.displayCode})</strong>, localizado na <strong>{property.address}</strong>.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="propertyArea">Área (m²)</Label>
                                        <Input id="propertyArea" placeholder="Ex: 120" value={contractData.propertyArea} onChange={handleInputChange} disabled={!canEdit} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="propertyRegistration">Matrícula do Imóvel</Label>
                                        <Input id="propertyRegistration" placeholder="Nº da Matrícula" value={contractData.propertyRegistration} onChange={handleInputChange} disabled={!canEdit} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="propertyRegistryOffice">Cartório de Registro</Label>
                                        <Input id="propertyRegistryOffice" placeholder="Ex: 1º Cartório de Registro de Imóveis de São Paulo" value={contractData.propertyRegistryOffice} onChange={handleInputChange} disabled={!canEdit} />
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
                                <Textarea id="paymentTerms" placeholder="Descreva os termos de pagamento. Ex: a) Sinal de R$ 50.000,00... b) O restante de R$ 700.000,00 será pago via financiamento bancário..." className="min-h-[100px]" value={contractData.paymentTerms} onChange={handleInputChange} disabled={!canEdit} />
                            </div>

                            {/* Commission */}
                            <div className="space-y-2">
                                <h3 className="font-semibold">CLÁUSULA TERCEIRA - DA COMISSÃO DE CORRETAGEM</h3>
                                <Label htmlFor="commissionClause">Texto da Cláusula de Comissão</Label>
                                <Textarea id="commissionClause" className="min-h-[120px]" value={contractData.commissionClause} onChange={handleInputChange} disabled={!canEdit} />
                            </div>

                            {/* General Clauses */}
                            <div className="space-y-2">
                                <h3 className="font-semibold">CLÁUSULA QUARTA - DAS DISPOSIÇÕES GERAIS</h3>
                                <Label htmlFor="generalClauses">Texto das Disposições Gerais</Label>
                                <Textarea id="generalClauses" className="min-h-[100px]" value={contractData.generalClauses} onChange={handleInputChange} disabled={!canEdit} />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="font-semibold">CLÁUSULAS ADICIONAIS</h3>
                                <Label htmlFor="additionalClauses">Cláusulas Adicionais (Opcional)</Label>
                                <Textarea id="additionalClauses" className="min-h-[100px]" placeholder="Adicione aqui outras cláusulas, se necessário." value={contractData.additionalClauses} onChange={handleInputChange} disabled={!canEdit} />
                            </div>

                            <Separator />

                            {/* Signatures */}
                             <div className="pt-8 text-center space-y-8">
                                {(contractData.buyers || []).map((buyer, index) => (
                                    <div key={`buyer-sig-${index}`}>
                                        _________________________<br/><strong>{buyer.name}</strong><br/>COMPRADOR(A)
                                    </div>
                                ))}
                                {(contractData.sellers || []).map((seller, index) => (
                                     <div key={`seller-sig-${index}`}>
                                        _________________________<br/><strong className="uppercase">{seller.name}</strong><br/>VENDEDOR(A)
                                    </div>
                                ))}
                                <div>
                                    _________________________<br/><strong>{realtor.name} (CRECI: {realtor.creci})</strong><br/>INTERVENIENTE ANUENTE
                                </div>
                            </div>

                            <div className="text-center text-sm text-muted-foreground pt-8">
                                <div className="grid grid-cols-2 gap-4 mx-auto max-w-sm">
                                    <Input id="city" placeholder="Cidade" value={contractData.city} onChange={handleInputChange} disabled={!canEdit} />
                                    <Input id="date" type="date" value={contractData.date} onChange={handleInputChange} disabled={!canEdit} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
