
"use client"

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Deal = {
    value: number;
    closeDate: string; // Esperamos uma string no formato 'YYYY-MM-DD'
};

const chartConfig = {
  sales: {
    label: "Vendas (R$)",
    color: "hsl(var(--primary))",
  },
};

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
    return `R$${value}`;
}


export function SalesReport() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSalesData = async () => {
            setIsLoading(true);
            try {
                const dealsQuery = query(collection(db, "deals"), where("stage", "==", "Contrato Gerado"));
                const querySnapshot = await getDocs(dealsQuery);
                const deals = querySnapshot.docs.map(doc => doc.data() as Deal);

                const monthlySales: { [key: string]: number } = {
                    "Jan": 0, "Fev": 0, "Mar": 0, "Abr": 0, "Mai": 0, "Jun": 0,
                    "Jul": 0, "Ago": 0, "Set": 0, "Out": 0, "Nov": 0, "Dez": 0,
                };
                
                const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

                deals.forEach(deal => {
                    const date = new Date(deal.closeDate);
                    const monthIndex = date.getUTCMonth(); // Usar getUTCMonth para evitar problemas de fuso horário
                    const monthName = monthNames[monthIndex];
                    if (monthName) {
                        monthlySales[monthName] += deal.value;
                    }
                });

                const formattedData = Object.keys(monthlySales).map(month => ({
                    month,
                    sales: monthlySales[month],
                }));

                setChartData(formattedData);

            } catch (error) {
                console.error("Failed to fetch sales data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalesData();
    }, []);

    if (isLoading) {
        return (
            <Card className="col-span-1 lg:col-span-7">
                <CardHeader>
                    <CardTitle>Visão Geral de Vendas</CardTitle>
                    <CardDescription>Carregando dados de vendas...</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    if (chartData.length === 0) {
        return (
             <Card className="col-span-1 lg:col-span-7">
                <CardHeader>
                    <CardTitle>Visão Geral de Vendas</CardTitle>
                </CardHeader>
                <CardContent className="pl-2 h-[350px] flex items-center justify-center">
                   <p className="text-muted-foreground">Nenhum dado de venda encontrado para exibir.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        fontSize={12}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(Number(value))}
                    />
                    <Tooltip
                        cursor={false}
                        content={({ active, payload, label }) => active && payload && payload.length ? (
                            <div className="relative rounded-lg border bg-background p-2 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="font-bold text-lg">{label}</span>
                                    <span className="text-sm text-primary">
                                        Vendas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value as number)}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
