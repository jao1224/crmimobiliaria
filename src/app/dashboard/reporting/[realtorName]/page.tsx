
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { getActivitiesForRealtor, updateActivityStatus, Activity, ActivityStatus } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

const statusConfig: { [key in ActivityStatus]: { title: string } } = {
    'Ativo': { title: 'Ativo' },
    'Pendente': { title: 'Pendente' },
    'Concluído': { title: 'Concluído' },
    'Cancelado': { title: 'Cancelado' },
};

export default function RealtorKanbanPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const realtorName = params.realtorName ? formatUrlNameToRealtorName(params.realtorName as string) : "";

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        if (!realtorName) return;
        
        setIsLoading(true);
        try {
            const fetchedActivities = await getActivitiesForRealtor(realtorName);
            setActivities(fetchedActivities);
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, activityId: string) => {
        e.dataTransfer.setData("activityId", activityId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessário para permitir o drop
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: ActivityStatus) => {
        const activityId = e.dataTransfer.getData("activityId");
        if (!activityId) return;

        const originalActivities = [...activities]; // Cópia para rollback em caso de erro

        // --- Optimistic UI Update ---
        setActivities(prevActivities =>
            prevActivities.map(act =>
                act.id === activityId ? { ...act, status: newStatus } : act
            )
        );
        
        // --- Persist change in the database ---
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
            setActivities(originalActivities); // Reverte a UI em caso de falha
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
                    <p className="text-muted-foreground">Arraste e solte os cards para alterar o status das atividades.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start flex-1">
                {Object.entries(statusConfig).map(([status, config]) => (
                    <div 
                        key={status} 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status as ActivityStatus)}
                        className="h-full"
                    >
                        <Card className="flex flex-col h-full bg-secondary/50">
                            <CardHeader className="border-b">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <span className={cn("h-3 w-3 rounded-full", getStatusColor(status as ActivityStatus))}></span>
                                    {config.title}
                                    <Badge variant="secondary" className="ml-auto">{activitiesByStatus[status as ActivityStatus].length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 space-y-2 flex-1 overflow-y-auto">
                                {activitiesByStatus[status as ActivityStatus].map((activity) => {
                                    const isCapture = activity.type === 'capture';
                                    const Icon = isCapture ? Target : Handshake;
                                    const iconBg = isCapture ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground';

                                    return (
                                        <div
                                            key={activity.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, activity.id)}
                                            className="rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
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

