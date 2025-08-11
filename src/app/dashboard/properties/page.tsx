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

const properties = [
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
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listagem de Imóveis</h1>
          <p className="text-muted-foreground">Gerencie seus imóveis e encontre correspondências para clientes.</p>
        </div>
        <div className="flex gap-2">
          <PropertyMatcher />
          <Button>Adicionar Imóvel</Button>
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
