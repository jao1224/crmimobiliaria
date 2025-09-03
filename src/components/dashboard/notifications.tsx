

"use client"

import { useState, useEffect } from 'react'
import { Bell, AlertCircle } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getNotifications, markNotificationsAsRead, type Notification } from '@/lib/data'
import { Skeleton } from '../ui/skeleton'
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        setHasUnread(sortedNotifications.some(n => !n.read));
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && hasUnread) {
        // Mark as read in the backend
        await markNotificationsAsRead();
        // Update local state to reflect the change immediately
        setNotifications(currentNotifications => 
            currentNotifications.map(n => ({ ...n, read: true }))
        );
        setHasUnread(false);
    }
  };


  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
            {hasUnread && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            )}
            <Bell className="h-5 w-5" />
            <span className="sr-only">Abrir notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Notificações</h4>
            <p className="text-sm text-muted-foreground">
              {notifications.length > 0 ? `As ${notifications.length} notificações mais recentes.` : 'Nenhuma notificação.'}
            </p>
          </div>
          <Separator />
          <div className="grid gap-2">
            {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))
            ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                    <div key={notification.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0 last:border-b-0 border-b">
                        <span className={`flex h-2 w-2 translate-y-1.5 rounded-full ${notification.read ? 'bg-muted' : 'bg-primary'}`} />
                        <div className="grid gap-1">
                            <p className="text-sm font-medium leading-none">
                                {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {notification.description}
                            </p>
                             <p className="text-xs text-muted-foreground/70">
                                {notification.createdAt?.seconds ? formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true, locale: ptBR }) : 'agora'}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-4">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p className="text-sm">Nenhuma notificação nova.</p>
                </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
