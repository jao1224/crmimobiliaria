"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", sales: 186 },
  { month: "February", sales: 305 },
  { month: "March", sales: 237 },
  { month: "April", sales: 273 },
  { month: "May", sales: 209 },
  { month: "June", sales: 214 },
  { month: "July", sales: 250 },
  { month: "August", sales: 180 },
  { month: "September", sales: 310 },
  { month: "October", sales: 280 },
  { month: "November", sales: 320 },
  { month: "December", sales: 350 },
]

const chartConfig = {
  sales: {
    label: "Sales",
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
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
