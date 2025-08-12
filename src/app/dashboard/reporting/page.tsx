import { SalesReport } from "@/components/dashboard/sales-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import type { UserProfile } from "../layout";

export default function ReportingPage({ activeProfile }: { activeProfile?: UserProfile }) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Relatórios & Análises</h1>
                    <p className="text-muted-foreground">Analise o desempenho com relatórios e visualizações detalhadas.</p>
                </div>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Relatório
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Desempenho de Vendas</CardTitle>
                            <CardDescription>Visualize dados de vendas com filtros personalizados.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                             <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Equipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="team-a">Equipe A</SelectItem>
                                    <SelectItem value="team-b">Equipe B</SelectItem>
                                    <SelectItem value="team-c">Equipe C</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Tipo de Imóvel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="resale">Revenda</SelectItem>
                                    <SelectItem value="new">Lançamento</SelectItem>
                                    <SelectItem value="land">Terreno</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <SalesReport />
                </CardContent>
            </Card>
        </div>
    )
}
