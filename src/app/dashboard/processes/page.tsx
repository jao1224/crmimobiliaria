
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ProcessesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Processos Administrativos</h1>
                <p className="text-muted-foreground">Gerencie os processos internos da imobiliária.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Módulo em Construção</CardTitle>
                    <CardDescription>
                        Esta seção será usada para gerenciar processos internos, como documentação, checklists de pós-venda, e outras tarefas administrativas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">A funcionalidade de Processos Administrativos será implementada em breve.</p>
                </CardContent>
            </Card>
        </div>
    );
}
