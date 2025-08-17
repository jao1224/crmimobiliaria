
"use client";

import { useState, useEffect, useContext } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ProfileContext } from "@/contexts/ProfileContext";
import { cn } from "@/lib/utils";
import { type UserProfile, userProfiles, menuConfig, allModules } from "@/lib/permissions";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from "firebase/auth";


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

const roles = userProfiles.filter(p => ['Admin', 'Imobiliária', 'Financeiro', 'Corretor Autônomo', 'Investidor', 'Construtora'].includes(p));


export default function SettingsPage() {
    const { activeProfile } = useContext(ProfileContext);
    const hasPermission = activeProfile === 'Admin' || activeProfile === 'Imobiliária';

    // Estados da UI
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Estados do Perfil
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Estados das Equipes
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isTeamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false);
    const [isTeamDialogOpen, setTeamDialogOpen] = useState(false);
    const [isManageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setName(currentUser.displayName || '');
            setEmail(currentUser.email || '');
        }
        
        // Carregar membros da equipe e equipes do Firestore (se necessário)
        const fetchTeamData = async () => {
            if (hasPermission) {
                const usersSnapshot = await getDocs(collection(db, "users"));
                setTeamMembers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember)));

                // Simulação para equipes
                // setTeams(initialTeams);
            }
        };

        fetchTeamData();
    }, [hasPermission]);

    const handleProfileUpdate = async () => {
        setIsSaving(true);
        const currentUser = auth.currentUser;

        if (!currentUser || !currentUser.email) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não encontrado.' });
            setIsSaving(false);
            return;
        }

        try {
            // 1. Atualizar nome (se mudou)
            if (currentUser.displayName !== name) {
                await updateProfile(currentUser, { displayName: name });
                await setDoc(doc(db, "users", currentUser.uid), { name }, { merge: true });
                toast({ title: 'Sucesso', description: 'Seu nome foi atualizado.' });
            }

            // 2. Atualizar senha (se preenchido)
            if (currentPassword && newPassword) {
                const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
                await reauthenticateWithCredential(currentUser, credential);
                await updatePassword(currentUser, newPassword);
                toast({ title: 'Sucesso', description: 'Sua senha foi alterada.' });
                setCurrentPassword('');
                setNewPassword('');
            } else if (currentPassword || newPassword) {
                toast({ variant: 'destructive', title: 'Atenção', description: 'Para alterar a senha, preencha a senha atual e a nova senha.' });
            }

        } catch (error: any) {
            console.error("Profile Update Error: ", error);
            let description = 'Ocorreu um erro ao atualizar seu perfil.';
            if (error.code === 'auth/wrong-password') {
                description = 'A senha atual está incorreta.';
            } else if (error.code === 'auth/weak-password') {
                description = 'A nova senha é muito fraca. Use pelo menos 6 caracteres.';
            }
            toast({ variant: 'destructive', title: 'Erro na Atualização', description });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTeamMember = async (event: React.FormEvent<HTMLFormElement>) => {
        // Implementar lógica de criação de usuário no Firestore se necessário
        toast({ title: "Simulado", description: "Funcionalidade de adicionar membro não implementada."});
    };

    const handleAddTeam = async (event: React.FormEvent<HTMLFormElement>) => {
       toast({ title: "Simulado", description: "Funcionalidade de criar equipe não implementada."});
    };
    
    // Funções de Gerenciamento de Equipe (mantidas como simuladas por enquanto)
    const handleManageMembers = (team: Team) => {
        setSelectedTeam(team);
        setManageMembersDialogOpen(true);
    };

    const handleAddMemberToTeam = async (event: React.FormEvent<HTMLFormElement>) => {
        toast({ title: "Simulado", description: "Funcionalidade não implementada."});
    };
    
    const handleRemoveMemberFromTeam = async (memberId: string) => {
        toast({ title: "Simulado", description: "Funcionalidade não implementada."});
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
                     {hasPermission && <TabsTrigger value="team">Membros da Equipe</TabsTrigger>}
                     {hasPermission && <TabsTrigger value="teams">Equipes</TabsTrigger>}
                     {hasPermission && <TabsTrigger value="permissions">Permissões</TabsTrigger>}
                </TabsList>
                <TabsContent value="profile" className="space-y-6">
                    <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader>
                            <CardTitle>Meu Perfil</CardTitle>
                            <CardDescription>Atualize suas informações pessoais e senha.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" value={email} disabled />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="current-password">Senha Atual</Label>
                                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Deixe em branco para não alterar"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Deixe em branco para não alterar"/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleProfileUpdate} disabled={isSaving}>
                                {isSaving ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </CardFooter>
                    </Card>
                    <Card className="transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader>
                            <CardTitle>Meu Plano</CardTitle>
                            <CardDescription>Visualize e gerencie seu plano de assinatura.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Plano Atual: <Badge variant="success">Anual</Badge></h3>
                                        <p className="text-sm text-muted-foreground">Sua próxima cobrança de R$ 999,00 será em 15 de Julho de 2025.</p>
                                    </div>
                                    <Button variant="outline" disabled>Alterar Plano</Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Button variant="secondary" disabled>Ver Histórico de Faturamento</Button>
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
                                    <Button disabled>Adicionar Membro</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Adicionar Novo Membro</DialogTitle>
                                        <DialogDescription>Preencha os detalhes para convidar um novo membro para a equipe.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddTeamMember}>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name-member">Nome</Label>
                                                <Input id="name-member" name="name" placeholder="Nome completo" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email-member">E-mail</Label>
                                                <Input id="email-member" name="email" type="email" placeholder="email@example.com" required />
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
                                    {teamMembers.length > 0 ? (
                                        teamMembers.map((member) => (
                                            <TableRow key={member.id} className="transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1">
                                                <TableCell className="font-medium">{member.name}</TableCell>
                                                <TableCell>{member.email}</TableCell>
                                                <TableCell><Badge variant={member.role === 'Admin' || member.role === 'Imobiliária' ? 'default' : 'secondary'}>{member.role}</Badge></TableCell>
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
                                    <Button disabled>Criar Nova Equipe</Button>
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
                                    {teams.length > 0 ? (
                                        teams.map((team) => (
                                            <TableRow key={team.id} className="transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1">
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
                            <CardTitle>Gerenciador de Permissões por Perfil</CardTitle>
                            <CardDescription>
                                Controle o acesso de cada perfil aos módulos do sistema.
                                <span className="block text-xs mt-1"> (Observação: Esta interface é apenas para visualização. As permissões reais ainda são definidas no código.)</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.keys(menuConfig).map(profile => (
                                <div key={profile}>
                                    <h3 className="text-lg font-semibold mb-2">{profile}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 rounded-md border p-4">
                                        {allModules.map(module => (
                                            <div key={module.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`${profile}-${module.id}`}
                                                    checked={menuConfig[profile as UserProfile].includes(module.id)}
                                                    disabled
                                                />
                                                <Label htmlFor={`${profile}-${module.id}`} className="font-normal">
                                                    {module.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                         <CardFooter>
                            <Button disabled>Salvar Permissões</Button>
                         </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <Dialog open={isManageMembersDialogOpen} onOpenChange={setManageMembersDialogOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Membros da Equipe: {selectedTeam?.name}</DialogTitle>
                        <DialogDescription>Adicione ou remova membros desta equipe.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
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
                                            {teamMembers.map(member => <SelectItem key={member.id} value={member.id} disabled={selectedTeam?.memberIds.includes(member.id)}>{member.name}</SelectItem>)}
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
                                            {selectedTeam && getMembersForTeam(selectedTeam).length > 0 ? (
                                                getMembersForTeam(selectedTeam).map(member => (
                                                    <TableRow key={member.id} className="transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1">
                                                        <TableCell className="font-medium">{member.name}</TableCell>
                                                        <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMemberFromTeam(member.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
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
    );
}

    