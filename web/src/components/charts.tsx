"use client";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, Spinner, Empty } from "./ui";
import type { ChartRecommendation } from "@/lib/types";

const COLORS = ["#7C3AED", "#06B6D4", "#DB2777", "#F59E0B", "#10B981", "#6366F1", "#F43F5E", "#0EA5E9"];
const TOOLTIP_STYLE = { background: "#FFFFFF", border: "1px solid #E4DEF5", borderRadius: 12, color: "#1B1638", boxShadow: "0 12px 32px -12px rgba(76,29,149,0.25)" } as const;
const TOOLTIP_ITEM = { color: "#1B1638" } as const;
const TOOLTIP_LABEL = { color: "#5C5685", fontWeight: 600 } as const;

const fmtNum = (n: any) =>
  typeof n === "number" ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (n ?? "—");

const PIE_RAD = Math.PI / 180;
function renderPieLabel({ cx, cy, midAngle, outerRadius, percent, name }: any) {
  const r = outerRadius + 16;
  const x = cx + r * Math.cos(-midAngle * PIE_RAD);
  const y = cy + r * Math.sin(-midAngle * PIE_RAD);
  return (
    <text x={x} y={y} fill="#1B1638" fontSize={11} fontWeight={600} textAnchor={x >= cx ? "start" : "end"} dominantBaseline="central">
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

type LoadData = (chart: ChartRecommendation) => Promise<any>;

function ChartCard({ chart, keyScope, loadData }: { chart: ChartRecommendation; keyScope: string; loadData: LoadData }) {
  const { data, isLoading } = useQuery({
    queryKey: ["chart-data", keyScope, chart.chart_type, chart.x_column, chart.y_column],
    queryFn: () => loadData(chart),
  });

  const isKpi = chart.chart_type === "kpi";
  return (
    <Card className={isKpi ? "" : "md:col-span-1"}>
      <h3 className="mb-4 text-sm font-semibold">{chart.title}</h3>
      {isLoading ? (
        <div className={`grid ${isKpi ? "h-24" : "h-52"} place-items-center`}><Spinner className="h-5 w-5 text-violet" /></div>
      ) : isKpi ? (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Average</div>
          <div className="mt-1 truncate text-3xl lg:text-4xl font-bold font-display nums text-gradient leading-tight">
            {fmtNum(data?.value)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-3 text-xs">
            <span className="text-ink-faint">Range <span className="nums font-semibold text-ink-muted">{fmtNum(data?.min)}–{fmtNum(data?.max)}</span></span>
            <span className="text-ink-faint">Rows <span className="nums font-semibold text-ink-muted">{fmtNum(data?.count)}</span></span>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          {chart.chart_type === "bar" ? (
            <BarChart data={data?.points ?? []}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DEF5" />
              <XAxis dataKey="x" tick={{ fill: "#5C5685", fontSize: 11 }} axisLine={{ stroke: "#E4DEF5" }} />
              <YAxis tick={{ fill: "#5C5685", fontSize: 11 }} axisLine={{ stroke: "#E4DEF5" }} />
              <Tooltip cursor={{ fill: "rgba(124,58,237,0.08)" }} contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} labelStyle={TOOLTIP_LABEL} />
              <Bar dataKey="y" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : chart.chart_type === "line" ? (
            <LineChart data={data?.points ?? []}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="50%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#DB2777" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DEF5" />
              <XAxis dataKey="x" tick={{ fill: "#5C5685", fontSize: 11 }} axisLine={{ stroke: "#E4DEF5" }} />
              <YAxis tick={{ fill: "#5C5685", fontSize: 11 }} axisLine={{ stroke: "#E4DEF5" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} labelStyle={TOOLTIP_LABEL} />
              <Line type="monotone" dataKey="y" stroke="url(#lineGrad)" strokeWidth={3} dot={{ fill: "#7C3AED", r: 3 }} activeDot={{ r: 5, fill: "#DB2777" }} />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={data?.points ?? []} dataKey="y" nameKey="x" cx="50%" cy="50%" innerRadius={46} outerRadius={78} paddingAngle={3} stroke="#FFFFFF" strokeWidth={3} label={renderPieLabel}>
                {(data?.points ?? []).map((_: unknown, idx: number) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} labelStyle={TOOLTIP_LABEL} />
            </PieChart>
          )}
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export function ChartGrid({ charts, keyScope, loadData }: { charts: ChartRecommendation[]; keyScope: string; loadData: LoadData }) {
  if (!charts || charts.length === 0)
    return <Empty title="No chart recommendations" desc="Add numeric, date, or category columns to see charts." />;

  const kpis = charts.filter((c) => c.chart_type === "kpi");
  const rest = charts.filter((c) => c.chart_type !== "kpi");

  return (
    <div className="space-y-6">
      {kpis.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((c, i) => <ChartCard key={`k${i}`} chart={c} keyScope={keyScope} loadData={loadData} />)}
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {rest.map((c, i) => <ChartCard key={`c${i}`} chart={c} keyScope={keyScope} loadData={loadData} />)}
        </div>
      )}
    </div>
  );
}
