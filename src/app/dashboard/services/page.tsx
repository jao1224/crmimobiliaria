
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Gavel, Hammer, FileCheck2, Building } from "lucide-react";

export default function ServicesPage() {
    
    const services = [
        { id: "evaluator", label: "Avaliador", icon: Scale, description: "Serviços de avaliação de imóveis." },
        { id: "legal", label: "Jurídico", icon: Gavel, description: "Suporte e consultoria jurídica imobiliária." },
        { id: "auction", label: "Leilão", icon: Hammer, description: "Gestão e participação em leilões de imóveis." },
        { id: "dispatcher", label: "Despachante", icon: FileCheck2, description: "Serviços de despachante para documentação." },
        { id: "rental", label: "Locação", icon: Building, description: "Administração de contratos de locação." },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Outros Serviços</h1>
                <p className="text-muted-foreground">Gerencie serviços adicionais oferecidos pela imobiliária.</p>
            </div>

            <Tabs defaultValue={services[0].id} className="w-full">
                <TabsList>
                    {services.map(service => (
                        <TabsTrigger key={service.id} value={service.id}>{service.label}</TabsTrigger>
                    ))}
                </TabsList>

                {services.map(service => {
                    const Icon = service.icon;
                    return (
                        <TabsContent key={service.id} value={service.id}>
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Icon className="h-6 w-6" />
                                        <span>{service.label}</span>
                                    </CardTitle>
                                    <CardDescription>
                                        {service.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                                    <p className="text-muted-foreground">O módulo de <span className="font-semibold">{service.label}</span> será implementado em breve.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
