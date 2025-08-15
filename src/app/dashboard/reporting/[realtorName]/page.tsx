
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { initialProperties, type Property } from "../../properties/page";
import { initialNegotiations, type Negotiation } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Handshake } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Activity = (Property & { activityType: 'capture' }) | (Negotiation & { activityType: 'negotiation' });

const formatUrlNameToRealtorName = (urlName: string) => {
    return urlName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function RealtorFlowPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const realtorName = params.realtorName ? formatUrlNameToRealtorName(params.realtorName as string) : "";

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (realtorName) {
            setIsLoading(true);
            const capturedProperties = initialProperties
                .filter(p => p.capturedBy === realtorName)
                .map(p => ({ ...p, activityType: 'capture' as const }));

            const relatedNegotiations = initialNegotiations
                .filter(n => (n.realtor === realtorName || n.salesperson === realtorName) && n.stage === 'Venda Concluída')
                .map(n => ({ ...n, activityType: 'negotiation' as const }));

            const combinedActivities = [...capturedProperties, ...relatedNegotiations].sort((a, b) => {
                const dateA = a.activityType === 'negotiation' ? new Date(a.completionDate || 0) : new Date(0);
                const dateB = b.activityType === 'negotiation' ? new Date(b.completionDate || 0) : new Date(0);
                // Simple sort, can be improved to use property creation date for captures
                return dateB.getTime() - dateA.getTime();
            });

            setActivities(combinedActivities);
            setIsLoading(false);
        }
    }, [realtorName]);

    const handleStatusChange = (activityId: string, newStatus: string) => {
        // Here you would typically make an API call to update the status in your database.
        // For this simulation, we'll just show a toast message.
        toast({
            title: "Status Atualizado (Simulado)",
            description: `O status da atividade ${activityId.toUpperCase()} foi alterado para "${newStatus}".`,
        });
    };

    if (isLoading) {
        return <Skeleton className="w-full h-96" />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Voltar</span>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Fluxograma de Atividades: {realtorName}</h1>
                    <p className="text-muted-foreground">Linha do tempo das principais atividades do corretor.</p>
                </div>
            </div>

            <div className="relative pl-6 space-y-8">
                {/* Linha do tempo vertical */}
                <div className="absolute left-9 top-2 h-full w-0.5 bg-border -translate-x-1/2"></div>
                
                {activities.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">Nenhuma atividade registrada para este corretor.</div>
                )}
                
                {activities.map((activity, index) => {
                    const isCapture = activity.activityType === 'capture';
                    const Icon = isCapture ? Target : Handshake;
                    const iconBg = isCapture ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground';

                    return (
                        <div key={`${activity.id}-${index}`} className="relative pl-6">
                            <div className={`absolute -left-3 top-1.5 flex h-6 w-6 items-center justify-center rounded-full ${iconBg}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">{isCapture ? 'Captação de Imóvel' : 'Venda Concluída'}</CardTitle>
                                    <CardDescription>
                                        Imóvel: <strong>{isCapture ? activity.name : activity.property}</strong>
                                        {!isCapture && <span> para <strong>{activity.client}</strong></span>}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p>Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activity.price || activity.value)}</p>
                                    {isCapture ? (
                                        <p>Status: <Badge variant={activity.status === 'Disponível' ? 'success' : 'secondary'}>{activity.status}</Badge></p>
                                    ) : (
                                        <p>Data: {activity.completionDate ? new Date(activity.completionDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-end bg-muted/50 p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Status da Atividade:</span>
                                        <Select defaultValue="ativo" onValueChange={(newStatus) => handleStatusChange(activity.id, newStatus)}>
                                            <SelectTrigger className="w-[180px] h-9">
                                                <SelectValue placeholder="Alterar status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ativo">Ativo</SelectItem>
                                                <SelectItem value="pendente">Pendente</SelectItem>
                                                <SelectItem value="concluido">Concluído</SelectItem>
                                                <SelectItem value="cancelado">Cancelado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
