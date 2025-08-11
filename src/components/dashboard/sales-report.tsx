"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Janeiro", sales: 186 },
  { month: "Fevereiro", sales: 305 },
  { month: "Março", sales: 237 },
  { month: "Abril", sales: 273 },
  { month: "Maio", sales: 209 },
  { month: "Junho", sales: 214 },
  { month: "Julho", sales: 250 },
  { month: "Agosto", sales: 180 },
  { month: "Setembro", sales: 310 },
  { month: "Outubro", sales: 280 },
  { month: "Novembro", sales: 320 },
  { month: "Dezembro", sales: 350 },
]

const chartConfig = {
  sales: {
    label: "Vendas",
    color: "hsl(var(--primary))",
  },
}

export function SalesReport() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
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
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
