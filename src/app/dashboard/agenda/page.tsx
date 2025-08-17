
"use client";

import { useState, useMemo, useContext, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { ProfileContext } from "@/contexts/ProfileContext";
import type { UserProfile } from "../layout";
import { addEvent, getEvents, type Event } from "@/lib/data";


type EventType = 'personal' | 'company' | 'team_visit';

const agendaTabs: { id: EventType, label: string }[] = [
    { id: 'personal', label: 'Minha Agenda' },
    { id: 'company', label: 'Agenda da Imobiliária' },
    { id: 'team_visit', label: 'Visitas da Equipe' }
];

const agendaPermissions: Record<EventType, UserProfile[]> = {
    'personal': ['Admin', 'Imobiliária', 'Corretor Autônomo', 'Investidor', 'Construtora', 'Financeiro'], // Todos têm agenda pessoal
    'company': ['Admin', 'Imobiliária'], // Apenas Admin/Imobiliária podem editar, mas todos podem ver
    'team_visit': ['Admin', 'Imobiliária', 'Corretor Autônomo', 'Construtora'] // Perfis que participam de visitas
};

const editPermissions: Record<EventType, UserProfile[]> = {
    'personal': ['Admin', 'Imobiliária', 'Corretor Autônomo', 'Investidor', 'Construtora', 'Financeiro'], // Cada um edita a sua
    'company': ['Admin', 'Imobiliária'], // Apenas Admin/Imobiliária editam a agenda geral
    'team_visit': ['Admin', 'Imobiliária', 'Corretor Autônomo'] // Corretores e Admins podem marcar visitas
};


export default function AgendaPage() {
    const { activeProfile } = useContext(ProfileContext);

    const visibleTabs = useMemo(() => {
        return agendaTabs.filter(tab => {
            // Todos podem ver a agenda da imobiliária
            if (tab.id === 'company') return true;
            // Para outras agendas, verificar permissão
            return agendaPermissions[tab.id].includes(activeProfile);
        });
    }, [activeProfile]);
    
    const [events, setEvents] = useState<Event[]>(() => getEvents());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [activeTab, setActiveTab] = useState<EventType>(visibleTabs.length > 0 ? visibleTabs[0].id : 'personal');
    const [isEventDialogOpen, setEventDialogOpen] = useState(false);
    const { toast } = useToast();

    // Sincroniza a aba ativa se o perfil mudar e a aba atual não for mais visível
    useEffect(() => {
        const currentTabIsVisible = visibleTabs.some(tab => tab.id === activeTab);
        if (!currentTabIsVisible) {
            setActiveTab(visibleTabs[0]?.id || 'personal');
        }
    }, [visibleTabs, activeTab]);

    const canEditCurrentTab = useMemo(() => {
        return editPermissions[activeTab].includes(activeProfile);
    }, [activeTab, activeProfile]);


    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        const selectedDay = selectedDate.getDate();
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();

        return events.filter(event => {
            const eventDay = event.date.getDate();
            const eventMonth = event.date.getMonth();
            const eventYear = event.date.getFullYear();
            
            return eventDay === selectedDay &&
                   eventMonth === selectedMonth &&
                   eventYear === selectedYear &&
                   event.type === activeTab;
        });
    }, [selectedDate, events, activeTab]);
    
    const handleAddEvent = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const dateStr = formData.get("date") as string;
        
        // Corrige o problema de fuso horário criando a data com base em UTC
        const date = new Date(dateStr);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctDate = new Date(date.getTime() + userTimezoneOffset);

        const newEvent: Event = {
            id: `evt${Date.now()}`,
            date: correctDate,
            title: formData.get("title") as string,
            time: formData.get("time") as string,
            description: formData.get("description") as string,
            type: activeTab, // Adiciona o evento na agenda ativa
        };
        addEvent(newEvent);
        setEvents(getEvents()); // Recarrega os eventos para incluir o novo
        toast({ title: "Sucesso!", description: "Evento adicionado com sucesso." });
        setEventDialogOpen(false);
        event.currentTarget.reset();
    };

    const getEventTypeLabel = (type: Event['type']) => {
        switch (type) {
            case 'personal': return { label: 'Pessoal', className: 'bg-blue-500' };
            case 'company': return { label: 'Imobiliária', className: 'bg-red-500' };
            case 'team_visit': return { label: 'Visita de Equipe', className: 'bg-green-500' };
            default: return { label: 'Evento', className: 'bg-gray-500' };
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agenda</h1>
                    <p className="text-muted-foreground">Gerencie seus compromissos, visitas e eventos.</p>
                </div>
                 <Dialog open={isEventDialogOpen} onOpenChange={setEventDialogOpen}>
                    <DialogTrigger asChild>
                        {canEditCurrentTab && (
                            <Button><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Evento</Button>
                        )}
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Evento</DialogTitle>
                            <DialogDescription>Preencha os detalhes para criar um novo evento na agenda de <span className="font-bold">{getEventTypeLabel(activeTab).label}</span>.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddEvent}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">Título</Label>
                                    <Input id="title" name="title" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">Data</Label>
                                    <Input id="date" name="date" type="date" className="col-span-3" required defaultValue={selectedDate?.toISOString().split('T')[0]}/>
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="time" className="text-right">Hora</Label>
                                    <Input id="time" name="time" type="time" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">Descrição</Label>
                                    <Input id="description" name="description" className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Salvar Evento</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-4 md:p-6">
                            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventType)}>
                                <TabsList className="mb-4">
                                   {visibleTabs.map(tab => (
                                        <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
                                   ))}
                                </TabsList>
                                
                                {visibleTabs.map(tab => (
                                     <TabsContent key={tab.id} value={tab.id} forceMount>
                                         <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            className="rounded-md"
                                            locale={ptBR}
                                            modifiers={{
                                                events: events.filter(e => e.type === tab.id).map(e => e.date)
                                            }}
                                            modifiersStyles={{
                                               events: {
                                                    color: 'white',
                                                    backgroundColor: getEventTypeLabel(tab.id).className
                                                }
                                            }}
                                        />
                                    </TabsContent>
                                ))}

                            </Tabs>

                        </div>
                        <aside className="w-full md:w-1/3 border-l bg-muted/20 p-4 md:p-6">
                            <h2 className="text-lg font-semibold mb-4">
                                {selectedDate ? `Compromissos para ${selectedDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : 'Selecione uma data'}
                            </h2>
                            <div className="space-y-4">
                                {selectedDayEvents.length > 0 ? (
                                    selectedDayEvents.map(event => (
                                        <div key={event.id} className="p-3 rounded-lg border bg-card shadow-sm transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold">{event.title}</h3>
                                                <Badge style={{ backgroundColor: getEventTypeLabel(event.type).className }} className="text-white">{getEventTypeLabel(event.type).label}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{event.time}</p>
                                            <p className="text-sm mt-2">{event.description}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento para esta data nesta agenda.</p>
                                )}
                            </div>
                        </aside>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
