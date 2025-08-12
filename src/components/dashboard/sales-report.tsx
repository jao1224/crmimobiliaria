
"use client"

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Dados simulados para o gráfico
const chartData = [
  { month: "Jan", sales: 186000 },
  { month: "Fev", sales: 305000 },
  { month: "Mar", sales: 237000 },
  { month: "Abr", sales: 73000 },
  { month: "Mai", sales: 209000 },
  { month: "Jun", sales: 214000 },
  { month: "Jul", sales: 450000 },
  { month: "Ago", sales: 320000 },
  { month: "Set", sales: 0 },
  { month: "Out", sales: 0 },
  { month: "Nov", sales: 0 },
  { month: "Dez", sales: 0 },
];


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
