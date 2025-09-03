
"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Search, Archive, Trash2, Landmark, Upload, Eye, X, FileText, Link as LinkIcon, Send, GripVertical, Target, Handshake, Building2, UserPlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getNegotiations, addNegotiation, type Negotiation, addFinancingProcess, completeSaleAndGenerateCommission, getProperties, type Property, updateNegotiation, getUsers, type User, archiveNegotiation, addServiceRequest, markAsDeleted, getProcessos, type Processo, ServiceRequestType, type NegotiationStage, getActivitiesForRealtor, updateActivityStatus, Activity, ActivityStatus } from "@/lib/data";
import { getClients, type Client } from "@/lib/crm-data";
import { cn } from "@/lib/utils";
import { ProfileContext } from "@/contexts/ProfileContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { AssignNegotiationDialog } from "@/components/dashboard/assign-negotiation-dialog";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddPropertyDialog } from "@/components/dashboard/add-property-dialog";
import { AddClientDialog } from "@/components/dashboard/add-client-dialog";


const formatCurrency = (value: number) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const KANBAN_COLUMNS: NegotiationStage[] = ['Proposta Enviada', 'Em Negociação', 'Contrato Gerado', 'Venda Concluída', 'Aluguel Ativo'];


const statusConfig: { [key in ActivityStatus]: { title: string; borderColor: string; bgColor: string; textColor: string; } } = {
    'Ativo': { title: 'ATIVO', borderColor: 'border-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-800/50', textColor: 'text-blue-600 dark:text-blue-400' },
    'Pendente': { title: 'PENDENTE', borderColor: 'border-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-800/50', textColor: 'text-orange-600 dark:text-orange-400' },
    'Concluído': { title: 'CONCLUÍDO', borderColor: 'border-green-600', bgColor: 'bg-green-100 dark:bg-green-800/50', textColor: 'text-green-700 dark:text-green-500' },
    'Cancelado': { title: 'CANCELADO', borderColor: 'border-red-600', bgColor: 'bg-red-100 dark:bg-red-800/50', textColor: 'text-red-700 dark:text-red-500' },
};


const ActivityCard = ({ activity, onDragStart }: { activity: Activity, onDragStart: (e: React.DragEvent<HTMLDivElement>, activityId: string) => void }) => {
    const isCapture = activity.type === 'capture';
    const Icon = isCapture ? Target : Handshake;
    const iconBg = isCapture ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground';
    
    return (
      <Card 
        className="mb-3 cursor-grab active:cursor-grabbing transition-shadow duration-200 hover:shadow-lg bg-card"
        draggable="true"
        onDragStart={(e) => onDragStart(e, activity.id)}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs", iconBg)}>
                      <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                      <p className="font-bold text-sm text-foreground" title={activity.name}>
                        {activity.name}
                      </p>
                      <span className="text-xs text-muted-foreground font-mono">ID: {activity.relatedId.substring(0, 8)}...</span>
                  </div>
              </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-3">
            <Badge variant="outline">{isCapture ? 'Captação' : 'Negociação'}</Badge>
            <span className={'font-semibold text-sm text-foreground'}>
                {formatCurrency(activity.value)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
};


const ActivityColumn = ({ 
  status, 
  activities, 
  onDrop,
  onDragOver,
  onDragStart,
}: { 
  status: ActivityStatus; 
  activities: Activity[];
  onDrop: (e: React.DragEvent<HTMLDivElement>, newStatus: ActivityStatus) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, activityId: string) => void;
}) => {
  const config = statusConfig[status];
  const totalValue = activities.reduce((acc, q) => acc + q.value, 0);

  return (
    <div 
      className={cn("flex-1 min-w-[280px] rounded-lg", config.bgColor)}
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
    >
      <div className={cn('flex justify-between items-center p-3 rounded-t-lg border-t-4', config.borderColor)}>
        <h2 className={cn("font-bold text-sm uppercase tracking-wider", config.textColor)}>{`${config.title} (${activities.length})`}</h2>
        <span className={cn("font-semibold text-sm", config.textColor)}>
            {formatCurrency(totalValue)}
        </span>
      </div>
      <div className="p-2 h-full overflow-y-auto">
        {activities.length > 0 ? (
          activities.map(activity => <ActivityCard key={activity.id} activity={activity} onDragStart={onDragStart} />)
        ) : (
          <div className="flex justify-center items-center h-24 text-sm text-muted-foreground/70">
            Arraste os cards para cá
          </div>
        )}
      </div>
    </div>
  );
};

const RealtorKanban = ({ users }: { users: User[] }) => {
    const [selectedRealtorId, setSelectedRealtorId] = useState<string>('');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const brokerUsers = useMemo(() => {
        const brokerRoles = ['Corretor Autônomo', 'Vendedor', 'Imobiliária', 'Admin'];
        return users.filter(user => brokerRoles.includes(user.role));
    }, [users]);
    
    useEffect(() => {
        if (selectedRealtorId) {
            const fetchActivities = async () => {
                setIsLoading(true);
                try {
                    const fetchedActivities = await getActivitiesForRealtor(selectedRealtorId);
                    setActivities(fetchedActivities);
                } catch (error) {
                    toast({ variant: 'destructive', title: "Erro", description: "Não foi possível carregar as atividades do corretor." });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchActivities();
        } else {
            setActivities([]);
        }
    }, [selectedRealtorId, toast]);
    
    const activitiesByStatus = useMemo(() => {
        const grouped: { [key in ActivityStatus]: Activity[] } = {
            'Ativo': [], 'Pendente': [], 'Concluído': [], 'Cancelado': []
        };
        activities.forEach(activity => {
            if (grouped[activity.status]) {
                grouped[activity.status].push(activity);
            }
        });
        return grouped;
    }, [activities]);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, activityId: string) => {
        e.dataTransfer.setData("activityId", activityId);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const onDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: ActivityStatus) => {
        e.preventDefault();
        const activityId = e.dataTransfer.getData("activityId");
        if (!activityId) return;

        const originalActivities = [...activities];

        setActivities(prevActivities =>
            prevActivities.map(act =>
                act.id === activityId ? { ...act, status: newStatus } : act
            )
        );
        
        try {
            await updateActivityStatus(activityId, newStatus);
            toast({
                title: "Status Atualizado!",
                description: `Atividade movida para "${newStatus}".`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao salvar",
                description: "A alteração não pôde ser salva. Revertendo.",
            });
            setActivities(originalActivities);
        }
    };
    
    return (
        <div className="flex flex-col gap-4">
             <div className="max-w-xs">
                <Label>Selecione um Corretor</Label>
                <Select value={selectedRealtorId} onValueChange={setSelectedRealtorId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {brokerUsers.map(user => (
                             <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {isLoading ? (
                <div className="flex gap-4">
                     <Skeleton className="h-[60vh] w-full" />
                     <Skeleton className="h-[60vh] w-full" />
                     <Skeleton className="h-[60vh] w-full" />
                     <Skeleton className="h-[60vh] w-full" />
                </div>
            ) : selectedRealtorId ? (
                 <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
                    {Object.keys(statusConfig).map(statusKey => (
                        <ActivityColumn 
                            key={statusKey} 
                            status={statusKey as ActivityStatus} 
                            activities={activitiesByStatus[statusKey as ActivityStatus] || []}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onDragStart={onDragStart}
                        />
                    ))}
                </div>
            ) : (
                <Card className="flex items-center justify-center h-60">
                    <p className="text-muted-foreground">Selecione um corretor para ver suas atividades.</p>
                </Card>
            )}
        </div>
    )
}


export default function NegotiationsPage() {
    const router = useRouter();
    const { activeProfile } = useContext(ProfileContext);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [allNegotiations, setAllNegotiations] = useState<Negotiation[]>([]);
    const [allProcesses, setAllProcesses] = useState<Processo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewNegotiationOpen, setNewNegotiationOpen] = useState(false);
    const { toast } = useToast();
    
    // Estados dos filtros
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [realtorFilter, setRealtorFilter] = useState('all');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [allUsers, setAllUsers] = useState<User[]>([]); // Para os filtros e diálogos

    const [propertyCode, setPropertyCode] = useState("");
    const [clientCode, setClientCode] = useState("");
    const [isFinanced, setIsFinanced] = useState(false);
    const [foundProperty, setFoundProperty] = useState<Property | null>(null);
    const [foundClient, setFoundClient] = useState<Client | null>(null);
    const [proposalValue, setProposalValue] = useState("");
    const [proposalDate, setProposalDate] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    
    // Dados para os selects, carregados uma vez
    const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
    const [availableClients, setAvailableClients] = useState<Client[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);

    // Estados para os diálogos
    const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
    const [isServiceRequestOpen, setServiceRequestOpen] = useState(false);
    const [serviceRequestType, setServiceRequestType] = useState<ServiceRequestType>('credit_approval');
    const [clientForRequest, setClientForRequest] = useState<Client | null>(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user as any);
        });
        return () => unsubscribe();
    }, []);

    const fetchData = async () => {
         const [props, clients, users, negs, procs] = await Promise.all([
            getProperties(),
            getClients(),
            getUsers(),
            getNegotiations(), 
            getProcessos(),
        ]);
        setAvailableProperties(props.filter(p => p.status === 'Disponível'));
        setAvailableClients(clients);
        setAllUsers(users);
        setAllNegotiations(negs);
        setAllProcesses(procs);
    };

    useEffect(() => {
        if (currentUser !== undefined) {
            refreshData();
        }
    }, [currentUser]);
    
    const refreshData = async () => {
        setIsLoading(true);
        try {
            await fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao buscar dados" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const filteredNegotiations = useMemo(() => {
        let negotiations = allNegotiations.filter(neg => !neg.isArchived && !neg.isDeleted);

        if (currentUser && activeProfile !== 'Admin' && activeProfile !== 'Imobiliária') {
            negotiations = negotiations.filter(neg => 
                neg.realtorId === currentUser.uid || 
                neg.salespersonId === currentUser.uid || 
                neg.clientId === currentUser.uid
            );
        }
        
        if (activeProfile === 'Admin' || activeProfile === 'Imobiliária') {
            if (typeFilter !== 'all') {
                negotiations = negotiations.filter(neg => neg.type.toLowerCase() === typeFilter);
            }
            if (statusFilter !== 'all') {
                negotiations = negotiations.filter(neg => neg.contractStatus.replace(/\s/g, '-').toLowerCase() === statusFilter);
            }
            if (realtorFilter !== 'all') {
                const selectedUser = allUsers.find(u => u.id === realtorFilter);
                if (selectedUser) {
                    negotiations = negotiations.filter(neg => neg.realtorId === selectedUser.id || neg.salespersonId === selectedUser.id);
                }
            }
        }

        if (startDate || endDate) {
            const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
            const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

            negotiations = negotiations.filter(neg => {
                const negDate = new Date(neg.createdAt);
                if (start && end) return negDate >= start && negDate <= end;
                if (start) return negDate >= start;
                if (end) return negDate <= end;
                return true;
            });
        }
        
        return negotiations;
    }, [allNegotiations, typeFilter, statusFilter, realtorFilter, activeProfile, currentUser, allUsers, startDate, endDate]);

    const negotiationsByStage = useMemo(() => {
        const grouped: { [key in NegotiationStage]: Negotiation[] } = {
            'Proposta Enviada': [],
            'Em Negociação': [],
            'Contrato Gerado': [],
            'Venda Concluída': [],
            'Aluguel Ativo': [],
        };
        filteredNegotiations.forEach(neg => {
            if (grouped[neg.stage]) {
                grouped[neg.stage].push(neg);
            }
        });
        return grouped;
    }, [filteredNegotiations]);
    
    const brokerUsers = useMemo(() => {
        const brokerRoles = ['Corretor Autônomo', 'Vendedor', 'Imobiliária', 'Admin'];
        return allUsers.filter(user => brokerRoles.includes(user.role));
    }, [allUsers]);


    const resetForm = () => {
        setPropertyCode("");
        setClientCode("");
        setFoundProperty(null);
        setFoundClient(null);
        setProposalValue("");
        setProposalDate("");
        setIsFinanced(false);
        setSelectedDocs([]);
    };
    
    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            setSelectedDocs(prevDocs => [...prevDocs, ...newFiles]);
        }
    };

    const clearSelectedFiles = () => {
        setSelectedDocs([]);
        const input = document.getElementById('documents') as HTMLInputElement;
        if (input) {
            input.value = '';
        }
    };


    useEffect(() => {
        if (!isNewNegotiationOpen) {
            resetForm();
        }
    }, [isNewNegotiationOpen]);
    
    useEffect(() => {
        if (propertyCode) {
             const prop = availableProperties.find(p => p.id === propertyCode);
             if (prop) {
                setFoundProperty(prop);
                setProposalValue(prop.price.toString());
             } else {
                setFoundProperty(null);
             }
        } else {
            setFoundProperty(null);
            setProposalValue("");
        }
    }, [propertyCode, availableProperties]);

    useEffect(() => {
        if (clientCode) {
            const cli = availableClients.find(c => c.id === clientCode);
            setFoundClient(cli || null);
        } else {
            setFoundClient(null);
        }
    }, [clientCode, availableClients]);


    const handleAddNegotiation = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!foundProperty || !foundClient || !currentUser) {
            toast({ variant: 'destructive', title: "Erro", description: "Busque e confirme os dados do imóvel, do cliente e esteja logado." });
            return;
        }
        
        const formData = new FormData(event.currentTarget);
        const responsibleSalespersonId = formData.get('salespersonId') as string || currentUser.uid;
        const responsibleSalesperson = allUsers.find(u => u.id === responsibleSalespersonId);

        const newNegotiationData: Omit<Negotiation, 'id' | 'negotiationDisplayCode'> = {
            property: foundProperty.name,
            propertyId: foundProperty.id,
            propertyDisplayCode: foundProperty.displayCode,
            propertyType: foundProperty.type,
            client: foundClient.name,
            clientId: foundClient.id,
            stage: "Proposta Enviada",
            type: 'Venda',
            contractStatus: "Não Gerado",
            value: Number(proposalValue),
            salesperson: responsibleSalesperson?.name || "N/A",
            salespersonId: responsibleSalespersonId,
            realtor: foundProperty.capturedBy,
            realtorId: foundProperty.capturedById,
            completionDate: null,
            createdAt: new Date().toISOString(),
            isFinanced: isFinanced,
            isArchived: false,
            isDeleted: false,
        };
        
        const newNegotiationId = await addNegotiation(newNegotiationData, selectedDocs);
        
        if (isFinanced) {
            toast({ 
                title: "Sucesso!", 
                description: "Nova negociação iniciada. Acione o correspondente no menu de ações para criar o processo de financiamento." 
            });
        } else {
            toast({ title: "Sucesso!", description: "Nova negociação iniciada." });
        }
        
        await refreshData();
        setNewNegotiationOpen(false);
    };
    
    const handleGenerateContract = async (negotiation: Negotiation) => {
        try {
            await updateNegotiation(negotiation.id, { 
                stage: "Contrato Gerado", 
                contractStatus: "Pendente Assinaturas" 
            });
            await refreshData();
            toast({ title: "Sucesso!", description: "Contrato gerado. Redirecionando..." });
            router.push(`/dashboard/negotiations/${negotiation.id}/contract`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o status do contrato.' });
        }
    }

    const handleCompleteSale = async (neg: Negotiation) => {
        const { success, message } = await completeSaleAndGenerateCommission(neg);
        if (success) {
            await refreshData(); 
            toast({
                title: "Venda Concluída!",
                description: message
            });
        } else {
             toast({
                variant: "destructive",
                title: "Erro ao Concluir Venda",
                description: message
            });
        }
    };
    
    const handleTriggerCorrespondent = async (negotiation: Negotiation) => {
        const client = availableClients.find(c => c.id === negotiation.clientId);
        if (!client) {
            toast({ variant: 'destructive', title: "Erro", description: "Cliente da negociação não encontrado. Não é possível continuar." });
            return;
        }
        setClientForRequest(client);
        setSelectedNegotiation(negotiation);
        setServiceRequestOpen(true);
    };
    
    const handleServiceRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedNegotiation || !currentUser || !clientForRequest) return;

        const formData = new FormData(event.currentTarget);
        
        const requestData = {
            type: formData.get('type') as ServiceRequestType,
            realtorName: allUsers.find(u => u.id === (formData.get('realtorName') as string))?.name || currentUser.displayName || "N/A",
            clientInfo: formData.get('clientInfo') as string,
            propertyInfo: formData.get('propertyInfo') as string,
            status: 'Pendente' as const,
            date: new Date().toISOString()
        };

        try {
            await addServiceRequest(requestData);
            toast({
                title: "Solicitação Enviada!",
                description: `Uma solicitação de ${requestData.type} foi enviada ao Correspondente Bancário.`,
            });
            setServiceRequestOpen(false);
            setSelectedNegotiation(null);
            setClientForRequest(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível enviar a solicitação." });
        }
    };


    const handleOpenAssignDialog = (negotiation: Negotiation) => {
        setSelectedNegotiation(negotiation);
        setAssignDialogOpen(true);
    };
    
    const handleOpenDetailDialog = (negotiation: Negotiation) => {
        setSelectedNegotiation(negotiation);
        setIsDetailOpen(true);
    };

    const handleArchiveNegotiation = async (negotiationId: string) => {
        try {
            await archiveNegotiation(negotiationId, true);
            await refreshData();
            toast({ title: "Negociação Arquivada", description: "A negociação foi movida para os arquivos." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível arquivar a negociação." });
        }
    };

    const handleOpenDeleteDialog = (negotiation: Negotiation) => {
        setSelectedNegotiation(negotiation);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedNegotiation) return;
        try {
            await markAsDeleted(selectedNegotiation.id, true);
            await refreshData();
            toast({ title: "Negociação Excluída", description: "A negociação foi movida para a lixeira." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a negociação." });
        } finally {
            setDeleteDialogOpen(false);
        }
    };


    const handleAssignNegotiation = async (negotiationId: string, newSalespersonId: string) => {
        try {
            const newSalesperson = allUsers.find(u => u.id === newSalespersonId);
            if (!newSalesperson) {
                toast({ variant: "destructive", title: "Erro", description: "Usuário selecionado não encontrado." });
                return;
            }
            await updateNegotiation(negotiationId, { salesperson: newSalesperson.name, salespersonId: newSalesperson.id });
            await refreshData();
            toast({ title: "Sucesso!", description: "Negociação atribuída com sucesso." });
            setAssignDialogOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível atribuir a negociação." });
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStage: NegotiationStage) => {
        e.preventDefault();
        const negotiationId = e.dataTransfer.getData("negotiationId");
        const originalStage = e.dataTransfer.getData("originalStage") as NegotiationStage;

        const negotiation = allNegotiations.find(n => n.id === negotiationId);
        if (!negotiation || negotiation.stage === newStage) return;

        // Optimistic UI update
        setAllNegotiations(prev =>
            prev.map(n =>
                n.id === negotiationId ? { ...n, stage: newStage } : n
            )
        );

        try {
            await updateNegotiation(negotiationId, { stage: newStage });
            toast({
                title: "Status Atualizado!",
                description: `Negociação movida para "${newStage}".`,
            });
        } catch (error) {
            // Revert UI on error
            setAllNegotiations(prev =>
                prev.map(n =>
                    n.id === negotiationId ? { ...n, stage: originalStage } : n
                )
            );
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o status." });
        }
    };


    const getStageVariant = (stage: Negotiation['stage']): VariantProps<typeof badgeVariants>['variant'] => {
        switch (stage) {
            case 'Proposta Enviada': return 'status-blue';
            case 'Em Negociação': return 'status-orange';
            case 'Contrato Gerado': return 'success';
            case 'Venda Concluída': return 'success';
            case 'Aluguel Ativo': return 'success';
            default: return 'secondary';
        }
    }
    
    const getContractStatusVariant = (status: Negotiation['contractStatus']): VariantProps<typeof badgeVariants>['variant'] => {
        switch (status) {
            case 'Não Gerado': return 'destructive';
            case 'Pendente Assinaturas': return 'status-orange';
            case 'Assinado': return 'success';
            case 'Cancelado': return 'destructive';
            default: return 'secondary';
        }
    }

    const getProcessCodeForNegotiation = (negotiationId: string) => {
        const process = allProcesses.find(p => p.negotiationId === negotiationId);
        return process ? process.processoDisplayCode : 'N/A';
    };


    return (
        <>
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Processos de Negociação</h1>
                    <p className="text-muted-foreground">Acompanhe e gerencie todas as suas negociações.</p>
                </div>
                 <Dialog open={isNewNegotiationOpen} onOpenChange={setNewNegotiationOpen}>
                    <DialogTrigger asChild>
                        <Button>Iniciar Nova Negociação</Button>
                    </DialogTrigger>
                     <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Iniciar Nova Negociação</DialogTitle>
                            <DialogDescription>
                                Selecione um imóvel e um cliente da lista para buscar os dados.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-grow overflow-y-auto -mx-6 px-6">
                            <form id="new-negotiation-form" onSubmit={handleAddNegotiation} className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Imóvel</Label>
                                        <div className="flex items-center gap-2">
                                            <Select value={propertyCode} onValueChange={setPropertyCode} required>
                                                <SelectTrigger><SelectValue placeholder="Selecione um imóvel" /></SelectTrigger>
                                                <SelectContent>
                                                    {availableProperties.map(prop => (
                                                        <SelectItem key={prop.id} value={prop.id}>
                                                            {prop.name} ({prop.displayCode})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <AddPropertyDialog onPropertyAdded={refreshData}>
                                                <Button type="button" variant="outline" size="icon"><Building2 className="h-4 w-4" /></Button>
                                            </AddPropertyDialog>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cliente</Label>
                                        <div className="flex items-center gap-2">
                                            <Select value={clientCode} onValueChange={setClientCode} required>
                                                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                                                <SelectContent>
                                                    {availableClients.map(cli => (
                                                        <SelectItem key={cli.id} value={cli.id}>
                                                            {cli.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <AddClientDialog onClientAdded={refreshData}>
                                                 <Button type="button" variant="outline" size="icon"><UserPlus className="h-4 w-4" /></Button>
                                            </AddClientDialog>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Imóvel Selecionado</h4>
                                        {foundProperty ? (
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <p className="font-medium text-foreground">{foundProperty.name}</p>
                                                <p><strong>Cód:</strong> {foundProperty.displayCode}</p>
                                                <p><strong>End:</strong> {foundProperty.address}</p>
                                                <p><strong>Preço:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundProperty.price)}</p>
                                                <p className="line-clamp-2"><strong>Desc:</strong> {foundProperty.description || 'N/A'}</p>
                                            </div>
                                        ) : <p className="text-sm text-destructive">Nenhum imóvel selecionado.</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Cliente Selecionado</h4>
                                        {foundClient ? (
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <p className="font-medium text-foreground">{foundClient.name}</p>
                                                <p><strong>Doc:</strong> {foundClient.document || 'N/A'}</p>
                                                <p><strong>Email:</strong> {foundClient.email}</p>
                                                <p><strong>Tel:</strong> {foundClient.phone}</p>
                                                <p><strong>End:</strong> {foundClient.address || 'N/A'}</p>
                                                <p><strong>Renda:</strong> {foundClient.monthlyIncome ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(foundClient.monthlyIncome) : 'N/A'}</p>
                                                <p><strong>Responsável:</strong> {foundClient.assignedTo}</p>
                                            </div>
                                        ) : <p className="text-sm text-destructive">Nenhum cliente selecionado.</p>}
                                    </div>
                                </div>

                                <div className="border-t pt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="value">Valor da Proposta (R$)</Label>
                                            <Input id="value" name="value" type="number" placeholder="750000" required value={proposalValue} onChange={e => setProposalValue(e.target.value)} disabled={!foundProperty || !foundClient} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date">Data da Proposta</Label>
                                            <Input id="date" name="date" type="date" required value={proposalDate} onChange={e => setProposalDate(e.target.value)} disabled={!foundProperty || !foundClient} />
                                        </div>
                                    </div>
                                    
                                    {(activeProfile === 'Admin' || activeProfile === 'Imobiliária') && (
                                        <div className="space-y-2">
                                            <Label htmlFor="salespersonId">Vendedor Responsável</Label>
                                            <Select name="salespersonId" defaultValue={currentUser?.uid || ''}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione um vendedor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allUsers.map(realtor => (
                                                        <SelectItem key={realtor.id} value={realtor.id}>
                                                            {realtor.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="documents">Anexar Documentos do Cliente (Opcional)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input id="documents" name="documents" type="file" multiple onChange={handleFileSelection} className="flex-grow" />
                                            {selectedDocs.length > 0 && (
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={clearSelectedFiles}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        {selectedDocs.length > 0 && (
                                            <div className="mt-2 p-3 border rounded-md bg-muted/50 space-y-1">
                                                <h4 className="text-sm font-medium">Arquivos Selecionados ({selectedDocs.length}):</h4>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground max-h-24 overflow-y-auto">
                                                    {selectedDocs.map((file, index) => (
                                                        <li key={index}>{file.name}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="financed" checked={isFinanced} onCheckedChange={(checked) => setIsFinanced(checked as boolean)} disabled={!foundProperty || !foundClient} />
                                        <Label htmlFor="financed">É financiado?</Label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <DialogFooter className="mt-auto pt-4 border-t -mx-6 px-6 bg-background">
                            <Button type="button" variant="outline" onClick={() => setNewNegotiationOpen(false)}>Cancelar</Button>
                            <Button type="submit" form="new-negotiation-form" disabled={!foundProperty || !foundClient || !proposalValue || !proposalDate}>Criar Negociação</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="list" className="w-full">
                 <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
                    <TabsTrigger value="list">Lista</TabsTrigger>
                    <TabsTrigger value="kanban">Kanban Negócios</TabsTrigger>
                    <TabsTrigger value="kanban_corretor">Kanban Corretor</TabsTrigger>
                </TabsList>
                
                <TabsContent value="list">
                    <Card>
                        <CardHeader>
                            <div className="space-y-2">
                                <CardTitle>Negociações em Andamento</CardTitle>
                                <CardDescription>
                                   Selecione os filtros para buscar as negociações.
                                   <Link href="/dashboard/negotiations/archived" className="text-sm text-primary hover:underline ml-2">Ver Arquivadas</Link>
                                   <Link href="/dashboard/negotiations/deleted" className="text-sm text-destructive hover:underline ml-2">Ver Excluídas</Link>
                                </CardDescription>
                            </div>
                             {(activeProfile === 'Admin' || activeProfile === 'Imobiliária') && (
                            <div className="flex items-end gap-2 pt-4">
                                 <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Filtrar por Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Tipos</SelectItem>
                                        <SelectItem value="Venda">Venda</SelectItem>
                                        <SelectItem value="Aluguel">Aluguel</SelectItem>
                                        <SelectItem value="Leilão">Leilão</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Filtrar por Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Status</SelectItem>
                                        <SelectItem value="nao-gerado">Não Gerado</SelectItem>
                                        <SelectItem value="pendente-assinaturas">Pendente Assinaturas</SelectItem>
                                        <SelectItem value="assinado">Assinado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={realtorFilter} onValueChange={setRealtorFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Filtrar por Responsável" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Responsáveis</SelectItem>
                                        {allUsers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="grid w-full sm:w-auto gap-1.5">
                                    <Label htmlFor="start-date" className="text-xs">Data Início</Label>
                                    <Input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
                                </div>
                                <div className="grid w-full sm:w-auto gap-1.5">
                                    <Label htmlFor="end-date" className="text-xs">Data Fim</Label>
                                    <Input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
                                </div>
                            </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cód. Negociação</TableHead>
                                        <TableHead>Cód. Processo</TableHead>
                                        <TableHead>Imóvel</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead className="hidden md:table-cell">Data Criação</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Fase</TableHead>
                                        <TableHead>Contrato</TableHead>
                                        <TableHead className="hidden lg:table-cell">Vendedor</TableHead>
                                        <TableHead className="hidden lg:table-cell">Captador</TableHead>
                                        <TableHead>
                                          <span className="sr-only">Ações</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={11}><Skeleton className="h-8 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredNegotiations.length > 0 ? (
                                        filteredNegotiations.map((neg) => (
                                        <TableRow
                                            key={neg.id}
                                        >
                                            <TableCell className="font-mono text-xs text-muted-foreground">{neg.negotiationDisplayCode}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{getProcessCodeForNegotiation(neg.id)}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{neg.property}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{neg.propertyDisplayCode}</div>
                                            </TableCell>
                                            <TableCell>{neg.client}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {neg.createdAt ? new Date(neg.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                            </TableCell>
                                            <TableCell>{formatCurrency(neg.value)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getStageVariant(neg.stage)}
                                                    className={'whitespace-nowrap'}
                                                >
                                                    {neg.stage}
                                                </Badge>
                                            </TableCell>
                                             <TableCell>
                                                <Badge variant={getContractStatusVariant(neg.contractStatus)} className="whitespace-nowrap">{neg.contractStatus}</Badge>
                                             </TableCell>
                                            <TableCell className="hidden lg:table-cell">{neg.salesperson}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{neg.realtor}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            aria-haspopup="true"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Alternar menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => handleOpenDetailDialog(neg)}>
                                                            <Eye className="mr-2 h-4 w-4" />Ver Detalhes
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/processes`)}>
                                                            Ver Processo
                                                        </DropdownMenuItem>
                                                        {neg.contractStatus === 'Não Gerado' ? (
                                                            <DropdownMenuItem onSelect={() => handleGenerateContract(neg)}>
                                                                Gerar Contrato
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onSelect={() => router.push(`/dashboard/negotiations/${neg.id}/contract`)}>
                                                                Ver/Editar Contrato
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onSelect={() => handleTriggerCorrespondent(neg)}>
                                                            Acionar Correspondente
                                                        </DropdownMenuItem>
                                                        {(activeProfile === 'Admin' || activeProfile === 'Imobiliária') && (
                                                            <DropdownMenuItem onSelect={() => handleOpenAssignDialog(neg)}>
                                                                Enviar/Atribuir
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onSelect={() => handleArchiveNegotiation(neg.id)}>
                                                            Arquivar
                                                        </DropdownMenuItem>
                                                         <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onSelect={() => handleCompleteSale(neg)}
                                                            disabled={neg.stage === 'Venda Concluída' || neg.stage === 'Aluguel Ativo'}
                                                            className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                                        >
                                                            Concluir Venda
                                                        </DropdownMenuItem>
                                                         <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive focus:text-destructive"
                                                            onSelect={() => handleOpenDeleteDialog(neg)}
                                                        >
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                    ) : (
                                         <TableRow>
                                            <TableCell colSpan={11} className="h-24 text-center">Nenhum processo de negociação encontrado.</TableCell>
                                         </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="kanban">
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {KANBAN_COLUMNS.map(stage => (
                             <div key={stage} className="flex-1 min-w-[300px] bg-muted/50 rounded-lg flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, stage)}>
                                <div className={cn("p-3 border-b-2", 
                                    stage === 'Proposta Enviada' ? 'border-status-blue' :
                                    stage === 'Em Negociação' ? 'border-status-orange' :
                                    stage === 'Contrato Gerado' ? 'border-success' :
                                    stage === 'Venda Concluída' ? 'border-success' :
                                    stage === 'Aluguel Ativo' ? 'border-success' :
                                    'border-border'
                                )}>
                                    <h3 className="font-semibold text-sm flex justify-between">
                                        <span>{stage}</span>
                                        <span>({(negotiationsByStage[stage] || []).length})</span>
                                    </h3>
                                </div>
                                <ScrollArea className="flex-1 p-2">
                                     {(negotiationsByStage[stage] || []).map(neg => (
                                        <Card 
                                            key={neg.id} 
                                            className="mb-3 cursor-grab active:cursor-grabbing" 
                                            draggable 
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData("negotiationId", neg.id);
                                                e.dataTransfer.setData("originalStage", neg.stage);
                                            }}
                                        >
                                            <CardContent className="p-3 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-semibold text-sm leading-tight">{neg.property}</span>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1"><MoreHorizontal className="h-4 w-4"/></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                          <DropdownMenuItem onSelect={() => handleOpenDetailDialog(neg)}>Ver Detalhes</DropdownMenuItem>
                                                          <DropdownMenuItem onSelect={() => router.push(`/dashboard/negotiations/${neg.id}/contract`)}>Ver Contrato</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{neg.client}</p>
                                                <div className="flex justify-between items-center pt-1">
                                                    <span className="text-sm font-bold">{formatCurrency(neg.value)}</span>
                                                    <Badge variant="secondary" className="text-xs">{neg.salesperson}</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                     )) || <p className="p-4 text-center text-xs text-muted-foreground">Nenhuma negociação nesta fase.</p>}
                                </ScrollArea>
                            </div>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="kanban_corretor">
                    <RealtorKanban users={brokerUsers}/>
                </TabsContent>
            </Tabs>
        </div>

        <AssignNegotiationDialog
            isOpen={isAssignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            negotiation={selectedNegotiation}
            users={allUsers}
            onAssign={handleAssignNegotiation}
        />
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação marcará a negociação como excluída e a moverá para a lixeira, de onde poderá ser restaurada. Para exclusão permanente, contate o administrador.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteConfirm}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                    >
                        Mover para Lixeira
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {selectedNegotiation && (
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Negociação</DialogTitle>
                        <DialogDescription>
                            ID da Negociação: {selectedNegotiation.negotiationDisplayCode}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh]">
                        <div className="py-4 pr-6 space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg">Informações Gerais</h4>
                                    <div className="text-sm space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Imóvel:</span>
                                            <span className="font-medium text-right">{selectedNegotiation.property} ({selectedNegotiation.propertyDisplayCode})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cliente:</span>
                                            <span className="font-medium text-right">{selectedNegotiation.client}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tipo de Negócio:</span>
                                            <span className="font-medium text-right">{selectedNegotiation.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Valor:</span>
                                            <span className="font-medium text-right">{formatCurrency(selectedNegotiation.value)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">É Financiado:</span>
                                            <span className="font-medium text-right">{selectedNegotiation.isFinanced ? 'Sim' : 'Não'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                     <h4 className="font-semibold text-lg">Status</h4>
                                     <div className="text-sm space-y-2">
                                         <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fase da Negociação:</span>
                                            <div><Badge variant={getStageVariant(selectedNegotiation.stage)}>{selectedNegotiation.stage}</Badge></div>
                                        </div>
                                         <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status do Contrato:</span>
                                            <div><Badge variant={getContractStatusVariant(selectedNegotiation.contractStatus)}>{selectedNegotiation.contractStatus}</Badge></div>
                                        </div>
                                         <div className="flex justify-between">
                                            <span className="text-muted-foreground">Data de Criação:</span>
                                            <span className="font-medium text-right">{new Date(selectedNegotiation.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        {selectedNegotiation.completionDate && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Data de Conclusão:</span>
                                                <span className="font-medium text-right">{new Date(selectedNegotiation.completionDate).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        )}
                                     </div>
                                </div>
                            </div>

                            <Separator />

                             <div className="space-y-4">
                                <h4 className="font-semibold text-lg">Responsáveis</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <p><span className="text-muted-foreground">Vendedor:</span> {selectedNegotiation.salesperson}</p>
                                    <p><span className="text-muted-foreground">Captador:</span> {selectedNegotiation.realtor}</p>
                                </div>
                             </div>
                             
                             <Separator />

                             <div className="space-y-4">
                                <h4 className="font-semibold text-lg">Documentos Anexados</h4>
                                <div className="text-sm text-muted-foreground space-y-2">
                                  {(selectedNegotiation.documentUrls && selectedNegotiation.documentUrls.length > 0) ? (
                                    selectedNegotiation.documentUrls.map((doc, index) => (
                                        <a 
                                            key={index}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                                        >
                                            <FileText className="h-5 w-5 text-primary" />
                                            <span className="truncate text-foreground hover:underline">{doc.name}</span>
                                            <LinkIcon className="h-4 w-4 ml-auto" />
                                        </a>
                                    ))
                                  ) : (
                                    <p>Nenhum documento anexado a esta negociação.</p>
                                  )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
        
        <Dialog open={isServiceRequestOpen} onOpenChange={setServiceRequestOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Nova Solicitação</DialogTitle>
                    <DialogDescription>Preencha os dados para enviar uma solicitação ao correspondente.</DialogDescription>
                </DialogHeader>
                {selectedNegotiation && clientForRequest && (
                    <form onSubmit={handleServiceRequestSubmit}>
                        <div className="py-4 space-y-4">
                           <div className="space-y-2">
                               <Label>Tipo de Solicitação</Label>
                               <Select name="type" required defaultValue={serviceRequestType} onValueChange={(v) => setServiceRequestType(v as any)}>
                                   <SelectTrigger><SelectValue/></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="credit_approval">Aprovação de Crédito</SelectItem>
                                       <SelectItem value="engineering_report">Laudo de Engenharia</SelectItem>
                                       <SelectItem value="property_registration">Matrícula Atualizada</SelectItem>
                                       <SelectItem value="account_opening">Abertura de Conta</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                           <div className="space-y-2">
                                <Label>Seu Nome (Corretor)</Label>
                                <Select name="realtorName" required defaultValue={selectedNegotiation.salespersonId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione seu nome"/></SelectTrigger>
                                    <SelectContent>
                                        {allUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clientInfo">Informações do Cliente</Label>
                                <Textarea 
                                    id="clientInfo" 
                                    name="clientInfo" 
                                    placeholder="Nome completo, CPF, Renda, etc." 
                                    required 
                                    defaultValue={
                                        `Nome: ${clientForRequest.name}\nCPF/CNPJ: ${clientForRequest.document || 'N/A'}\nRenda Mensal: ${clientForRequest.monthlyIncome ? formatCurrency(clientForRequest.monthlyIncome) : 'N/A'}\nEndereço: ${clientForRequest.address || 'N/A'}`
                                    }
                                    rows={5}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="propertyInfo">Informações do Imóvel</Label>
                                <Textarea id="propertyInfo" name="propertyInfo" placeholder="Nome ou código do imóvel, endereço completo, matrícula, etc." required defaultValue={`Imóvel: ${selectedNegotiation.property} (${selectedNegotiation.propertyDisplayCode})`}/>
                            </div>
                        </div>
                       <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setServiceRequestOpen(false)}>Cancelar</Button>
                           <Button type="submit"><Send className="mr-2 h-4 w-4"/>Enviar Solicitação</Button>
                       </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
        </>
    );
}
