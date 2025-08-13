
"use client";

import { useState, useMemo } from "react";
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

type EventType = 'personal' | 'company' | 'team_visit';

type Event = {
    id: string;
    date: Date;
    title: string;
    type: EventType;
    time: string;
    description: string;
};

// Dados simulados
const initialEvents: Event[] = [
    { id: 'evt1', date: new Date(), title: 'Reunião com João Comprador', type: 'personal', time: '10:00', description: 'Discutir proposta do Apto Vista Mar.' },
    { id: 'evt2', date: new Date(), title: 'Visita ao Terreno Comercial', type: 'team_visit', time: '14:30', description: 'Visita com a equipe de vendas e a Construtora Build S.A.' },
    { id: 'evt3', date: new Date(new Date().setDate(new Date().getDate() + 2)), title: 'Feriado Municipal', type: 'company', time: 'Dia todo', description: 'A imobiliária estará fechada.' },
    { id: 'evt4', date: new Date(new Date().setDate(new Date().getDate() + 5)), title: 'Entrega das Chaves - Apto 701', type: 'team_visit', time: '09:00', description: 'Cliente Maria feliz.' },
];

export default function AgendaPage() {
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [activeTab, setActiveTab] = useState<EventType>('personal');
    const [isEventDialogOpen, setEventDialogOpen] = useState(false);
    const { toast } = useToast();

    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        return events.filter(event => 
            event.date.getDate() === selectedDate.getDate() &&
            event.date.getMonth() === selectedDate.getMonth() &&
            event.date.getFullYear() === selectedDate.getFullYear() &&
            (event.type === activeTab || (activeTab === 'team' && event.type === 'team_visit'))
        );
    }, [selectedDate, events, activeTab]);
    
    const handleAddEvent = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const dateStr = formData.get("date") as string;
        const [year, month, day] = dateStr.split('-').map(Number);
        
        const newEvent: Event = {
            id: `evt${Date.now()}`,
            date: new Date(year, month - 1, day),
            title: formData.get("title") as string,
            time: formData.get("time") as string,
            description: formData.get("description") as string,
            type: 'personal', // Simulado
        };
        setEvents(prev => [...prev, newEvent]);
        toast({ title: "Sucesso!", description: "Evento adicionado com sucesso (simulado)." });
        setEventDialogOpen(false);
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
                        <Button><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Evento</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Evento</DialogTitle>
                            <DialogDescription>Preencha os detalhes para criar um novo evento na sua agenda pessoal.</DialogDescription>
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
                            <Tabs defaultValue="personal" onValueChange={(value) => setActiveTab(value as EventType)}>
                                <TabsList className="mb-4">
                                    <TabsTrigger value="personal">Minha Agenda</TabsTrigger>
                                    <TabsTrigger value="company">Agenda da Imobiliária</TabsTrigger>
                                    <TabsTrigger value="team_visit">Visitas da Equipe</TabsTrigger>
                                </TabsList>
                                <TabsContent value="personal">
                                     <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        className="rounded-md"
                                        locale={ptBR}
                                        modifiers={{
                                            events: events.filter(e => e.type === 'personal').map(e => e.date)
                                        }}
                                        modifiersStyles={{
                                           events: {
                                                color: 'white',
                                                backgroundColor: getEventTypeLabel('personal').className
                                            }
                                        }}
                                    />
                                </TabsContent>
                                <TabsContent value="company">
                                     <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        className="rounded-md"
                                        locale={ptBR}
                                        modifiers={{
                                            events: events.filter(e => e.type === 'company').map(e => e.date)
                                        }}
                                        modifiersStyles={{
                                            events: { color: 'white', backgroundColor: getEventTypeLabel('company').className }
                                        }}
                                    />
                                </TabsContent>
                                <TabsContent value="team_visit">
                                      <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        className="rounded-md"
                                        locale={ptBR}
                                        modifiers={{
                                            events: events.filter(e => e.type === 'team_visit').map(e => e.date)
                                        }}
                                        modifiersStyles={{
                                            events: { color: 'white', backgroundColor: getEventTypeLabel('team_visit').className }
                                        }}
                                    />
                                </TabsContent>
                            </Tabs>

                        </div>
                        <aside className="w-full md:w-1/3 border-l bg-muted/20 p-4 md:p-6">
                            <h2 className="text-lg font-semibold mb-4">
                                {selectedDate ? `Compromissos para ${selectedDate.toLocaleDateString('pt-BR')}` : 'Selecione uma data'}
                            </h2>
                            <div className="space-y-4">
                                {selectedDayEvents.length > 0 ? (
                                    selectedDayEvents.map(event => (
                                        <div key={event.id} className="p-3 rounded-lg border bg-card shadow-sm">
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
