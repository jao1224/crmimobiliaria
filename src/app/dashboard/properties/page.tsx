
"use client";

import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


// Define o tipo para um imóvel, espelhando a estrutura do Firestore
type Property = {
  id: string;
  name: string;
  address: string;
  status: string;
  price: number;
  commission: number; // Armazenado como taxa percentual, ex: 2.5
  imageUrl: string;
  imageHint: string;
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPropertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "properties"));
      const propertiesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(propertiesList);
    } catch (error) {
      console.error("Error fetching properties: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar imóveis",
        description: "Não foi possível buscar os dados do Firestore.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleAddProperty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newPropertyData = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      status: "Disponível",
      price: Number(formData.get("price")),
      commission: Number(formData.get("commission")), // Taxa %
      description: formData.get("description") as string,
      ownerInfo: formData.get("owner") as string,
      imageUrl: "https://placehold.co/80x80.png",
      imageHint: "novo imovel",
    };

    try {
      await addDoc(collection(db, "properties"), newPropertyData);
      toast({ title: "Sucesso!", description: "Imóvel adicionado com sucesso." });
      setPropertyDialogOpen(false);
      fetchProperties(); // Re-fetch para atualizar a lista
    } catch (error) {
      console.error("Error adding document: ", error);
       toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível adicionar o imóvel ao banco de dados.",
      });
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
                </div>
                <DialogFooter>
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
          <CardDescription>
            Uma lista de todos os imóveis em seu portfólio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Imagem</span>
                </TableHead>
                <TableHead>Nome &amp; Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Preço</TableHead>
                <TableHead className="hidden md:table-cell">
                  Comissão (%)
                </TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-16 w-16 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                       <Skeleton className="h-3 w-64 mt-2" />
                    </TableCell>
                    <TableCell>
                       <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Skeleton className="h-4 w-12" />
                    </TableCell>
                     <TableCell>
                       <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Imagem do imóvel"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={property.imageUrl}
                      width="64"
                      data-ai-hint={property.imageHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{property.name}</div>
                    <div className="text-sm text-muted-foreground">{property.address}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={property.status === 'Disponível' ? 'secondary' : property.status === 'Vendido' ? 'destructive' : 'outline'}>
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {`${property.commission}%`}
                  </TableCell>
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && properties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum imóvel encontrado. Comece adicionando um.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    