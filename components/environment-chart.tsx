"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { format } from "date-fns";

type EnvironmentRow = {
  ts: number;
  temperature?: number | null;
  humidity?: number | null;
  vpd?: number | null;
};

export function EnvironmentChart({ data }: { data: EnvironmentRow[] }) {
  const xTicks = useMemo(() => {
    if (data.length === 0) return [];
    const first = data[0].ts;
    const last = data[data.length - 1].ts;
    const start = Math.floor(first / 7200000) * 7200000;
    const ticks: number[] = [];
    for (let t = start; t <= last; t += 7200000) {
      ticks.push(t);
    }
    return ticks;
  }, [data]);

  const vpdMax = useMemo(() => {
    let max = 0;
    for (const row of data) {
      if (row.vpd != null && row.vpd > max) max = row.vpd;
    }
    return Math.ceil(max * 2) / 2 + 0.5;
  }, [data]);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 8, bottom: 4, left: 0 }}>
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
          <XAxis
            dataKey="ts"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={xTicks}
            interval={0}
            tickFormatter={(ts) => format(new Date(ts), "HH")}
            tick={{ fontSize: 12 }}
            stroke="#667085"
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#667085"
            width={42}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#2f7d5c"
            width={42}
            domain={[0, vpdMax]}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip
            labelFormatter={(ts) => format(new Date(ts), "MM/dd HH:mm")}
            contentStyle={{
              border: "1px solid #d9e3dc",
              borderRadius: 8,
              boxShadow: "0 12px 30px rgba(31, 41, 51, 0.12)"
            }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            name="温度"
            stroke="#b4694d"
            strokeWidth={2}
            fill="url(#temperature)"
            connectNulls
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="humidity"
            name="湿度"
            stroke="#28789b"
            strokeWidth={2}
            fill="url(#humidity)"
            connectNulls
          />
          <Line
            yAxisId="right"
            type="linear"
            dataKey="vpd"
            name="VPD"
            stroke="#e07b39"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#e07b39" }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
