"use client";

import { useState } from "react";
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
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const toggleSeries = (name: string) => {
    setHiddenSeries((current) => ({
      ...current,
      [name]: !current[name]
    }));
  };

  return (
    <div className="flex h-[360px] w-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {plantNames.map((name, index) => {
          const hidden = Boolean(hiddenSeries[name]);

          return (
          <button
            key={name}
            type="button"
            aria-pressed={!hidden}
            onClick={() => toggleSeries(name)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              hidden
                ? "border-slate-200 bg-slate-50 text-slate-400 focus-visible:ring-slate-300"
                : "border-white/70 bg-white text-slate-700 shadow-sm focus-visible:ring-leaf"
            }`}
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[index % colors.length], opacity: hidden ? 0.35 : 1 }}
            />
            <span className={hidden ? "line-through" : undefined}>{name}</span>
          </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
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
              name={name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
              hide={Boolean(hiddenSeries[name])}
              strokeOpacity={hiddenSeries[name] ? 0.2 : 1}
            />
          ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
