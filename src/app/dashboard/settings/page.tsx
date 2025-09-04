
"use client";

import React, { useState, useEffect, useContext } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, UserPlus, Trash2, Eye, EyeOff, Search, ChevronRight, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ProfileContext } from "@/contexts/ProfileContext";
import { cn } from "@/lib/utils";
import { type UserProfile, userProfiles, menuConfig, allModules, creatableRolesByImobiliaria, creatableRolesByAdmin } from "@/lib/permissions";
import { auth, db, app } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, query, where, getDoc } from "firebase/firestore";
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, updatePassword, updateProfile, type User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
    imobiliariaId?: string;
    imobiliariaName?: string;
};

type Team = {
    id: string;
    name: string;
    memberIds: string[];
    imobiliariaId: string;
};

type PermissionsState = Record<UserProfile, string[]>;


export default function SettingsPage() {
    const { activeProfile } = useContext(ProfileContext);
    const isAdmin = activeProfile === 'Admin';
    const isImobiliariaAdmin = activeProfile === 'Imobiliária';
    const hasPermissionForTeamTabs = isAdmin || isImobiliariaAdmin;


    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<TeamMember | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isTeamDialogOpen, setTeamDialogOpen] = useState(false);
    const [isManageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
    
    // State for adding members
    const [isAddMemberOpen, setAddMemberOpen] = useState(false);
    
    // State for deleting members
    const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
    const [isDeleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [teamFilter, setTeamFilter] = useState("all");
    const [imobiliariaFilter, setImobiliariaFilter] = useState("all");
    const [openTeamId, setOpenTeamId] = useState<string | null>(null);

    const [permissions, setPermissions] = useState<PermissionsState>(menuConfig);
    
    const creatableRoles = isAdmin ? creatableRolesByAdmin : creatableRolesByImobiliaria;
    
    const imobiliarias = teamMembers.filter(m => m.role === 'Imobiliária');
    const getMemberCountForImobiliaria = (imobiliariaId: string) => {
        return teamMembers.filter(m => m.imobiliariaId === imobiliariaId).length;
    };

    const [selectedRole, setSelectedRole] = useState<string>('');


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setName(currentUser.displayName || '');
                setEmail(currentUser.email || '');

                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserData(userDocSnap.data() as TeamMember);
                }
            } else {
                setUser(null);
                setUserData(null);
            }
        });

        return () => unsubscribe();
    }, [hasPermissionForTeamTabs]);

    const fetchTeamData = async () => {
        if (!user) return;
        
        let usersQuery;
        let teamsQuery;
        
        const currentUserDoc = await getDoc(doc(db, "users", user.uid));
        const currentUserData = currentUserDoc.data();

        if (isAdmin) {
            usersQuery = query(collection(db, "users"));
            teamsQuery = query(collection(db, "teams"));
        } else if (isImobiliariaAdmin && currentUserData?.imobiliariaId) {
             usersQuery = query(collection(db, "users"), where("imobiliariaId", "==", currentUserData.imobiliariaId));
             teamsQuery = query(collection(db, "teams"), where("imobiliariaId", "==", currentUserData.imobiliariaId));
        } else {
            setTeamMembers([]);
            setTeams([]);
            return;
        }

        const usersSnapshot = await getDocs(usersQuery);
        const members = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
        
        const imobiliariasSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "Imobiliária")));
        const imobiliariasMap = new Map(imobiliariasSnapshot.docs.map(doc => [doc.id, doc.data().name]));
        imobiliariasMap.set(user.uid, "Admin (Raiz)");


         for (const member of members) {
             if (member.imobiliariaId) {
                 member.imobiliariaName = imobiliariasMap.get(member.imobiliariaId) || 'N/A';
             }
         }
        
        setTeamMembers(members);

        const teamsSnapshot = await getDocs(teamsQuery);
        setTeams(teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
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
            if (currentUser.displayName !== name) {
                await updateProfile(currentUser, { displayName: name });
                await updateDoc(doc(db, "users", currentUser.uid), { name });
                toast({ title: 'Sucesso', description: 'Seu nome foi atualizado.' });
            }

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
    
    const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) return;
        
        setIsSaving(true);

        const formData = new FormData(event.currentTarget);
        const newMemberData: { [key: string]: any } = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            name: formData.get("name") as string,
            role: formData.get("role") as string,
            imobiliariaId: formData.get("imobiliariaId") as string || undefined,
        };

        if (!newMemberData.password || newMemberData.password.trim() === '') {
            toast({ variant: 'destructive', title: 'Erro', description: 'O campo de senha é obrigatório.' });
            setIsSaving(false);
            return;
        }

        if (!newMemberData.role || newMemberData.role.trim() === '') {
            toast({ variant: 'destructive', title: 'Erro', description: 'O campo de função é obrigatório.' });
            setIsSaving(false);
            return;
        }

>>>>>>> 654b243dcb4264e802b0bb3eb57e4d4ede7a1ac6
        try {
            console.log('App Firebase:', app);
            console.log('Usuário atual:', user);
            console.log('Perfil ativo:', activeProfile);
            console.log('Dados do usuário:', userData);
            console.log('Permissões para equipes:', hasPermissionForTeamTabs);
            console.log('É admin:', isAdmin);
            
            const functions = getFunctions(app);
            console.log('Funções Firebase:', functions);
            
            // Verificar se as funções estão disponíveis
            if (!functions) {
                throw new Error('Funções Firebase não estão disponíveis');
            }
            
            const createUser = httpsCallable(functions, 'createUser');
            const result = await createUser(newMemberData) as any;

            if ((result.data as any).success) {
                if (user) await fetchTeamData();
                toast({ title: "Sucesso!", description: "Novo membro da equipe criado." });
                setTeamMemberDialogOpen(false);
                setSelectedRole(''); // Reset do campo role
            } else {
                throw new Error(result.data.error || "A função de nuvem retornou um erro.");
            }
        } catch (error: any) {
            let description = "Ocorreu um erro ao criar o usuário.";
            if (error.code === 'functions/already-exists' || error.message.includes('already-exists') || (error.details && error.details.message.includes('EMAIL_EXISTS'))) {
                description = 'Este e-mail já está em uso por outra conta.';
            } else if (error.message.includes('permission-denied')) {
                description = 'Você não tem permissão para executar esta ação.';
            }
            toast({ variant: "destructive", title: "Erro na Criação", description });
        } finally {
            console.log('Finalizando operação de adição de membro');
            setIsSaving(false);
        }
    };
    
    const handleOpenDeleteMemberDialog = (member: TeamMember) => {
        setMemberToDelete(member);
        setDeleteMemberDialogOpen(true);
    };

    const handleDeleteMember = async () => {
        if (!memberToDelete || !user) return;
        
        setIsSaving(true);
        try {
            const functions = getFunctions(app);
            const deleteUserFn = httpsCallable(functions, 'deleteUser');
            await deleteUserFn({ uid: memberToDelete.id });

            toast({ title: "Sucesso", description: `O usuário ${memberToDelete.name} foi removido.` });
            await fetchTeamData();
            setDeleteMemberDialogOpen(false);
            setMemberToDelete(null);

        } catch (error: any) {
            console.error("Error deleting user: ", error);
            const defaultMessage = "Não foi possível remover o membro.";
            const message = error.details?.message || defaultMessage;
            toast({ variant: "destructive", title: "Erro", description: message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTeam = async (event: React.FormEvent<HTMLFormElement>) => {
       event.preventDefault();
       
       setIsSaving(true);
       const formData = new FormData(event.currentTarget);
       const teamName = formData.get("team-name") as string;
       
       let imobiliariaIdForTeam = userData?.imobiliariaId;

       if (isAdmin) {
           imobiliariaIdForTeam = formData.get("imobiliariaId") as string;
           if (!imobiliariaIdForTeam) {
               toast({ variant: "destructive", title: "Erro", description: "Selecione uma imobiliária para criar a equipe." });
               setIsSaving(false);
               return;
           }
       }

       if (!imobiliariaIdForTeam) {
            toast({ variant: "destructive", title: "Erro", description: "ID da imobiliária não encontrado para criar a equipe." });
            setIsSaving(false);
            return;
       }
       
       try {
            await addDoc(collection(db, "teams"), {
                name: teamName,
                memberIds: [],
                imobiliariaId: imobiliariaIdForTeam
            });
            if(user) await fetchTeamData();
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

    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    const handleAddMemberToTeam = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedTeam) return;

        const formData = new FormData(event.currentTarget);
        const memberId = formData.get('memberId') as string;

        setIsSaving(true);
        try {
            const teamRef = doc(db, 'teams', selectedTeam.id);
            await updateDoc(teamRef, { memberIds: arrayUnion(memberId) });
            
            const updatedTeamDoc = await getDoc(teamRef);
            if (updatedTeamDoc.exists()) {
                const updatedTeamData = { ...updatedTeamDoc.data(), id: updatedTeamDoc.id } as Team;
                setSelectedTeam(updatedTeamData);
                // Update the main teams list
                setTeams(currentTeams => 
                    currentTeams.map(t => t.id === updatedTeamData.id ? updatedTeamData : t)
                );
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
            await updateDoc(teamRef, { memberIds: arrayRemove(memberId) });
            
             const updatedTeamDoc = await getDoc(teamRef);
             if (updatedTeamDoc.exists()) {
                 const updatedTeamData = { ...updatedTeamDoc.data(), id: updatedTeamDoc.id } as Team;
                 setSelectedTeam(updatedTeamData);
                 setTeams(currentTeams => 
                    currentTeams.map(t => t.id === updatedTeamData.id ? updatedTeamData : t)
                );
             } else {
                 setManageMembersDialogOpen(false);
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
                if (user) await fetchTeamData();
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
        console.log("Salvando permissões:", permissions);
        setTimeout(() => {
            toast({ title: "Permissões Salvas", description: "As novas regras de permissão foram salvas com sucesso (simulado)." });
            setIsSaving(false);
        }, 1000);
    };

    const handleChangeUserRole = async (memberId: string, newRole: UserProfile) => {
        if (!user) return;
        
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

    const filteredMembers = teamMembers.filter(member => {
        if (member.role === 'Imobiliária' || member.role === 'Admin') {
            return false; // Exclui imobiliárias e Admins da aba Membros
        }

        const searchLower = searchQuery.toLowerCase();
        const nameMatch = member.name.toLowerCase().includes(searchLower);
        const emailMatch = member.email.toLowerCase().includes(searchLower);
        
        const teamMatch = teamFilter === 'all' || findTeamForMember(member.id) === teamFilter;
        
        const imobiliariaMatch = imobiliariaFilter === 'all' || member.imobiliariaId === imobiliariaFilter;

        return (nameMatch || emailMatch) && teamMatch && imobiliariaMatch;
    });


    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie sua conta, equipes e permissões do aplicativo.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList>
                    <TabsTrigger value="profile">Perfil</TabsTrigger>
                     {isAdmin && <TabsTrigger value="imobiliarias">Imobiliárias</TabsTrigger>}
                     {hasPermissionForTeamTabs && <TabsTrigger value="team">Membros</TabsTrigger>}
                     {hasPermissionForTeamTabs && <TabsTrigger value="teams">Equipes</TabsTrigger>}
                     {hasPermissionForTeamTabs && <TabsTrigger value="permissions">Permissões</TabsTrigger>}
                </TabsList>
                <TabsContent value="profile" className="space-y-6">
                    <Card>
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
                {isAdmin && (
                    <TabsContent value="imobiliarias">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Gestão de Imobiliárias</CardTitle>
                                    <CardDescription>Gerencie as agências que têm acesso à plataforma. Novas imobiliárias devem se cadastrar pela tela de registro.</CardDescription>
                                </div>
                            </CardHeader>
                             <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome da Imobiliária</TableHead>
                                            <TableHead>E-mail do Admin</TableHead>
                                            <TableHead>Membros</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {imobiliarias.length > 0 ? (
                                            imobiliarias.map((imob) => (
                                                <TableRow key={imob.id}>
                                                    <TableCell className="font-medium">{imob.name}</TableCell>
                                                    <TableCell>{imob.email}</TableCell>
                                                    <TableCell>{getMemberCountForImobiliaria(imob.id)}</TableCell>
                                                    <TableCell className="text-right">
                                                         <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button size="icon" variant="ghost"><MoreHorizontal /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive">Suspender</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhuma imobiliária cadastrada.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
                {hasPermissionForTeamTabs && (
                    <TabsContent value="team">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Membros da Equipe</CardTitle>
                                    <CardDescription>Gerencie sua equipe e suas funções.</CardDescription>
                                </div>
                                <Dialog open={isAddMemberOpen} onOpenChange={setAddMemberOpen}>
                                    <DialogTrigger asChild>
                                        <Button><UserPlus className="mr-2 h-4 w-4"/>Adicionar Membro</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Novo Membro</DialogTitle>
                                            <DialogDescription>Preencha os dados para criar um novo usuário.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateUser}>
                                            <div className="grid gap-4 py-4">
                                                {isAdmin && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="imobiliariaId-member">Imobiliária</Label>
                                                        <Select name="imobiliariaId">
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Associar a uma imobiliária (opcional)" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="admin">Nenhuma (Vincular ao Admin)</SelectItem>
                                                                {imobiliarias.map(imob => (
                                                                    <SelectItem key={imob.id} value={imob.id}>{imob.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" name="email" type="email" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="password">Senha</Label>
                                                    <Input id="password" name="password" type="password" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="role">Função</Label>
                                                    <Select value={selectedRole} onValueChange={setSelectedRole} required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione uma função" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {creatableRoles.map(role => (
                                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {isAdmin && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="imobiliariaId">Vincular à Imobiliária</Label>
                                                        <Select name="imobiliariaId" required>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione uma imobiliária" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value={user?.uid || ''}>Nenhuma (Vincular ao Admin)</SelectItem>
                                                                {imobiliarias.map(imob => (
                                                                    <SelectItem key={imob.id} value={imob.id}>{imob.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setAddMemberOpen(false)}>Cancelar</Button>
                                                <Button type="submit" disabled={isSaving}>
                                                    {isSaving ? "Criando..." : "Criar Usuário"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                 <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Buscar por nome ou e-mail..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                     {isAdmin && (
                                        <Select value={imobiliariaFilter} onValueChange={setImobiliariaFilter}>
                                            <SelectTrigger className="w-full md:w-[200px]">
                                                <SelectValue placeholder="Filtrar por imobiliária" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas as Imobiliárias</SelectItem>
                                                 {imobiliarias.map(imob => (
                                                    <SelectItem key={imob.id} value={imob.id}>{imob.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <Select value={teamFilter} onValueChange={setTeamFilter}>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Filtrar por equipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Equipes</SelectItem>
                                            <SelectItem value="Sem Equipe">Sem Equipe</SelectItem>
                                            {teams.map((team) => (
                                                <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>E-mail</TableHead>
                                            {isAdmin && <TableHead>Imobiliária</TableHead>}
                                            <TableHead>Equipe</TableHead>
                                            <TableHead>Função</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMembers.length > 0 ? (
                                            filteredMembers.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell className="font-medium">{member.name}</TableCell>
                                                    <TableCell>{member.email}</TableCell>
                                                    {isAdmin && <TableCell className="text-xs text-muted-foreground">{member.imobiliariaName || 'N/A'}</TableCell>}
                                                    <TableCell>{findTeamForMember(member.id)}</TableCell>
                                                    <TableCell><Badge variant={member.role === 'Imobiliária' || member.role === 'Admin' ? 'default' : 'secondary'}>{member.role}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button size="icon" variant="ghost"><MoreHorizontal /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                <DropdownMenuSub>
                                                                    <DropdownMenuSubTrigger disabled={member.role === 'Admin' || member.id === user?.uid}>Alterar Função</DropdownMenuSubTrigger>
                                                                    <DropdownMenuSubContent>
                                                                        {creatableRoles.map(role => (
                                                                            <DropdownMenuItem 
                                                                                key={role} 
                                                                                onSelect={() => handleChangeUserRole(member.id, role as UserProfile)}
                                                                                disabled={isSaving}
                                                                            >
                                                                                {role}
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </DropdownMenuSubContent>
                                                                </DropdownMenuSub>
                                                                <DropdownMenuItem 
                                                                    className="text-destructive" 
                                                                    disabled={member.role === 'Admin' || member.id === user?.uid}
                                                                    onSelect={() => handleOpenDeleteMemberDialog(member)}
                                                                >
                                                                    Remover
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center h-24">Nenhum membro encontrado.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
                {hasPermissionForTeamTabs && (
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
                                                 {isAdmin && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="imobiliariaId">Vincular à Imobiliária</Label>
                                                        <Select name="imobiliariaId" required>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione uma imobiliária" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {imobiliarias.map(imob => <SelectItem key={imob.id} value={imob.id}>{imob.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
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
                                               <React.Fragment key={team.id}>
                                                    <TableRow>
                                                        <TableCell className="font-medium">
                                                            <button className="flex items-center gap-2 w-full text-left" onClick={() => setOpenTeamId(openTeamId === team.id ? null : team.id)}>
                                                                <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", openTeamId === team.id && "rotate-90")} />
                                                                {team.name}
                                                            </button>
                                                        </TableCell>
                                                        <TableCell>{team.memberIds.length}</TableCell>
                                                        <TableCell className="text-right">
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
                                                    {openTeamId === team.id && (
                                                         <tr className="bg-muted/50">
                                                            <td colSpan={3} className="p-0">
                                                                <div className="p-4">
                                                                    {getMembersForTeam(team).length > 0 ? (
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow>
                                                                                    <TableHead>Nome</TableHead>
                                                                                    <TableHead>E-mail</TableHead>
                                                                                    <TableHead>Função</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {getMembersForTeam(team).map(member => (
                                                                                    <TableRow key={member.id}>
                                                                                        <TableCell>{member.name}</TableCell>
                                                                                        <TableCell>{member.email}</TableCell>
                                                                                        <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    ) : (
                                                                        <p className="text-center text-sm text-muted-foreground py-4">Nenhum membro nesta equipe.</p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                               </React.Fragment>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhuma equipe encontrada.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
                {hasPermissionForTeamTabs && (
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
                                                    <Label htmlFor={`${profile}-${module.id}`} className={cn("font-normal", (profile === 'Admin') && "text-muted-foreground")}>
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
                )}
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
                                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um membro para adicionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teamMembers
                                                    .filter(member => member.imobiliariaId === selectedTeam.imobiliariaId)
                                                    .map(member => <SelectItem key={member.id} value={member.id} disabled={selectedTeam.memberIds.includes(member.id)}>{member.name}</SelectItem>)}
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

            <AlertDialog open={isDeleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá permanentemente o usuário <span className="font-bold">{memberToDelete?.name}</span> do sistema.
                            Isso não pode ser desfeito.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(buttonVariants({ variant: "destructive" }))}
                            onClick={handleDeleteMember}
                            disabled={isSaving}
                        >
                            {isSaving ? "Removendo..." : "Sim, Remover Membro"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

