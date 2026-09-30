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

interface FinancialYearOption {
  startYear: number;
  label: string;
}

const getCurrentFinancialYearStart = () => {
  const now = new Date();
  return now.getMonth() + 1 >= 10 ? now.getFullYear() : now.getFullYear() - 1;
};

const buildFinancialYearOptions = (
  currentStartYear: number
): FinancialYearOption[] =>
  Array.from({ length: 5 }, (_, index) => {
    const startYear = currentStartYear - index;
    return {
      startYear,
      label: `FY ${startYear}-${String(startYear + 1).slice(-2)}`,
    };
  });

const EMPTY_CHART_DATA: ChartItem[] = [
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

export function CollectionChart({ data }: { data?: ChartItem[] }) {
  const [mounted, setMounted] = useState(false);
  const [financialYearStart, setFinancialYearStart] = useState(
    getCurrentFinancialYearStart
  );
  const [chartData, setChartData] = useState<ChartItem[]>(
    data && data.length > 0 ? data : EMPTY_CHART_DATA
  );
  const [loading, setLoading] = useState(false);

  const financialYearOptions = buildFinancialYearOptions(
    getCurrentFinancialYearStart()
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (financialYearStart === getCurrentFinancialYearStart()) {
      setChartData(data && data.length > 0 ? data : EMPTY_CHART_DATA);
    }
  }, [data, financialYearStart]);

  const handleFinancialYearChange = async (
    nextFinancialYearStart: number
  ) => {
    setFinancialYearStart(nextFinancialYearStart);

    if (nextFinancialYearStart === getCurrentFinancialYearStart()) {
      setChartData(data && data.length > 0 ? data : EMPTY_CHART_DATA);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/dashboard/collection-chart?financialYear=${nextFinancialYearStart}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch collection chart data");
      }

      const json = (await response.json()) as { chartData?: ChartItem[] };
      setChartData(
        json.chartData && json.chartData.length > 0
          ? json.chartData
          : EMPTY_CHART_DATA
      );
    } catch (error) {
      console.error("Failed to load collection chart:", error);
      setChartData(EMPTY_CHART_DATA);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="h-72 w-full rounded-xl bg-violet-50/50 animate-pulse" />
    );
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-end gap-2">
        <label
          htmlFor="collection-financial-year"
          className="text-xs font-semibold text-stone-500"
        >
          Financial Year
        </label>
        <select
          id="collection-financial-year"
          value={String(financialYearStart)}
          onChange={(event) =>
            handleFinancialYearChange(Number(event.target.value))
          }
          disabled={loading}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none transition hover:border-[#7257f4] focus:border-[#7257f4] focus:ring-2 focus:ring-violet-100 disabled:cursor-wait disabled:opacity-60"
        >
          {financialYearOptions.map((option) => (
            <option key={option.startYear} value={option.startYear}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative h-72 w-full">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/65 text-xs font-semibold text-stone-500 backdrop-blur-[1px]">
            Loading collection...
          </div>
        )}

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
            <CartesianGrid vertical={false} stroke="#eee9e1" />

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
    </div>
  );
}