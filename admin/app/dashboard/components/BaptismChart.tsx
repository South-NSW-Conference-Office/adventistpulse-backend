"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const DATA = [
  { year: "2020", baptisms: 89 },
  { year: "2021", baptisms: 112 },
  { year: "2022", baptisms: 97 },
  { year: "2023", baptisms: 134 },
  { year: "2024", baptisms: 141 },
];

export default function BaptismChart() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#F0F0F0] shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
          Baptism Trend
        </p>
        <span className="text-[10px] text-[#9CA3AF]">5Y ↗</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0A0A0A",
              border: "none",
              borderRadius: 8,
              fontSize: 11,
              color: "#fff",
            }}
            labelStyle={{ color: "#9CA3AF" }}
            formatter={(v) => [v as number, "Baptisms"]}
          />
          <Bar dataKey="baptisms" radius={[4, 4, 0, 0]}>
            {DATA.map((entry, i) => (
              <Cell
                key={entry.year}
                fill={i === DATA.length - 1 ? "#2563EB" : "#BFDBFE"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
