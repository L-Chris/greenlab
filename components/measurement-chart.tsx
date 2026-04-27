"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type ChartRow = {
  time: string;
  [plantName: string]: string | number | null;
};

const colors = ["#2f7d5c", "#b4694d", "#28789b", "#8f5b2d", "#6c7a1f", "#8054a2"];

export function MeasurementChart({ data, plantNames }: { data: ChartRow[]; plantNames: string[] }) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#d9e3dc" strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#667085" />
          <YAxis tick={{ fontSize: 12 }} stroke="#667085" width={48} />
          <Tooltip
            contentStyle={{
              border: "1px solid #d9e3dc",
              borderRadius: 8,
              boxShadow: "0 12px 30px rgba(31, 41, 51, 0.12)"
            }}
          />
          {plantNames.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
