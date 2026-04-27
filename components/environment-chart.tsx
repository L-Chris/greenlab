"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type EnvironmentRow = {
  time: string;
  temperature?: number | null;
  humidity?: number | null;
};

export function EnvironmentChart({ data }: { data: EnvironmentRow[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 20, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="temperature" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#b4694d" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#b4694d" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="humidity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#28789b" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#28789b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#d9e3dc" strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#667085" />
          <YAxis tick={{ fontSize: 12 }} stroke="#667085" width={42} />
          <Tooltip
            contentStyle={{
              border: "1px solid #d9e3dc",
              borderRadius: 8,
              boxShadow: "0 12px 30px rgba(31, 41, 51, 0.12)"
            }}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            name="温度"
            stroke="#b4694d"
            strokeWidth={2}
            fill="url(#temperature)"
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="humidity"
            name="湿度"
            stroke="#28789b"
            strokeWidth={2}
            fill="url(#humidity)"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
