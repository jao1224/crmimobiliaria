
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
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
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const realtorName = params.realtorName ? formatUrlNameToRealtorName(params.realtorName as string) : "";

    const [activities, setActivities] = useState<{[key: string]: Activity}>({});
    const [columns, setColumns] = useState<Columns | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

     useEffect(() => {
        setIsClient(true); // Garante que DND só renderize no cliente
    }, []);

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

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination || !columns) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const startColumn = columns[source.droppableId as ActivityStatus];
        const finishColumn = columns[destination.droppableId as ActivityStatus];
        const newStatus = destination.droppableId as ActivityStatus;

        // --- Optimistic UI Update ---
        const originalColumns = JSON.parse(JSON.stringify(columns));

        // Moving within the same column
        if (startColumn === finishColumn) {
            const newActivityIds = Array.from(startColumn.activityIds);
            newActivityIds.splice(source.index, 1);
            newActivityIds.splice(destination.index, 0, draggableId);

            const newColumn = {
                ...startColumn,
                activityIds: newActivityIds,
            };

            setColumns(prev => prev ? {
                ...prev,
                [newColumn.id]: newColumn,
            } : null);
        } else {
            // Moving to a different column
            const startTaskIds = Array.from(startColumn.activityIds);
            startTaskIds.splice(source.index, 1);
            const newStartColumn = {
                ...startColumn,
                activityIds: startTaskIds,
            };

            const finishTaskIds = Array.from(finishColumn.activityIds);
            finishTaskIds.splice(destination.index, 0, draggableId);
            const newFinishColumn = {
                ...finishColumn,
                activityIds: finishTaskIds,
            };

            setColumns(prev => prev ? {
                ...prev,
                [newStartColumn.id]: newStartColumn,
                [newFinishColumn.id]: newFinishColumn,
            } : null);
        }

        // --- Persist change in the database ---
        try {
            await updateActivityStatus(draggableId, newStatus);
            toast({
                title: "Status Atualizado!",
                description: `Atividade movida para "${newStatus}".`,
            });
            // Optional: You can re-fetch data to ensure full consistency, but optimistic update should suffice.
            // await loadData(); 
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao salvar",
                description: "Não foi possível salvar a alteração. Revertendo.",
            });
            // Revert UI on failure
            setColumns(originalColumns);
        }
    };

    if (isLoading || !isClient) {
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
                    <p className="text-muted-foreground">Gerencie as captações e negociações arrastando os cartões.</p>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start flex-1">
                    {columns && Object.values(columns).map(column => (
                        <Droppable key={column.id} droppableId={column.id}>
                            {(provided, snapshot) => (
                                <Card className={cn("flex flex-col h-full transition-colors", snapshot.isDraggingOver && "bg-secondary")}>
                                    <CardHeader className="border-b">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className={cn("h-3 w-3 rounded-full", getStatusColor(column.id))}></span>
                                            {column.title}
                                            <Badge variant="secondary" className="ml-auto">{column.activityIds.length}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent 
                                        ref={provided.innerRef} 
                                        {...provided.droppableProps}
                                        className="p-2 space-y-2 flex-1 overflow-y-auto"
                                    >
                                        {column.activityIds.map((activityId, index) => {
                                            const activity = activities[activityId];
                                            if (!activity) return null;
                                            const isCapture = activity.type === 'capture';
                                            const Icon = isCapture ? Target : Handshake;
                                            const iconBg = isCapture ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground';

                                            return (
                                                <Draggable key={activity.id} draggableId={activity.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={cn("rounded-lg border bg-card p-3 shadow-sm", snapshot.isDragging && "shadow-lg scale-105")}
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
                                                    )}
                                                </Draggable>
                                            )
                                        })}
                                        {provided.placeholder}
                                    </CardContent>
                                </Card>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
