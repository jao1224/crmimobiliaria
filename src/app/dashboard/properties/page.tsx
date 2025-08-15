
"use client";

import Image from "next/image";
import { MoreHorizontal, Upload, Trash2, ArrowUpDown } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyMatcher } from "@/components/dashboard/property-matcher";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { PropertyType } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { realtors } from "@/lib/data";

// Define o tipo para um imóvel
export type Property = {
  id: string;
  name: string;
  address: string;
  status: string;
  price: number;
  type: PropertyType;
  commission: number; // Armazenado como taxa percentual, ex: 2.5
  imageUrl: string;
  imageHint: string;
  capturedBy: string; // Corretor que captou o imóvel
  description?: string;
  ownerInfo?: string;
};

// Dados simulados para os imóveis
export const initialProperties: Property[] = [
    { id: "prop1", name: "Apartamento Vista Mar", address: "Av. Beira Mar, 123, Fortaleza", status: "Disponível", price: 950000, commission: 2.5, imageUrl: "https://placehold.co/600x400.png", imageHint: "apartamento luxo", capturedBy: "Carlos Pereira", description: "Lindo apartamento com 3 quartos, 2 suítes, varanda gourmet com vista para o mar, cozinha moderna e 2 vagas de garagem. Condomínio com lazer completo.", ownerInfo: "Ana Vendedora - (85) 98877-6655", type: 'Revenda' },
    { id: "prop2", name: "Casa com Piscina", address: "Rua das Flores, 456, Eusébio", status: "Vendido", price: 1200000, commission: 3.0, imageUrl: "https://placehold.co/600x400.png", imageHint: "casa piscina", capturedBy: "Sofia Lima", description: "Espaçosa casa com 4 suítes, piscina, área gourmet com churrasqueira e um grande quintal gramado. Ideal para famílias que buscam conforto e lazer.", ownerInfo: "Bruno Costa - (85) 99988-7766", type: 'Revenda' },
    { id: "prop3", name: "Terreno Comercial", address: "Av. das Américas, 789, Fortaleza", status: "Disponível", price: 2500000, commission: 4.0, imageUrl: "https://placehold.co/600x400.png", imageHint: "terreno comercial", capturedBy: "Carlos Pereira", description: "Terreno plano de esquina em avenida movimentada, perfeito para construção de lojas, galpões ou centros comerciais. Excelente visibilidade e acesso.", ownerInfo: "Construtora Invest S.A. - (85) 3222-1100", type: 'Terreno' },
    { id: "prop4", name: "Loft Moderno", address: "Centro, Rua Principal, 100, Fortaleza", status: "Alugado", price: 450000, commission: 1.5, imageUrl: "https://placehold.co/600x400.png", imageHint: "loft moderno", capturedBy: "Joana Doe", description: "Loft no coração da cidade, com design industrial, pé-direito duplo, 1 quarto, cozinha integrada e totalmente mobiliado. Perfeito para solteiros ou casais.", ownerInfo: "Maria Investidora - (85) 98765-4321", type: 'Lançamento' },
    { id: "prop5", name: "Sítio Ecológico", address: "Guaramiranga, CE", status: "Disponível", price: 780000, commission: 3.5, imageUrl: "https://placehold.co/600x400.png", imageHint: "sitio ecologico", capturedBy: "Sofia Lima", description: "Belo sítio em meio à natureza, com casa principal, casa de hóspedes, pomar e acesso a uma cachoeira. Ideal para quem busca paz e tranquilidade.", ownerInfo: "Família Verde - (85) 91122-3344", type: 'Casa' },
    { id: "prop6", name: "Apartamento Centro", address: "Rua do Centro, 50, Fortaleza", status: "Disponível", price: 450000, commission: 2.0, imageUrl: "https://placehold.co/600x400.png", imageHint: "apartamento centro", capturedBy: "Joana Doe", description: "Apartamento de 2 quartos no centro da cidade, próximo a tudo. Recém-reformado, com móveis planejados na cozinha.", ownerInfo: "Investidor Anônimo - (85) 95544-3322", type: 'Apartamento' },
];


export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isPropertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados para filtros e ordenação
  const [statusFilter, setStatusFilter] = useState('all');
  const [captadorFilter, setCaptadorFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('default'); // 'price-asc', 'price-desc'

  const captadores = useMemo(() => {
    const captadorSet = new Set(initialProperties.map(p => p.capturedBy));
    return ['all', ...Array.from(captadorSet)];
  }, []);

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = [...properties];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (captadorFilter !== 'all') {
      filtered = filtered.filter(p => p.capturedBy === captadorFilter);
    }
    
    if (sortOrder === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [properties, statusFilter, captadorFilter, sortOrder]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast({ variant: 'destructive', title: "Arquivo muito grande", description: "Por favor, selecione uma imagem com menos de 2MB." });
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({ variant: 'destructive', title: "Formato inválido", description: "Por favor, selecione uma imagem (JPG, PNG, GIF, WebP)." });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleAddProperty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newProperty: Property = {
      id: `prop${Date.now()}`,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      status: "Disponível",
      price: Number(formData.get("price")),
      commission: Number(formData.get("commission")),
      imageUrl: imagePreview || "https://placehold.co/600x400.png",
      imageHint: "novo imovel",
      capturedBy: "Admin", // Simulado, poderia ser o usuário logado
      description: formData.get("description") as string,
      ownerInfo: formData.get("owner") as string,
      type: "Revenda", // Simulado
    };

    setProperties(prev => [...prev, newProperty]);
    toast({ title: "Sucesso!", description: "Imóvel adicionado com sucesso (simulado)." });
    setPropertyDialogOpen(false);
  };
  
  const handleUpdateProperty = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProperty) return;

    const formData = new FormData(event.currentTarget);
    
    const updatedProperty = {
      ...editingProperty,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      price: Number(formData.get("price")),
      commission: Number(formData.get("commission")),
      imageUrl: imagePreview || editingProperty.imageUrl,
      capturedBy: formData.get("capturedBy") as string,
      description: formData.get("description") as string,
      ownerInfo: formData.get("owner") as string,
      type: editingProperty.type, // Mantém o tipo existente
    };

    setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
    toast({ title: "Sucesso!", description: "Imóvel atualizado com sucesso (simulado)." });
    setEditDialogOpen(false);
    setEditingProperty(null);
  };

  const handleRowClick = (property: Property) => {
    setSelectedProperty(property);
    setDetailModalOpen(true);
  };

  const handleEditClick = (property: Property) => {
    setEditingProperty(property);
    setImagePreview(property.imageUrl);
    setEditDialogOpen(true);
  };

  const handleRemoveImage = () => {
    setImagePreview("https://placehold.co/600x400.png");
    setSelectedFile(null);
    toast({ title: "Imagem Removida", description: "A imagem do imóvel foi redefinida para a padrão. Salve para confirmar." });
  };
  
  // Limpar o preview ao fechar o dialog
  useEffect(() => {
    if (!isPropertyDialogOpen && !isEditDialogOpen) {
        setImagePreview(null);
        setSelectedFile(null);
    }
  }, [isPropertyDialogOpen, isEditDialogOpen]);

  const getStatusVariant = (status: string): VariantProps<typeof badgeVariants>["variant"] => {
    switch (status) {
      case "Disponível":
        return "success";
      case "Vendido":
        return "destructive";
      case "Alugado":
        return "info";
      default:
        return "secondary";
    }
  }

  const getStatusClass = (status: string): string => {
    switch (status) {
        case "Alugado":
            return "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80";
        default:
            return "";
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listagem de Imóveis</h1>
          <p className="text-muted-foreground">Gerencie seus imóveis e encontre correspondências para clientes.</p>
        </div>
        <div className="flex gap-2">
          <PropertyMatcher />
          <Dialog open={isPropertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
            <DialogTrigger asChild>
              <Button>Adicionar Imóvel</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Imóvel</DialogTitle>
                <DialogDescription>Preencha os detalhes abaixo para cadastrar um novo imóvel.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProperty}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Imóvel</Label>
                    <Input id="name" name="name" placeholder="Ex: Apartamento Vista Mar" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" name="address" placeholder="Rua, Número, Bairro, Cidade" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input id="price" name="price" type="number" placeholder="750000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission">Comissão (%)</Label>
                    <Input id="commission" name="commission" type="number" step="0.1" placeholder="2.5" required />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <Label htmlFor="description">Descrição</Label>
                     <Textarea id="description" name="description" placeholder="Detalhes do imóvel, como número de quartos, banheiros, área, etc." />
                  </div>
                   <div className="md:col-span-2 space-y-2">
                     <Label htmlFor="owner">Informações do Proprietário</Label>
                     <Textarea id="owner" name="owner" placeholder="Nome, contato e outras informações do proprietário." />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="image">Imagem do Imóvel</Label>
                    <div className="flex items-center gap-4">
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Preview do imóvel" width={80} height={80} className="rounded-md object-cover aspect-square"/>
                        ) : (
                            <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                <Upload className="h-6 w-6"/>
                            </div>
                        )}
                        <Input id="image" name="image" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPropertyDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar Imóvel</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Imóveis</CardTitle>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
             <CardDescription>
                Uma lista de todos os imóveis em seu portfólio.
             </CardDescription>
              <div className="flex flex-wrap items-center gap-2">
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[150px]">
                        <SelectValue placeholder="Filtrar por Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="Disponível">Disponível</SelectItem>
                        <SelectItem value="Vendido">Vendido</SelectItem>
                        <SelectItem value="Alugado">Alugado</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={captadorFilter} onValueChange={setCaptadorFilter}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                        <SelectValue placeholder="Filtrar por Captador" />
                    </SelectTrigger>
                    <SelectContent>
                        {captadores.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Todos os Captadores' : c}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                        <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Padrão</SelectItem>
                        <SelectItem value="price-asc">Preço (Crescente)</SelectItem>
                        <SelectItem value="price-desc">Preço (Decrescente)</SelectItem>
                    </SelectContent>
                </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Imagem</span>
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Nome &amp; Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Preço</TableHead>
                <TableHead className="hidden md:table-cell">Captador</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedProperties.map((property) => (
                <TableRow 
                  key={property.id} 
                  onClick={() => handleRowClick(property)} 
                  className={cn(
                      "transition-all duration-200",
                      property.status === 'Disponível' 
                          ? 'cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1' 
                          : 'opacity-60'
                  )}
                >
                  <TableCell className="hidden sm:table-cell">
                    <div className="relative w-16 h-16">
                      <Image
                        alt="Imagem do imóvel"
                        className="aspect-square rounded-md object-cover"
                        height={64}
                        src={property.imageUrl}
                        width={64}
                        data-ai-hint={property.imageHint}
                      />
                      {property.status === 'Vendido' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
                           <div className="absolute w-full bg-red-500 text-white text-xs font-bold uppercase text-center py-0.5 transform -rotate-45">
                                Vendido
                           </div>
                        </div>
                      )}
                       {property.status === 'Alugado' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
                           <div className="absolute w-full bg-blue-500 text-white text-xs font-bold uppercase text-center py-0.5 transform -rotate-45">
                                Alugado
                           </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{property.id.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{property.name}</div>
                    <div className="text-sm text-muted-foreground">{property.address}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(property.status)} className={getStatusClass(property.status)}>
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {property.capturedBy}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Alternar menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(property); }}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(property); }}>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {filteredAndSortedProperties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum imóvel encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          {selectedProperty && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProperty.name}</DialogTitle>
                <DialogDescription>{selectedProperty.address}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <Image
                    alt="Imagem do imóvel"
                    className="aspect-video w-full rounded-md object-cover"
                    height="400"
                    src={selectedProperty.imageUrl}
                    width="600"
                    data-ai-hint={selectedProperty.imageHint}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">Descrição</h3>
                    <p className="text-sm text-muted-foreground mt-2">{selectedProperty.description || "Nenhuma descrição disponível."}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Detalhes</h3>
                    <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                      <span className="font-medium text-foreground">Preço:</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.price)}</span>
                      
                      <span className="font-medium text-foreground">Comissão:</span>
                      <span>{selectedProperty.commission}%</span>

                      <span className="font-medium text-foreground">Status:</span>
                      <span><Badge variant={getStatusVariant(selectedProperty.status)} className={getStatusClass(selectedProperty.status)}>{selectedProperty.status}</Badge></span>
                      
                      <span className="font-medium text-foreground">Tipo:</span>
                      <span><Badge variant="secondary">{selectedProperty.type}</Badge></span>
                    </div>
                  </div>
                   <div>
                    <h3 className="font-semibold text-lg">Proprietário</h3>
                    <p className="text-sm text-muted-foreground mt-2">{selectedProperty.ownerInfo || "Nenhuma informação disponível."}</p>
                  </div>
                   <div>
                    <h3 className="font-semibold text-lg">Captado por</h3>
                    <p className="text-sm text-muted-foreground mt-2">{selectedProperty.capturedBy || "Não informado."}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setDetailModalOpen(false)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Imóvel</DialogTitle>
            <DialogDescription>Atualize os detalhes do imóvel abaixo.</DialogDescription>
          </DialogHeader>
          {editingProperty && (
            <form onSubmit={handleUpdateProperty}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome do Imóvel</Label>
                  <Input id="edit-name" name="name" defaultValue={editingProperty.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Endereço</Label>
                  <Input id="edit-address" name="address" defaultValue={editingProperty.address} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Preço (R$)</Label>
                  <Input id="edit-price" name="price" type="number" defaultValue={editingProperty.price} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-commission">Comissão (%)</Label>
                  <Input id="edit-commission" name="commission" type="number" step="0.1" defaultValue={editingProperty.commission} required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="edit-capturedBy">Captado por</Label>
                   <Select name="capturedBy" defaultValue={editingProperty.capturedBy} required>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                          {realtors.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"></div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea id="edit-description" name="description" defaultValue={editingProperty.description} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="edit-owner">Informações do Proprietário</Label>
                  <Textarea id="edit-owner" name="owner" defaultValue={editingProperty.ownerInfo} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="edit-image">Imagem do Imóvel</Label>
                    <div className="flex items-center gap-4">
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Preview do imóvel" width={80} height={80} className="rounded-md object-cover aspect-square"/>
                        ) : (
                             <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                <Upload className="h-6 w-6"/>
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <Input id="edit-image" name="image" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" />
                          <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage} disabled={!imagePreview || imagePreview.includes('placehold.co')}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover Foto
                          </Button>
                        </div>
                    </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

      

    

    