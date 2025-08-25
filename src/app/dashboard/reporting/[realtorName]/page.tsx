
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getActivitiesForRealtor, updateActivityStatus, Activity, ActivityStatus } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Column = {
    id: ActivityStatus;
    title: string;
    activityIds: string[];
};

type Columns = {
    [key in ActivityStatus]: Column;
};

const formatUrlNameToRealtorName = (urlName: string) => {
    return urlName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getStatusColor = (status: ActivityStatus) => {
    switch(status) {
        case 'Ativo': return 'bg-blue-500';
        case 'Pendente': return 'bg-yellow-500';
        case 'Concluído': return 'bg-green-500';
        case 'Cancelado': return 'bg-red-500';
        default: return 'bg-gray-400';
    }
}

export default function RealtorKanbanPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const realtorName = params.realtorName ? formatUrlNameToRealtorName(params.realtorName as string) : "";

    const [activities, setActivities] = useState<{[key: string]: Activity}>({});
    const [columns, setColumns] = useState<Columns | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

    const loadData = async () => {
        if (!realtorName) return;
        
        setIsLoading(true);
        try {
            const fetchedActivities = await getActivitiesForRealtor(realtorName);
            
            const activitiesMap = fetchedActivities.reduce((acc, activity) => {
                acc[activity.id] = activity;
                return acc;
            }, {} as {[key: string]: Activity});
            setActivities(activitiesMap);

            const initialColumns: Columns = {
                'Ativo': { id: 'Ativo', title: 'Ativo', activityIds: [] },
                'Pendente': { id: 'Pendente', title: 'Pendente', activityIds: [] },
                'Concluído': { id: 'Concluído', title: 'Concluído', activityIds: [] },
                'Cancelado': { id: 'Cancelado', title: 'Cancelado', activityIds: [] },
            };

            fetchedActivities.forEach(activity => {
                if (initialColumns[activity.status]) {
                    initialColumns[activity.status].activityIds.push(activity.id);
                }
            });

            setColumns(initialColumns);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao carregar atividades",
                description: "Não foi possível buscar os dados do Kanban."
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        loadData();
    }, [realtorName]);

    const handleCardClick = (activityId: string) => {
        // Se o card clicado já está selecionado, deseleciona. Senão, seleciona.
        setSelectedActivityId(prevId => prevId === activityId ? null : activityId);
    };

    const handleColumnClick = async (columnId: ActivityStatus) => {
        if (!selectedActivityId || !columns) return;

        const sourceColumn = Object.values(columns).find(col => col.activityIds.includes(selectedActivityId));
        if (!sourceColumn || sourceColumn.id === columnId) {
            // Não faz nada se a coluna de destino for a mesma ou se não encontrar a de origem
            setSelectedActivityId(null); // Deseleciona o card
            return;
        }

        const destinationColumn = columns[columnId];

        // --- Optimistic UI Update ---
        const newColumns = { ...columns };

        // Remove from source
        const sourceActivityIds = [...sourceColumn.activityIds];
        const activityIndex = sourceActivityIds.indexOf(selectedActivityId);
        sourceActivityIds.splice(activityIndex, 1);
        newColumns[sourceColumn.id] = { ...sourceColumn, activityIds: sourceActivityIds };

        // Add to destination
        const destActivityIds = [...destinationColumn.activityIds];
        destActivityIds.push(selectedActivityId);
        newColumns[destinationColumn.id] = { ...destinationColumn, activityIds: destActivityIds };
        
        setColumns(newColumns);
        const movedActivityId = selectedActivityId;
        setSelectedActivityId(null); // Deseleciona após mover

        // --- Persist change in the database ---
        try {
            await updateActivityStatus(movedActivityId, columnId);
            toast({
                title: "Status Atualizado!",
                description: `Atividade movida para "${columnId}".`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao salvar",
                description: "Não foi possível salvar a alteração. Por favor, atualize a página.",
            });
            // Idealmente, reverteríamos o estado, mas recarregar os dados é mais simples aqui.
            await loadData(); 
        }
    };

    if (isLoading) {
        return (
             <div className="flex flex-col gap-6 p-4">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid grid-cols-4 gap-4">
                    <Skeleton className="h-[60vh] w-full" />
                    <Skeleton className="h-[60vh] w-full" />
                    <Skeleton className="h-[60vh] w-full" />
                    <Skeleton className="h-[60vh] w-full" />
                </div>
            </div>
        )
    }
    
    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Voltar</span>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Quadro de Atividades: {realtorName}</h1>
                    <p className="text-muted-foreground">Clique em um card para selecionar e em uma coluna para mover.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start flex-1">
                {columns && Object.values(columns).map(column => (
                    <div key={column.id} onClick={() => handleColumnClick(column.id)} className="h-full">
                        <Card className={cn("flex flex-col h-full transition-all duration-200", selectedActivityId && "cursor-pointer hover:bg-secondary/80")}>
                            <CardHeader className="border-b">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <span className={cn("h-3 w-3 rounded-full", getStatusColor(column.id))}></span>
                                    {column.title}
                                    <Badge variant="secondary" className="ml-auto">{column.activityIds.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 space-y-2 flex-1 overflow-y-auto">
                                {column.activityIds.map((activityId) => {
                                    const activity = activities[activityId];
                                    if (!activity) return null;
                                    const isCapture = activity.type === 'capture';
                                    const Icon = isCapture ? Target : Handshake;
                                    const iconBg = isCapture ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground';

                                    return (
                                        <div
                                            key={activity.id}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evita que o clique no card dispare o clique da coluna
                                                handleCardClick(activity.id);
                                            }}
                                            className={cn(
                                                "rounded-lg border bg-card p-3 shadow-sm cursor-pointer transition-all duration-200",
                                                selectedActivityId === activity.id && "ring-2 ring-primary shadow-lg scale-105"
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <span className="text-xs font-semibold">{isCapture ? 'Captação' : 'Negociação'}</span>
                                                <div className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs", iconBg)}>
                                                    <Icon className="h-3 w-3" />
                                                </div>
                                            </div>
                                            <p className="font-bold text-sm mt-1">{activity.name}</p>
                                            <p className="text-xs text-muted-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activity.value)}</p>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
