
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
import { MoreHorizontal, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type Team = {
    id: string;
    name: string;
    members: TeamMember[];
};

const initialTeamMembers: TeamMember[] = [
    { id: "TM001", name: "Carlos Pereira", email: "carlos.p@example.com", role: "Gerente de Vendas" },
    { id: "TM002", name: "Sofia Lima", email: "sofia.l@example.com", role: "Corretor" },
    { id: "TM003", name: "Ricardo Alves", email: "ricardo.a@example.com", role: "Administrativo" },
];

const initialTeams: Team[] = [
    { id: "T01", name: "Equipe Alpha", members: [initialTeamMembers[0], initialTeamMembers[1]] },
    { id: "T02", name: "Equipe Beta", members: [initialTeamMembers[2]] },
];

const roles = [
    "Administrativo", "Financeiro", "Jurídico", "Correspondente Bancário",
    "Locação", "Leilão", "Despachante", "Avaliador", "Gerente",
    "Coordenador", "Corretor", "Secretária", "Viabilizador"
];

export default function SettingsPage() {
    const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
    const [teams, setTeams] = useState(initialTeams);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isTeamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false);
    const [isTeamDialogOpen, setTeamDialogOpen] = useState(false);
    const [isManageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
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

    const handleAddTeam = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newTeam: Team = {
            id: `T${String(teams.length + 1).padStart(2, '0')}`,
            name: formData.get("team-name") as string,
            members: [],
        };
        setTeams([...teams, newTeam]);
        setTeamDialogOpen(false);
        toast({ title: "Sucesso!", description: "Equipe criada com sucesso." });
    };

    const handleManageMembers = (team: Team) => {
        setSelectedTeam(team);
        setManageMembersDialogOpen(true);
    };


    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie sua conta, equipes e permissões do aplicativo.</p>
            </div>

            <Tabs defaultValue="team">
                <TabsList>
                    <TabsTrigger value="profile">Perfil</TabsTrigger>
                    <TabsTrigger value="team">Membros da Equipe</TabsTrigger>
                    <TabsTrigger value="teams">Equipes</TabsTrigger>
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
                         <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Membros da Equipe</CardTitle>
                                <CardDescription>Gerencie sua equipe e suas funções.</CardDescription>
                            </div>
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
                    </Card>
                </TabsContent>
                <TabsContent value="teams">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Equipes</CardTitle>
                                <CardDescription>Crie e gerencie as equipes de vendas da sua imobiliária.</CardDescription>
                            </div>
                            <Dialog open={isTeamDialogOpen} onOpenChange={setTeamDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>Criar Nova Equipe</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Criar Nova Equipe</DialogTitle>
                                        <DialogDescription>Dê um nome para a sua nova equipe.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddTeam}>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="team-name">Nome da Equipe</Label>
                                                <Input id="team-name" name="team-name" placeholder="Ex: Equipe de Lançamentos" required />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Salvar Equipe</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome da Equipe</TableHead>
                                        <TableHead>Nº de Membros</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teams.map((team) => (
                                        <TableRow key={team.id}>
                                            <TableCell className="font-medium">{team.name}</TableCell>
                                            <TableCell>{team.members.length}</TableCell>
                                            <TableCell>
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleManageMembers(team)}>Gerenciar Membros</DropdownMenuItem>
                                                        <DropdownMenuItem>Renomear</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
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
            
            <Dialog open={isManageMembersDialogOpen} onOpenChange={setManageMembersDialogOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Membros da Equipe: {selectedTeam?.name}</DialogTitle>
                        <DialogDescription>Adicione ou remova membros desta equipe.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-8 py-4">
                        <div className="space-y-4">
                            <h3 className="font-semibold">Adicionar Novo Membro</h3>
                             <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-member-name">Nome</Label>
                                    <Input id="new-member-name" name="name" placeholder="Nome completo" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-member-email">E-mail</Label>
                                    <Input id="new-member-email" name="email" type="email" placeholder="email@example.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-member-role">Função</Label>
                                    <Select name="role" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma função" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" className="w-full">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Adicionar à Equipe
                                </Button>
                            </form>
                        </div>
                        <div className="space-y-4">
                             <h3 className="font-semibold">Membros Atuais</h3>
                            <Card>
                                <CardContent className="p-0">
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>Função</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedTeam?.members.map(member => (
                                                <TableRow key={member.id}>
                                                    <TableCell className="font-medium">{member.name}</TableCell>
                                                    <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                             {selectedTeam?.members.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                        Nenhum membro nesta equipe.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}

