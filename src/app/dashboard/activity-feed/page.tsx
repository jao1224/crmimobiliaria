
"use client";

import { useState, useEffect } from "react";
import { getNotifications, type Notification } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowDown, ArrowUp, Briefcase, FileText, Handshake, Landmark, PlusCircle, UserPlus, Wand2, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap: { [key: string]: React.ElementType } = {
    "Novo Lead!": PlusCircle,
    "Lead Convertido!": UserPlus,
    "Venda Concluída!": Handshake,
    "Contrato Gerado": FileText,
    "Pendência Registrada!": AlertCircle,
    "Processo Finalizado!": Briefcase,
    "Processo de Financiamento Criado": Landmark,
    "IA Encontrou Imóveis": Wand2,
    "Comissão Gerada": ArrowDown,
    "Status de Comissão Alterado": ArrowUp,
    "Negociação Arquivada": Archive,
    "Negociação Restaurada": ArchiveRestore,
    "Negociação Excluída": Trash2,
    "default": AlertCircle
};

const getIconForTitle = (title: string) => {
    const Icon = iconMap[title] || iconMap.default;
    return <Icon className="h-6 w-6 text-muted-foreground" />;
};


export default function ActivityFeedPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const fetchedNotifications = await getNotifications();
                const sortedNotifications = fetchedNotifications.sort((a, b) => {
                    const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
                    const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });
                setNotifications(sortedNotifications);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, []);
    
    return (
        <div className="flex flex-col gap-6">
             <div>
                <h1 className="text-2xl font-bold">Feed de Atividades</h1>
                <p className="text-muted-foreground">Acompanhe as últimas movimentações na plataforma em tempo real.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Últimas Atividades</CardTitle>
                    <CardDescription>Esta é uma linha do tempo de todos os eventos importantes que ocorreram.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-6">
                            {Array.from({length: 5}).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="relative pl-6">
                            {/* Linha da timeline */}
                            <div className="absolute left-6 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>
                            
                            <div className="space-y-8">
                                {notifications.map(notification => (
                                     <div key={notification.id} className="relative flex items-start">
                                        {/* Ponto na timeline */}
                                        <div className="absolute left-0 top-1 h-6 w-6 -translate-x-1/2 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                           <div className="h-2 w-2 rounded-full bg-primary"></div>
                                        </div>

                                        <div className="flex-1 pt-1 ml-6">
                                            <p className="font-semibold text-sm">{notification.title}</p>
                                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                                            <p className="text-xs text-muted-foreground/80 mt-1">
                                                {notification.createdAt?.seconds ? formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true, locale: ptBR }) : 'agora'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                            <AlertCircle className="h-10 w-10 mb-2" />
                            <p className="text-lg font-semibold">Nenhuma atividade recente</p>
                            <p className="text-sm">As novas movimentações aparecerão aqui assim que ocorrerem.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
