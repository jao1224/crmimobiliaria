
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { getActivitiesForRealtor, updateActivityStatus, Activity, ActivityStatus, getUsers, User } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

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


export default function RealtorKanbanPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const realtorId = params.realtorId as string;
    const [realtor, setRealtor] = useState<User | null>(null);

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!realtorId) return;
            
            setIsLoading(true);
            try {
                const users = await getUsers();
                const currentRealtor = users.find(u => u.id === realtorId);
                
                if (currentRealtor) {
                    setRealtor(currentRealtor);
                    const fetchedActivities = await getActivitiesForRealtor(realtorId);
                    setActivities(fetchedActivities);
                } else {
                     toast({
                        variant: 'destructive',
                        title: "Corretor não encontrado",
                        description: `Não foi possível encontrar dados para o ID fornecido.`
                    });
                }
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: "Erro ao carregar dados",
                    description: "Não foi possível buscar as informações do corretor.",
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [realtorId, toast]);

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


    if (isLoading) {
        return (
             <div className="flex flex-col gap-6 p-4">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <h1 className="text-2xl font-bold">Quadro de Atividades: {realtor?.name || 'Corretor'}</h1>
                    <p className="text-muted-foreground">Arraste e solte os cards para alterar o status das atividades.</p>
                </div>
            </div>
            
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
        </div>
    );
}

