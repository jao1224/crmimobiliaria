
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
};

const initialTeamMembers: TeamMember[] = [
    { id: "TM001", name: "Carlos Pereira", email: "carlos.p@example.com", role: "Gerente de Vendas" },
    { id: "TM002", name: "Sofia Lima", email: "sofia.l@example.com", role: "Corretor" },
    { id: "TM003", name: "Ricardo Alves", email: "ricardo.a@example.com", role: "Administrativo" },
];

const roles = [
    "Administrativo", "Financeiro", "Jurídico", "Correspondente Bancário",
    "Locação", "Leilão", "Despachante", "Avaliador", "Gerente",
    "Coordenador", "Corretor", "Secretária", "Viabilizador"
];

export default function SettingsPage() {
    const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
    const [isTeamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleAddTeamMember = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newMember: TeamMember = {
            id: `TM${String(teamMembers.length + 1).padStart(3, '0')}`,
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            role: formData.get("role") as string,
        };
        setTeamMembers([...teamMembers, newMember]);
        setTeamMemberDialogOpen(false);
        toast({ title: "Sucesso!", description: "Membro da equipe adicionado com sucesso." });
    };


    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie sua conta, equipe e configurações do aplicativo.</p>
            </div>

            <Tabs defaultValue="team">
                <TabsList>
                    <TabsTrigger value="profile">Perfil</TabsTrigger>
                    <TabsTrigger value="team">Membros da Equipe</TabsTrigger>
                    <TabsTrigger value="permissions">Permissões</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Meu Perfil</CardTitle>
                            <CardDescription>Atualize suas informações pessoais e senha.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" defaultValue="Jane Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" defaultValue="jane.doe@example.com" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="current-password">Senha Atual</Label>
                                <Input id="current-password" type="password" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <Input id="new-password" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Salvar Alterações</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="team">
                    <Card>
                        <CardHeader>
                            <CardTitle>Membros da Equipe</CardTitle>
                            <CardDescription>Gerencie sua equipe e suas funções.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>E-mail</TableHead>
                                        <TableHead>Função</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">{member.name}</TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>{member.role}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter>
                             <Dialog open={isTeamMemberDialogOpen} onOpenChange={setTeamMemberDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>Adicionar Membro</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Adicionar Novo Membro</DialogTitle>
                                        <DialogDescription>Preencha os detalhes para convidar um novo membro para a equipe.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddTeamMember}>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nome</Label>
                                                <Input id="name" name="name" placeholder="Nome completo" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">E-mail</Label>
                                                <Input id="email" name="email" type="email" placeholder="email@example.com" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="role">Função</Label>
                                                <Select name="role" required>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione uma função" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Adicionar Membro</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="permissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissões</CardTitle>
                            <CardDescription>Configure os níveis de acesso para diferentes funções.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>A interface de configuração de permissões estará aqui.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
