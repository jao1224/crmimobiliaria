

"use client";

import Image from "next/image";
import { MoreHorizontal, Upload, Trash2 } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useState, useEffect, useMemo, useRef, useContext } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { getProperties, addProperty, updateProperty, deleteProperty, propertyTypes, type Property, type PropertyType, getUsers, type User } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth, storage } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { ProfileContext } from "@/contexts/ProfileContext";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";


export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { activeProfile } = useContext(ProfileContext);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isPropertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const addPropertyFormRef = useRef<HTMLFormElement>(null);
  
  // Estados controlados para Selects no formulário de edição
  const [editCapturedBy, setEditCapturedBy] = useState<string>("");
  const [editType, setEditType] = useState<PropertyType | "">("");
  const [editStatus, setEditStatus] = useState<string>("");


  // Estados para filtros e ordenação
  const [statusFilter, setStatusFilter] = useState('all');
  const [captadorFilter, setCaptadorFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('default'); // 'price-asc', 'price-desc'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser !== undefined) {
        refreshProperties();
    }
  }, [currentUser]);

  const refreshProperties = async () => {
    setIsLoading(true);
    try {
      const [fetchedProperties, fetchedUsers] = await Promise.all([
        getProperties(),
        getUsers()
      ]);
      setProperties(fetchedProperties);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Dados",
        description: "Não foi possível buscar os imóveis ou usuários.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const captadores = useMemo(() => {
    const captadorMap = new Map<string, { name: string; role: string }>();

    properties.forEach(p => {
        if (!p.capturedBy) return;
        if (captadorMap.has(p.capturedBy)) return;
        let userFound = users.find(u => u.name === p.capturedBy);
        if (p.capturedBy === 'Admin' && !userFound) {
            userFound = users.find(u => u.role === 'Admin');
        }
        if (userFound) {
            captadorMap.set(userFound.name, { name: userFound.name, role: userFound.role });
        } else {
             captadorMap.set(p.capturedBy, { name: p.capturedBy, role: 'N/A' });
        }
    });

    const captadorDetails = Array.from(captadorMap.values());
    captadorDetails.sort((a, b) => a.name.localeCompare(b.name));
    
    return [{ name: 'Todos os Captadores', role: 'all' }, ...captadorDetails];
}, [properties, users]);


  const filteredAndSortedProperties = useMemo(() => {
    let filtered = [...properties];
    
    if (currentUser) {
        if (activeProfile === 'Corretor Autônomo' || activeProfile === 'Construtora') {
            filtered = filtered.filter(p => p.capturedById === currentUser.uid);
        } else if (activeProfile === 'Investidor') {
            filtered = filtered.filter(p => p.status === 'Disponível' || p.capturedById === currentUser.uid);
        }
    }
    
    if (activeProfile === 'Admin' || activeProfile === 'Imobiliária') {
        if (statusFilter !== 'all') {
          filtered = filtered.filter(p => p.status === statusFilter);
        }
        if (captadorFilter !== 'all' && captadorFilter !== 'Todos os Captadores') {
          filtered = filtered.filter(p => p.capturedBy === captadorFilter);
        }
    }
    
    if (sortOrder === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [properties, statusFilter, captadorFilter, sortOrder, activeProfile, currentUser]);


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
    setIsSaving(true);
    
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para adicionar um imóvel.',
      });
      setIsSaving(false);
      return;
    }
    
    try {
      const formData = new FormData(event.currentTarget);
      const newPropertyData = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        status: 'Disponível',
        price: Number(formData.get('price')),
        commission: Number(formData.get('commission')),
        imageHint: 'novo imovel',
        description: formData.get('description') as string,
        ownerInfo: formData.get('owner') as string,
        type: formData.get('type') as PropertyType,
      };

      await addProperty(newPropertyData, selectedFile, currentUser);
      await refreshProperties();
      toast({title: 'Sucesso!', description: 'Imóvel adicionado com sucesso.'});
      setPropertyDialogOpen(false);
    } catch (error) {
      console.error('Error adding property:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível adicionar o imóvel. Verifique o console para mais detalhes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProperty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    if (!editingProperty || !currentUser) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Imóvel ou usuário não encontrado para edição.' });
        setIsSaving(false);
        return;
    }

    try {
        const formData = new FormData(event.currentTarget);
        const capturedById = formData.get("capturedBy") as string;
        const selectedCaptador = users.find(u => u.id === capturedById);

        const updatedPropertyData: Partial<Property> = {
            name: formData.get("name") as string,
            address: formData.get("address") as string,
            price: Number(formData.get("price")),
            commission: Number(formData.get("commission")),
            capturedById: capturedById,
            capturedBy: selectedCaptador?.name || editingProperty.capturedBy,
            description: formData.get("description") as string,
            ownerInfo: formData.get("owner") as string,
            type: (editType || editingProperty.type) as PropertyType,
            status: (editStatus || editingProperty.status) as Property['status'],
        };
        
        await updateProperty(editingProperty.id, updatedPropertyData, selectedFile);
        await refreshProperties();
        toast({ title: "Sucesso!", description: "Imóvel atualizado com sucesso." });
        setEditDialogOpen(false);
        setEditingProperty(null);
    } catch (error) {
        console.error('Error updating property:', error);
        toast({ variant: "destructive", title: "Erro ao Atualizar", description: "Não foi possível atualizar o imóvel. Verifique o console." });
    } finally {
        setIsSaving(false);
    }
};


  const handleCardClick = (property: Property) => {
    setSelectedProperty(property);
    setDetailModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
    setEditingProperty(property);
    setImagePreview(property.imageUrl);
    setEditCapturedBy(property.capturedById);
    setEditType(property.type);
    setEditStatus(property.status);
    setEditDialogOpen(true);
  };
  
  const handleRemoveImage = () => {
    setImagePreview("https://placehold.co/600x400.png");
    setSelectedFile(null);
    toast({ title: "Imagem Removida", description: "A imagem do imóvel foi redefinida para a padrão. Salve para confirmar." });
  };

  const handleDeleteClick = (e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
    setSelectedProperty(property);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProperty) return;
    
    try {
        await deleteProperty(selectedProperty.id);
        await refreshProperties();
        toast({ title: "Imóvel Excluído", description: `O imóvel "${selectedProperty.name}" foi removido.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o imóvel." });
    } finally {
        setDeleteDialogOpen(false);
        setSelectedProperty(null);
    }
  };
  
  // Limpar o preview e o formulário ao fechar o dialog
  useEffect(() => {
    if (!isPropertyDialogOpen) {
        setImagePreview(null);
        setSelectedFile(null);
        addPropertyFormRef.current?.reset();
    }
    if (!isEditDialogOpen) {
        setImagePreview(null);
        setSelectedFile(null);
        setEditCapturedBy("");
        setEditType("");
        setEditStatus("");
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
      case "Em Negociação":
        return "warning";
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

  const getCaptadorWithRole = (property: Property) => {
    if (!property) return "Não informado.";
    const captadorUser = users.find(u => u.id === property.capturedById);
    const role = captadorUser ? captadorUser.role : null;
    return `${property.capturedBy}${role ? ` (${role})` : ''}`;
  }


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
            <DialogContent className="sm:max-w-4xl">
              <form onSubmit={handleAddProperty} ref={addPropertyFormRef}>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Imóvel</DialogTitle>
                  <DialogDescription>Preencha os detalhes abaixo para cadastrar um novo imóvel.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
                  {/* Coluna 1: Campos de texto */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Imóvel</Label>
                      <Input id="name" name="name" placeholder="Ex: Apartamento Vista Mar" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input id="address" name="address" placeholder="Rua, Número, Bairro, Cidade" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço (R$)</Label>
                        <Input id="price" name="price" type="number" placeholder="750000" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commission">Comissão (%)</Label>
                        <Input id="commission" name="commission" type="number" step="0.1" placeholder="5" required />
                      </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Imóvel</Label>
                        <Select name="type" required>
                            <SelectTrigger><SelectValue placeholder="Selecione um tipo"/></SelectTrigger>
                            <SelectContent>
                                {propertyTypes.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  {/* Coluna 2: Imagem e Textareas */}
                  <div className="space-y-4">
                     <div className="space-y-2">
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
                    <div className="space-y-2">
                     <Label htmlFor="description">Descrição</Label>
                     <Textarea id="description" name="description" placeholder="Detalhes do imóvel..." rows={2} />
                   </div>
                    <div className="space-y-2">
                     <Label htmlFor="owner">Informações do Proprietário</Label>
                     <Textarea id="owner" name="owner" placeholder="Nome, contato..." rows={2}/>
                   </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPropertyDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Imóvel"}
                  </Button>
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
              {(activeProfile === 'Admin' || activeProfile === 'Imobiliária') && (
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
                        <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={captadorFilter} onValueChange={setCaptadorFilter}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[220px]">
                        <SelectValue placeholder="Filtrar por Captador" />
                    </SelectTrigger>
                    <SelectContent>
                        {captadores.map(c => 
                            <SelectItem key={c.name} value={c.name === 'Todos os Captadores' ? 'all' : c.name}>
                                {c.role === 'all' ? c.name : `${c.name} - ${c.role}`}
                            </SelectItem>
                        )}
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
              )}
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
                    {property.status === "Em Negociação" && (
                        <div className="absolute top-4 left-0 w-full">
                        <div className="bg-warning text-warning-foreground font-bold text-center py-1 px-4 shadow-lg">
                                EM NEGOCIAÇÃO
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
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={(e) => handleDeleteClick(e, property)}>
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="truncate text-lg">{property.name}</CardTitle>
                        <CardDescription className="truncate">{property.address}</CardDescription>
                        <CardDescription className="font-mono text-xs pt-1">Cód: {property.displayCode}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow pt-2">
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {property.description}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Captador: {property.capturedBy}</span>
                        <Badge variant={getStatusVariant(property.status)} className={cn((property.status === 'Vendido' || property.status === 'Alugado' || property.status === 'Em Negociação') && 'hidden', getStatusClass(property.status))}>
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
                    <p className="text-sm text-muted-foreground mt-2">{getCaptadorWithRole(selectedProperty)}</p>
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
                       <Select name="capturedBy" defaultValue={editingProperty.capturedById} required>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>
                              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Imóvel</Label>
                        <Select value={editType || editingProperty.type} onValueChange={(v) => setEditType(v as PropertyType)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {propertyTypes.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={editStatus || editingProperty.status} onValueChange={setEditStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Disponível">Disponível</SelectItem>
                              <SelectItem value="Vendido">Vendido</SelectItem>
                              <SelectItem value="Alugado">Alugado</SelectItem>
                              <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-owner">Informações do Proprietário</Label>
                    <Textarea id="edit-owner" name="owner" defaultValue={editingProperty.ownerInfo} rows={3} />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o imóvel
              "{selectedProperty?.name}" do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProperty(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
