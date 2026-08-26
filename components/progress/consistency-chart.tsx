"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ConsistencyPoint {
  day: number;
  percent: number;
  label: string;
  minimum: boolean;
  future: boolean;
}

/**
 * One bar per day, height = how much of that day's plan was completed. No axes
 * furniture, no gridlines — this is a shape to glance at, not a report.
 */
export function ConsistencyChart({ data }: { data: ConsistencyPoint[] }) {
  return (
    <div className="h-[110px] w-full max-w-[640px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
          <XAxis dataKey="day" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--color-text) 6%, transparent)" }}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
              color: "var(--color-text)",
              boxShadow: "var(--shadow-md)",
            }}
            labelFormatter={(day) => `Day ${day}`}
            formatter={(value, _name, item) => {
              const point = item?.payload as ConsistencyPoint | undefined;
              if (point?.future) return ["Not yet", ""];
              const suffix = point?.minimum ? " · Minimum Day" : "";
              return [`${Number(value)}% completed${suffix}`, ""];
            }}
            separator=""
          />
          <Bar dataKey="percent" radius={[2, 2, 0, 0]} minPointSize={3} isAnimationActive={false}>
            {data.map((point) => (
              <Cell
                key={point.day}
                fill={
                  point.future
                    ? "var(--color-neutral-900)"
                    : point.percent === 0
                      ? "var(--color-neutral-800)"
                      : point.minimum
                        ? "var(--color-accent-2-600)"
                        : point.percent === 100
                          ? "var(--color-accent)"
                          : "var(--color-accent-700)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
