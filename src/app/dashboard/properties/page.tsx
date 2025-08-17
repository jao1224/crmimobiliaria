
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
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { Property, PropertyType } from "@/lib/data";
import { getProperties, addProperty, realtors } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true);
      try {
        const fetchedProperties = getProperties(); // In a real app, this would be async
        setProperties(fetchedProperties);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        toast({
          variant: "destructive",
          title: "Erro ao Carregar Imóveis",
          description: "Não foi possível buscar os imóveis.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadProperties();
  }, [toast]);

  const refreshProperties = () => {
    setIsLoading(true);
    try {
        const fetchedProperties = getProperties();
        setProperties(fetchedProperties);
    } catch (error) {
        console.error("Failed to fetch properties:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Atualizar",
            description: "Não foi possível recarregar a lista de imóveis.",
        });
    } finally {
        setIsLoading(false);
    }
  };


  const captadores = useMemo(() => {
    if (!properties || properties.length === 0) return [];
    const captadorSet = new Set(properties.map(p => p.capturedBy));
    return ['all', ...Array.from(captadorSet)];
  }, [properties]);

  const filteredAndSortedProperties = useMemo(() => {
    if (!properties) return [];
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

    addProperty(newProperty);
    refreshProperties();
    toast({ title: "Sucesso!", description: "Imóvel adicionado com sucesso." });
    setPropertyDialogOpen(false);
    event.currentTarget.reset();
  };
  
  const handleUpdateProperty = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProperty) return;

    const formData = new FormData(event.currentTarget);
    
    const updatedProperty: Property = {
      ...editingProperty,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      price: Number(formData.get("price")),
      commission: Number(formData.get("commission")),
      imageUrl: imagePreview || editingProperty.imageUrl,
      capturedBy: formData.get("capturedBy") as string,
      description: formData.get("description") as string,
      ownerInfo: formData.get("owner") as string,
      type: formData.get("type") as PropertyType,
    };
    
    // Na versão simulada, apenas atualizamos o estado local
    // Em uma app real, você chamaria uma função para atualizar no DB
    setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));

    toast({ title: "Sucesso!", description: "Imóvel atualizado com sucesso." });
    setEditDialogOpen(false);
    setEditingProperty(null);
  };

  const handleCardClick = (property: Property) => {
    setSelectedProperty(property);
    setDetailModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
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
            return "border-transparent bg-info text-info-foreground hover:bg-info/80";
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
            <DialogContent className="sm:max-w-xl">
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
           {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-1/3" />
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedProperties.map((property) => (
                <Card
                    key={property.id}
                    onClick={() => handleCardClick(property)}
                    className={cn(
                    "overflow-hidden transition-all duration-200 flex flex-col",
                    property.status === 'Disponível'
                        ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
                        : ''
                    )}
                >
                    <div className="relative">
                    <Image
                        alt={property.name}
                        className="aspect-video w-full object-cover"
                        height={225}
                        src={property.imageUrl}
                        width={400}
                        data-ai-hint={property.imageHint}
                    />
                    {property.status === "Vendido" && (
                        <div className="absolute top-4 left-0 w-full">
                        <div className="bg-destructive text-destructive-foreground font-bold text-center py-1 px-4 shadow-lg">
                                VENDIDO
                            </div>
                        </div>
                    )}
                    {property.status === "Alugado" && (
                        <div className="absolute top-4 left-0 w-full">
                        <div className="bg-info text-info-foreground font-bold text-center py-1 px-4 shadow-lg">
                                ALUGADO
                            </div>
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => e.stopPropagation()}
                            >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Alternar menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => handleEditClick(e, property)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCardClick(property); }}>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                            Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    </div>
                    <CardHeader>
                        <CardTitle className="truncate text-lg">{property.name}</CardTitle>
                        <CardDescription className="truncate">{property.address}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                    </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Captador: {property.capturedBy}</span>
                        <Badge variant={getStatusVariant(property.status)} className={cn((property.status === 'Vendido' || property.status === 'Alugado') && 'hidden', getStatusClass(property.status))}>
                        {property.status}
                        </Badge>
                    </CardFooter>
                </Card>
                ))}
                {filteredAndSortedProperties.length === 0 && (
                    <div className="col-span-full h-24 text-center flex items-center justify-center">
                        Nenhum imóvel encontrado com os filtros atuais.
                    </div>
                )}
            </div>
           )}
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

                      <span className="font-medium text-foreground">Cód. Imóvel:</span>
                      <span className="font-mono text-xs">{selectedProperty.id}</span>
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Imóvel</DialogTitle>
            <DialogDescription>Atualize os detalhes do imóvel abaixo.</DialogDescription>
          </DialogHeader>
          {editingProperty && (
            <form onSubmit={handleUpdateProperty}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
                {/* Coluna da Imagem e Descrição */}
                <div className="space-y-4">
                  <div className="space-y-2 flex flex-col items-center">
                    <Label>Imagem do Imóvel</Label>
                    {imagePreview ? (
                        <Image src={imagePreview} alt="Preview do imóvel" width={400} height={225} className="rounded-md object-cover aspect-video w-full"/>
                    ) : (
                         <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                            <Upload className="h-10 w-10"/>
                        </div>
                    )}
                    <div className="flex w-full gap-2 pt-2">
                      <Input id="edit-image" name="image" type="file" onChange={handleFileChange} className="w-full" accept="image/png, image/jpeg, image/gif, image/webp" />
                      <Button type="button" variant="outline" size="icon" onClick={handleRemoveImage} disabled={!imagePreview || imagePreview.includes('placehold.co')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea id="edit-description" name="description" defaultValue={editingProperty.description} rows={3} />
                  </div>
                </div>

                {/* Coluna dos Campos */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome do Imóvel</Label>
                      <Input id="edit-name" name="name" defaultValue={editingProperty.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Endereço</Label>
                      <Input id="edit-address" name="address" defaultValue={editingProperty.address} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Preço (R$)</Label>
                      <Input id="edit-price" name="price" type="number" defaultValue={editingProperty.price} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-commission">Comissão (%)</Label>
                      <Input id="edit-commission" name="commission" type="number" step="0.1" defaultValue={editingProperty.commission} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-capturedBy">Captado por</Label>
                       <Select name="capturedBy" defaultValue={editingProperty.capturedBy} required>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>
                              {realtors.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Imóvel</Label>
                        <Select name="type" defaultValue={editingProperty.type}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Lançamento">Lançamento</SelectItem>
                                <SelectItem value="Revenda">Revenda</SelectItem>
                                <SelectItem value="Terreno">Terreno</SelectItem>
                                <SelectItem value="Casa">Casa</SelectItem>
                                <SelectItem value="Apartamento">Apartamento</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-owner">Informações do Proprietário</Label>
                    <Textarea id="edit-owner" name="owner" defaultValue={editingProperty.ownerInfo} rows={3} />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t">
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
