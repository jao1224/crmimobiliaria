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
    name: "Sunnyvale Apartment",
    address: "123 Main St, Sunnyvale, CA",
    status: "Available",
    price: 750000,
    commission: 18750,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "modern apartment",
  },
  {
    id: "2",
    name: "Greenfield House",
    address: "456 Oak Ave, Greenfield, TX",
    status: "Sold",
    price: 1200000,
    commission: 24000,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "suburban house",
  },
  {
    id: "3",
    name: "Lakeside Villa",
    address: "789 Lake Rd, Lakeside, FL",
    status: "Pending",
    price: 2500000,
    commission: 75000,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "luxury villa",
  },
  {
    id: "4",
    name: "Downtown Loft",
    address: "321 Center St, Metro, NY",
    status: "Available",
    price: 500000,
    commission: 12500,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "city loft",
  },
  {
    id: "5",
    name: "Suburban Family Home",
    address: "654 Pine Ln, Suburbia, WA",
    status: "Available",
    price: 850000,
    commission: 18700,
    imageUrl: "https://placehold.co/80x80.png",
    imageHint: "family home",
  },
];

export default function PropertiesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property Listings</h1>
          <p className="text-muted-foreground">Manage your properties and find matches for clients.</p>
        </div>
        <div className="flex gap-2">
          <PropertyMatcher />
          <Button>Add Property</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>
            A list of all properties in your portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name & Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">
                  Commission
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Property image"
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
                    <Badge variant={property.status === 'Available' ? 'secondary' : property.status === 'Sold' ? 'destructive' : 'outline'}>
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property.price)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property.commission)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
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
