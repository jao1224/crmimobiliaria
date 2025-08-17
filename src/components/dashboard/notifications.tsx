
"use client"

import { Bell } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// Dados simulados para notificações
const notifications = [
    { title: "Novo Lead!", description: "Carlos Pereira foi adicionado como um novo lead.", time: "2 min atrás" },
    { title: "Venda Concluída", description: "O imóvel 'Apartamento Vista Mar' foi vendido. Comissão gerada.", time: "1 hora atrás" },
    { title: "Pendência de Processo", description: "O processo FIN-002 tem uma pendência de documentação.", time: "3 horas atrás" },
    { title: "Contrato Assinado", description: "O contrato da negociação NEG-004 foi assinado.", time: "1 dia atrás" },
]

export function Notifications() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
            {/* Indicador de notificação não lida */}
            {notifications.length > 0 && (
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
              Você tem {notifications.length} novas notificações.
            </p>
          </div>
          <Separator />
          <div className="grid gap-2">
            {notifications.map((notification, index) => (
                <div key={index} className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0 last:border-b-0 border-b">
                    <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-primary" />
                    <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">
                            {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {notification.description}
                        </p>
                         <p className="text-xs text-muted-foreground/70">
                            {notification.time}
                        </p>
                    </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
