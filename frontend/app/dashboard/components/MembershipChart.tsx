"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DATA = [
  { year: "2015", members: 3820 },
  { year: "2016", members: 3950 },
  { year: "2017", members: 4100 },
  { year: "2018", members: 4020 },
  { year: "2019", members: 4230 },
  { year: "2020", members: 4150 },
  { year: "2021", members: 4380 },
  { year: "2022", members: 4290 },
  { year: "2023", members: 4510 },
  { year: "2024", members: 4620 },
];

export default function MembershipChart() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#F0F0F0] shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
          Membership Trend
        </p>
        <span className="text-[10px] text-[#9CA3AF]">10Y ↗</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
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
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
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
            formatter={(v) => [(v as number).toLocaleString(), "Members"]}
          />
          <Line
            type="monotone"
            dataKey="members"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#2563EB" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
