"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface ChartItem {
  month: string;
  amount: number;
}

export function CollectionChart({ data }: { data?: ChartItem[] }) {
  const chartData =
    data && data.length > 0
      ? data
      : [
          { month: "Mar", amount: 0 },
          { month: "Apr", amount: 0 },
          { month: "May", amount: 0 },
          { month: "Jun", amount: 0 },
          { month: "Jul", amount: 0 },
          { month: "Aug", amount: 0 },
        ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 8, left: -15, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eee9e1" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 12 }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a8a29e", fontSize: 11 }}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            cursor={{ fill: "#f5f2ff" }}
            formatter={(value) => [`₹${Number(value ?? 0).toLocaleString("en-IN")}`, "Collection"]}
          />
          <Bar dataKey="amount" fill="#7257f4" radius={[7, 7, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
