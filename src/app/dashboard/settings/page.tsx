
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, UserPlus, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, arrayRemove, DocumentReference } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type Team = {
    id: string;
    name: string;
    memberIds: string[];
};

const roles = [
    "Administrativo", "Financeiro", "Jurídico", "Correspondente Bancário",
    "Locação", "Leilão", "Despachante", "Avaliador", "Gerente",
    "Coordenador", "Corretor", "Secretária", "Viabilizador"
];

export default function SettingsPage() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isTeamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false);
    const [isTeamDialogOpen, setTeamDialogOpen] = useState(false);
    const [isManageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
    const { toast } = useToast();
    
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [isLoadingTeams, setIsLoadingTeams] = useState(true);
    const [isSaving, setIsSaving] = useState(false);


    const fetchData = async () => {
        setIsLoadingMembers(true);
        setIsLoadingTeams(true);
        try {
            const membersQuery = await getDocs(collection(db, "users"));
            setTeamMembers(membersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember)));
            
            const teamsQuery = await getDocs(collection(db, "teams"));
            setTeams(teamsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));

        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os dados." });
        } finally {
            setIsLoadingMembers(false);
            setIsLoadingTeams(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddTeamMember = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const newMemberData = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            role: formData.get("role") as string,
        };
        
        try {
            await addDoc(collection(db, "users"), newMemberData);
            setTeamMemberDialogOpen(false);
            toast({ title: "Sucesso!", description: "Membro da equipe adicionado com sucesso." });
            fetchData();
        } catch(error) {
             toast({ variant: "destructive", title: "Erro", description: "Falha ao adicionar membro." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTeam = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const newTeamData = {
            name: formData.get("team-name") as string,
            memberIds: [],
        };
        try {
            await addDoc(collection(db, "teams"), newTeamData);
            setTeamDialogOpen(false);
            toast({ title: "Sucesso!", description: "Equipe criada com sucesso." });
            fetchData();
        } catch(error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao criar equipe." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleManageMembers = (team: Team) => {
        setSelectedTeam(team);
        setManageMembersDialogOpen(true);
    };

    const handleAddMemberToTeam = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedTeam) return;

        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const memberId = formData.get("memberId") as string;
        
        if (selectedTeam.memberIds.includes(memberId)) {
            toast({ variant: "destructive", title: "Atenção", description: "Este membro já faz parte da equipe." });
            setIsSaving(false);
            return;
        }

        try {
            const teamRef = doc(db, "teams", selectedTeam.id);
            await updateDoc(teamRef, {
                memberIds: arrayUnion(memberId)
            });
            toast({ title: "Sucesso!", description: "Membro adicionado à equipe." });
            fetchData(); // Refresh all data
            // Update selectedTeam state locally to reflect the change immediately in the dialog
            setSelectedTeam(prev => prev ? { ...prev, memberIds: [...prev.memberIds, memberId] } : null);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o membro." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveMemberFromTeam = async (memberId: string) => {
        if (!selectedTeam) return;

        try {
            const teamRef = doc(db, "teams", selectedTeam.id);
            await updateDoc(teamRef, {
                memberIds: arrayRemove(memberId)
            });
            toast({ title: "Sucesso!", description: "Membro removido da equipe." });
            fetchData(); // Refresh all data
             // Update selectedTeam state locally
            setSelectedTeam(prev => prev ? { ...prev, memberIds: prev.memberIds.filter(id => id !== memberId) } : null);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o membro." });
        }
    };
    
    const getMembersForTeam = (team: Team) => {
        return teamMembers.filter(member => team.memberIds.includes(member.id));
    };


    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie sua conta, equipes e permissões do aplicativo.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
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
                                            <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando...": "Adicionar Membro"}</Button>
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
                                    {isLoadingMembers ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : teamMembers.length > 0 ? (
                                        teamMembers.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">{member.name}</TableCell>
                                                <TableCell>{member.email}</TableCell>
                                                <TableCell>{member.role}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhum membro encontrado.</TableCell></TableRow>
                                    )}
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
                                            <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar Equipe"}</Button>
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
                                    {isLoadingTeams ? (
                                        Array.from({ length: 2 }).map((_, i) => (
                                             <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : teams.length > 0 ? (
                                        teams.map((team) => (
                                            <TableRow key={team.id}>
                                                <TableCell className="font-medium">{team.name}</TableCell>
                                                <TableCell>{team.memberIds.length}</TableCell>
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
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhuma equipe encontrada.</TableCell></TableRow>
                                    )}
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
                             <form onSubmit={handleAddMemberToTeam} className="space-y-4">
                                <div className="space-y-2">
                                     <Label htmlFor="memberId">Selecione um Membro</Label>
                                     <Select name="memberId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um membro para adicionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamMembers.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" className="w-full" disabled={isSaving}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {isSaving ? "Adicionando..." : "Adicionar à Equipe"}
                                </Button>
                            </form>
                        </div>
                        <div className="space-y-4">
                             <h3 className="font-semibold">Membros Atuais</h3>
                            <Card>
                                <CardContent className="p-0 max-h-60 overflow-y-auto">
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>Função</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedTeam && getMembersForTeam(selectedTeam).map(member => (
                                                <TableRow key={member.id}>
                                                    <TableCell className="font-medium">{member.name}</TableCell>
                                                    <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveMemberFromTeam(member.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                             {selectedTeam && getMembersForTeam(selectedTeam).length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
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
