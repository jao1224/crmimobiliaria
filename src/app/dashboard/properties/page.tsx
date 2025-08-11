
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
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const initialProperties = [
  {
    id: "1",
    name: "Apartamento Sunnyvale",
    address: "Rua Principal, 123, Sunnyvale, CA",
    status: "Disponível",
    price: 750000,
    commission: 18750,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "apartamento moderno",
  },
  {
    id: "2",
    name: "Casa Greenfield",
    address: "Avenida Oak, 456, Greenfield, TX",
    status: "Vendido",
    price: 1200000,
    commission: 24000,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "casa suburbana",
  },
  {
    id: "3",
    name: "Vila Lakeside",
    address: "Estrada do Lago, 789, Lakeside, FL",
    status: "Pendente",
    price: 2500000,
    commission: 75000,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "vila de luxo",
  },
  {
    id: "4",
    name: "Loft no Centro",
    address: "Rua do Centro, 321, Metro, NY",
    status: "Disponível",
    price: 500000,
    commission: 12500,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "loft na cidade",
  },
  {
    id: "5",
    name: "Casa Familiar Suburbana",
    address: "Alameda dos Pinheiros, 654, Suburbia, WA",
    status: "Disponível",
    price: 850000,
    commission: 18700,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "casa de família",
  },
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState(initialProperties);
  const [isPropertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddProperty = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProperty = {
      id: String(properties.length + 1),
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      status: "Disponível",
      price: Number(formData.get("price")),
      commission: Number(formData.get("commission")),
      imageUrl: "https://placehold.co/80x80.png",
      imageHint: "novo imovel",
    };
    setProperties([...properties, newProperty]);
    setPropertyDialogOpen(false);
    toast({ title: "Sucesso!", description: "Imóvel adicionado com sucesso." });
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
                <TableHead>Nome & Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Preço</TableHead>
                <TableHead className="hidden md:table-cell">
                  Comissão
                </TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
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
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.commission)}
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
