
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark } from "lucide-react";

export default function CorrespondentPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Correspondente Bancário</h1>
                <p className="text-muted-foreground">Gerencie os processos e parcerias com correspondentes bancários.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Módulo em Construção</CardTitle>
                    <CardDescription>
                        Esta seção será usada para gerenciar o fluxo de processos de financiamento, documentação e comunicação com correspondentes bancários.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Landmark className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">A funcionalidade de Correspondente Bancário será implementada em breve.</p>
                </CardContent>
            </Card>
        </div>
    );
}
