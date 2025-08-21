

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
import { MoreHorizontal, UserPlus, Trash2, Eye, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ProfileContext } from "@/contexts/ProfileContext";
import { cn } from "@/lib/utils";
import { type UserProfile, userProfiles, menuConfig, allModules } from "@/lib/permissions";
import { auth, db, app } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, updatePassword, updateProfile, type User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";


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

type PermissionsState = Record<UserProfile, string[]>;

const roles = userProfiles.filter(p => ['Admin', 'Imobiliária', 'Vendedor', 'Financeiro', 'Corretor Autônomo', 'Investidor', 'Construtora'].includes(p));


export default function SettingsPage() {
    const { activeProfile } = useContext(ProfileContext);
    const hasPermission = activeProfile === 'Admin' || activeProfile === 'Imobiliária';

    // Estados da UI
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Estados do Perfil
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Estados das Equipes
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isTeamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false);
    const [isTeamDialogOpen, setTeamDialogOpen] = useState(false);
    const [isManageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);

    // Estado das Permissões
    const [permissions, setPermissions] = useState<PermissionsState>(menuConfig);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setName(currentUser.displayName || '');
                setEmail(currentUser.email || '');
            } else {
                setUser(null);
            }
        });

        if (hasPermission) {
            fetchTeamData();
        }

        return () => unsubscribe();
    }, [hasPermission]);

    const fetchTeamData = async () => {
        if (hasPermission) {
            const usersSnapshot = await getDocs(collection(db, "users"));
            setTeamMembers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember)));

            const teamsSnapshot = await getDocs(collection(db, "teams"));
            setTeams(teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
        }
    };


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
        event.preventDefault();
        setIsSaving(true);

        const formData = new FormData(event.currentTarget);
        const newMemberData = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            name: formData.get("name") as string,
            role: formData.get("role") as string,
        };

        if (!newMemberData.password) {
            toast({ variant: 'destructive', title: 'Erro', description: 'O campo de senha é obrigatório.' });
            setIsSaving(false);
            return;
        }

        try {
            const functions = getFunctions(app);
            const createUser = httpsCallable(functions, 'createUser');
            const result = await createUser(newMemberData) as any;

            if (result.data.success) {
                await fetchTeamData();
                toast({ title: "Sucesso!", description: "Novo membro da equipe criado." });
                setTeamMemberDialogOpen(false);
            } else {
                throw new Error(result.data.error || "A função de nuvem retornou um erro.");
            }
        } catch (error: any) {
            console.error("Error creating user:", error);
            let description = "Ocorreu um erro ao criar o usuário.";
            if (error.message.includes('auth/email-already-exists') || (error.details && error.details.message.includes('EMAIL_EXISTS'))) {
                description = 'Este e-mail já está em uso por outra conta.';
            } else if (error.message.includes('auth/weak-password')) {
                description = 'A senha fornecida é muito fraca. Use pelo menos 6 caracteres.';
            } else if (error.message.includes('permission-denied')) {
                description = 'Você não tem permissão para executar esta ação.';
            }
            toast({ variant: "destructive", title: "Erro na Criação", description });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTeam = async (event: React.FormEvent<HTMLFormElement>) => {
       event.preventDefault();
       setIsSaving(true);
       const formData = new FormData(event.currentTarget);
       const teamName = formData.get("team-name") as string;
       
       try {
            await addDoc(collection(db, "teams"), {
                name: teamName,
                memberIds: []
            });
            await fetchTeamData();
            toast({ title: "Sucesso!", description: `A equipe "${teamName}" foi criada.`});
            setTeamDialogOpen(false);
       } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar a equipe." });
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

        const formData = new FormData(event.currentTarget);
        const memberId = formData.get('memberId') as string;

        setIsSaving(true);
        try {
            const teamRef = doc(db, 'teams', selectedTeam.id);
            await updateDoc(teamRef, {
                memberIds: arrayUnion(memberId)
            });
            await fetchTeamData(); // Refresh all data
            // Refresh selectedTeam state
            const updatedTeams = await getDocs(collection(db, "teams"));
            const updatedTeam = updatedTeams.docs.find(d => d.id === selectedTeam.id)?.data() as Team;
            if(updatedTeam) {
                 setSelectedTeam({ ...updatedTeam, id: selectedTeam.id });
            }
           
            toast({ title: "Sucesso!", description: "Membro adicionado à equipe." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o membro." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleRemoveMemberFromTeam = async (memberId: string) => {
        if (!selectedTeam) return;
        
        setIsSaving(true);
         try {
            const teamRef = doc(db, 'teams', selectedTeam.id);
            await updateDoc(teamRef, {
                memberIds: arrayRemove(memberId)
            });
            await fetchTeamData(); // Refresh all data
            // Refresh selectedTeam state
             const updatedTeams = await getDocs(collection(db, "teams"));
             const updatedTeamDoc = updatedTeams.docs.find(d => d.id === selectedTeam.id);
             if (updatedTeamDoc) {
                 const updatedTeamData = updatedTeamDoc.data() as Omit<Team, 'id'>;
                 setSelectedTeam({ ...updatedTeamData, id: selectedTeam.id });
             } else {
                 setManageMembersDialogOpen(false); // Team was deleted, close modal
             }

            toast({ title: "Sucesso!", description: "Membro removido da equipe." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o membro." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const getMembersForTeam = (team: Team) => {
        return teamMembers.filter(member => team.memberIds.includes(member.id));
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.")) {
            try {
                await deleteDoc(doc(db, "teams", teamId));
                await fetchTeamData();
                toast({ title: "Sucesso", description: "Equipe excluída." });
            } catch (error) {
                toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a equipe." });
            }
        }
    };
    
    const handlePermissionChange = (profile: UserProfile, moduleId: string, checked: boolean) => {
        setPermissions(prev => {
            const currentPermissions = prev[profile] || [];
            const newPermissions = checked
                ? [...currentPermissions, moduleId]
                : currentPermissions.filter(id => id !== moduleId);
            return { ...prev, [profile]: newPermissions };
        });
    };

    const handleSavePermissions = () => {
        setIsSaving(true);
        // Simulação de salvamento no Firestore.
        // Em um projeto real, você faria um loop e salvaria `permissions`
        // em um documento de configuração no Firestore.
        console.log("Salvando permissões:", permissions);
        setTimeout(() => {
            toast({ title: "Permissões Salvas", description: "As novas regras de permissão foram salvas com sucesso (simulado)." });
            setIsSaving(false);
        }, 1000);
    };

    const handleChangeUserRole = async (memberId: string, newRole: UserProfile) => {
        setIsSaving(true);
        try {
            const userRef = doc(db, 'users', memberId);
            await updateDoc(userRef, { role: newRole });
            await fetchTeamData();
            toast({ title: "Sucesso", description: `Função do usuário alterada para ${newRole}.` });
        } catch (error) {
             toast({ variant: "destructive", title: "Erro", description: "Não foi possível alterar a função do usuário." });
        } finally {
            setIsSaving(false);
        }
    };

    const findTeamForMember = (memberId: string) => {
        const team = teams.find(t => t.memberIds.includes(memberId));
        return team ? team.name : 'Sem Equipe';
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
                     {hasPermission && <TabsTrigger value="team">Membros</TabsTrigger>}
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
                                <div className="relative">
                                    <Input 
                                        id="current-password" 
                                        type={showCurrentPassword ? "text" : "password"} 
                                        value={currentPassword} 
                                        onChange={(e) => setCurrentPassword(e.target.value)} 
                                        placeholder="Deixe em branco para não alterar"
                                    />
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                      onClick={() => setShowCurrentPassword(prev => !prev)}
                                    >
                                      {showCurrentPassword ? <EyeOff /> : <Eye />}
                                      <span className="sr-only">{showCurrentPassword ? "Ocultar senha" : "Mostrar senha"}</span>
                                    </Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <div className="relative">
                                    <Input 
                                        id="new-password" 
                                        type={showNewPassword ? "text" : "password"} 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        placeholder="Deixe em branco para não alterar"
                                    />
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                      onClick={() => setShowNewPassword(prev => !prev)}
                                    >
                                      {showNewPassword ? <EyeOff /> : <Eye />}
                                      <span className="sr-only">{showNewPassword ? "Ocultar senha" : "Mostrar senha"}</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleProfileUpdate} disabled={isSaving}>
                                {isSaving ? "Salvando..." : "Salvar Alterações"}
                            </Button>
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
                                                <Label htmlFor="name-member">Nome</Label>
                                                <Input id="name-member" name="name" placeholder="Nome completo" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email-member">E-mail</Label>
                                                <Input id="email-member" name="email" type="email" placeholder="email@example.com" required />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="password-member">Senha</Label>
                                                <Input id="password-member" name="password" type="password" placeholder="••••••••" required />
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
                                        <TableHead>Equipe</TableHead>
                                        <TableHead>Função</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamMembers.length > 0 ? (
                                        teamMembers.map((member) => (
                                            <TableRow key={member.id} className="transition-all duration-200 cursor-pointer hover:bg-secondary hover:shadow-md hover:-translate-y-1">
                                                <TableCell className="font-medium">{member.name}</TableCell>
                                                <TableCell>{member.email}</TableCell>
                                                <TableCell>{findTeamForMember(member.id)}</TableCell>
                                                <TableCell><Badge variant={member.role === 'Admin' || member.role === 'Imobiliária' ? 'default' : 'secondary'}>{member.role}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="icon" variant="ghost"><MoreHorizontal /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger>Alterar Função</DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent>
                                                                    {userProfiles.map(role => (
                                                                        <DropdownMenuItem 
                                                                            key={role} 
                                                                            onClick={() => handleChangeUserRole(member.id, role)}
                                                                            disabled={isSaving}
                                                                        >
                                                                            {role}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>
                                                            <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum membro encontrado.</TableCell></TableRow>
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
                                                            <DropdownMenuItem disabled>Renomear</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTeam(team.id)}>Excluir</DropdownMenuItem>
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
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.entries(permissions).map(([profile, profilePermissions]) => (
                                <div key={profile}>
                                    <h3 className="text-lg font-semibold mb-2">{profile}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 rounded-md border p-4">
                                        {allModules.map(module => (
                                            <div key={module.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`${profile}-${module.id}`}
                                                    checked={profilePermissions.includes(module.id)}
                                                    onCheckedChange={(checked) => handlePermissionChange(profile as UserProfile, module.id, !!checked)}
                                                    disabled={profile === 'Admin'}
                                                />
                                                <Label htmlFor={`${profile}-${module.id}`} className={cn("font-normal", profile === 'Admin' && "text-muted-foreground")}>
                                                    {module.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                         <CardFooter>
                            <Button onClick={handleSavePermissions} disabled={isSaving}>
                                {isSaving ? "Salvando..." : "Salvar Permissões"}
                            </Button>
                         </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <Dialog open={isManageMembersDialogOpen} onOpenChange={(isOpen) => {
                if(!isOpen) setSelectedTeam(null);
                setManageMembersDialogOpen(isOpen);
            }}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Membros da Equipe: {selectedTeam?.name}</DialogTitle>
                        <DialogDescription>Adicione ou remova membros desta equipe.</DialogDescription>
                    </DialogHeader>
                    {selectedTeam && (
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
                                                {teamMembers.map(member => <SelectItem key={member.id} value={member.id} disabled={selectedTeam.memberIds.includes(member.id)}>{member.name}</SelectItem>)}
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
                                                {getMembersForTeam(selectedTeam).length > 0 ? (
                                                    getMembersForTeam(selectedTeam).map(member => (
                                                        <TableRow key={member.id}>
                                                            <TableCell className="font-medium">{member.name}</TableCell>
                                                            <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMemberFromTeam(member.id)} disabled={isSaving}>
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
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
