"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartItem {
  month: string;
  collected: number;
  pending: number;
}

export function CollectionChart({ data }: { data?: ChartItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData =
    data && data.length > 0
      ? data
      : [
          { month: "OCT", collected: 0, pending: 0 },
          { month: "NOV", collected: 0, pending: 0 },
          { month: "DEC", collected: 0, pending: 0 },
          { month: "JAN", collected: 0, pending: 0 },
          { month: "FEB", collected: 0, pending: 0 },
          { month: "MAR", collected: 0, pending: 0 },
          { month: "APR", collected: 0, pending: 0 },
          { month: "MAY", collected: 0, pending: 0 },
          { month: "JUN", collected: 0, pending: 0 },
          { month: "JUL", collected: 0, pending: 0 },
          { month: "AUG", collected: 0, pending: 0 },
          { month: "SEP", collected: 0, pending: 0 },
        ];

  if (!mounted) {
    return (
      <div className="h-72 w-full rounded-xl bg-violet-50/50 animate-pulse" />
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 10,
            right: 8,
            left: -15,
            bottom: 0,
          }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#eee9e1"
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#78716c",
              fontSize: 12,
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#a8a29e",
              fontSize: 11,
            }}
            tickFormatter={(value) =>
              `₹${Number(value).toLocaleString("en-IN")}`
            }
          />

          <Tooltip
            cursor={{ fill: "#f5f2ff" }}
            formatter={(value, name) => [
              `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
              name === "collected" ? "Collected" : "Pending",
            ]}
          />

          <Bar
            dataKey="collected"
            stackId="collection"
            fill="#7257f4"
            radius={[0, 0, 0, 0]}
            maxBarSize={44}
          />

          <Bar
            dataKey="pending"
            stackId="collection"
            fill="#e7e2f8"
            radius={[7, 7, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}