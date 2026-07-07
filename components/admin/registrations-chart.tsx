"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyRegistrationCount } from "@/lib/types/admin";

type Props = {
  data: DailyRegistrationCount[];
};

function formatDateShort(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Karachi",
  });
}

function formatDateLong(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  });
}

function pickChartTicks(dates: string[], targetCount: number): string[] {
  if (dates.length === 0) return [];
  if (dates.length <= targetCount) return dates;

  const step = Math.max(1, Math.floor((dates.length - 1) / (targetCount - 1)));
  const ticks = [dates[0]];

  for (let i = step; i < dates.length - 1; i += step) {
    ticks.push(dates[i]);
  }

  const last = dates[dates.length - 1];
  if (ticks[ticks.length - 1] !== last) {
    ticks.push(last);
  }

  return ticks;
}

function subscribeToWidth(onStoreChange: () => void) {
  const media = window.matchMedia("(min-width: 640px)");
  const mediaLg = window.matchMedia("(min-width: 1024px)");

  media.addEventListener("change", onStoreChange);
  mediaLg.addEventListener("change", onStoreChange);
  window.addEventListener("resize", onStoreChange);

  return () => {
    media.removeEventListener("change", onStoreChange);
    mediaLg.removeEventListener("change", onStoreChange);
    window.removeEventListener("resize", onStoreChange);
  };
}

function getTargetTickCount() {
  if (typeof window === "undefined") return 6;
  if (window.innerWidth < 640) return 4;
  if (window.innerWidth < 1024) return 6;
  return 7;
}

export function RegistrationsChart({ data }: Props) {
  const hasData = data.some((d) => d.count > 0);
  const targetTickCount = useSyncExternalStore(
    subscribeToWidth,
    getTargetTickCount,
    () => 6,
  );

  const ticks = useMemo(
    () => pickChartTicks(data.map((d) => d.date), targetTickCount),
    [data, targetTickCount],
  );

  const yMax = useMemo(() => {
    const peak = Math.max(...data.map((d) => d.count), 0);
    if (peak <= 4) return 4;
    return Math.ceil(peak * 1.15);
  }, [data]);

  if (!hasData) {
    const barHeights = [28, 42, 22, 48, 34, 52, 38];

    return (
      <div className="admin-chart-empty">
        <div className="admin-chart-empty-bars" aria-hidden>
          {barHeights.map((h, i) => (
            <span
              key={i}
              className="admin-chart-empty-bar"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <p className="admin-chart-empty-title">No registrations yet</p>
        <p className="admin-chart-empty-hint">
          Daily counts will appear here once delegates start applying.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--admin-chart-grid)"
            vertical={false}
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="date"
            ticks={ticks}
            interval={0}
            tick={{
              fontSize: 11,
              fill: "var(--admin-chart-text)",
            }}
            axisLine={{ stroke: "var(--admin-border)" }}
            tickLine={false}
            tickMargin={10}
            height={36}
            tickFormatter={formatDateShort}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, yMax]}
            tick={{
              fontSize: 11,
              fill: "var(--admin-chart-text)",
            }}
            axisLine={false}
            tickLine={false}
            width={32}
            tickCount={5}
          />
          <Tooltip
            cursor={{
              stroke: "var(--admin-border-strong)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 4,
              border: "1px solid var(--admin-border-strong)",
              background: "var(--admin-surface)",
              color: "var(--admin-text)",
              boxShadow: "var(--admin-shadow-md)",
            }}
            labelFormatter={(v) => formatDateLong(String(v))}
            formatter={(value) => [value, "Registrations"]}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--admin-chart-line)"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--admin-chart-dot-active)",
              strokeWidth: 0,
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
