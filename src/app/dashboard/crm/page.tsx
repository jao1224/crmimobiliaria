import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const leads = [
    { id: "L001", name: "John Smith", source: "Website", status: "New", assignedTo: "Jane Doe" },
    { id: "L002", name: "Maria Garcia", source: "Referral", status: "Contacted", assignedTo: "Jane Doe" },
    { id: "L003", name: "David Johnson", source: "Ad Campaign", status: "Qualified", assignedTo: "John Roe" },
];

const deals = [
    { id: "D001", property: "Sunnyvale Apartment", client: "Alice Williams", stage: "Proposal Sent", value: 750000, closeDate: "2024-08-15" },
    { id: "D002", property: "Downtown Loft", client: "Bob Brown", stage: "Negotiation", value: 500000, closeDate: "2024-07-30" },
];

export default function CrmPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Client & Lead Management</h1>
                    <p className="text-muted-foreground">Oversee your leads, deals, and client relationships.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Add Lead</Button>
                    <Button>New Deal</Button>
                </div>
            </div>
            <Tabs defaultValue="leads">
                <TabsList>
                    <TabsTrigger value="leads">Leads</TabsTrigger>
                    <TabsTrigger value="deals">Ongoing Deals</TabsTrigger>
                    <TabsTrigger value="clients">Clients</TabsTrigger>
                </TabsList>
                <TabsContent value="leads">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Leads</CardTitle>
                            <CardDescription>Recently acquired leads that need to be contacted.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.map(lead => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.name}</TableCell>
                                            <TableCell>{lead.source}</TableCell>
                                            <TableCell><Badge variant="secondary">{lead.status}</Badge></TableCell>
                                            <TableCell>{lead.assignedTo}</TableCell>
                                            <TableCell>
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem>Convert to Deal</DropdownMenuItem>
                                                        <DropdownMenuItem>Update Status</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="deals">
                <Card>
                        <CardHeader>
                            <CardTitle>Ongoing Deals</CardTitle>
                            <CardDescription>Active negotiations and sales processes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Stage</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Est. Close Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deals.map(deal => (
                                        <TableRow key={deal.id}>
                                            <TableCell className="font-medium">{deal.property}</TableCell>
                                            <TableCell>{deal.client}</TableCell>
                                            <TableCell><Badge variant="outline">{deal.stage}</Badge></TableCell>
                                            <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.value)}</TableCell>
                                            <TableCell>{deal.closeDate}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="clients">
                    <Card>
                        <CardHeader>
                            <CardTitle>Clients</CardTitle>
                            <CardDescription>Your database of clients.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Client list will be displayed here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
