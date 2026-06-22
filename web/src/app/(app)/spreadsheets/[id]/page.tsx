"use client";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Search, Plus, Download, X, BarChart3, Code2, Share2, Check, Copy } from "lucide-react";
import Link from "next/link";
import { api, apiErr } from "@/lib/api";
import { Card, ErrorNote, Spinner, Badge, Empty } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { DynamicForm } from "@/components/dynamic-form";
import type { Spreadsheet, PaginatedRows, DataRow, ChartRecommendation } from "@/lib/types";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const COLORS = ["#7C3AED", "#06B6D4", "#DB2777", "#F59E0B", "#10B981", "#6366F1", "#F43F5E", "#0EA5E9"];

const TOOLTIP_STYLE = { background: "#FFFFFF", border: "1px solid #E4DEF5", borderRadius: 12, color: "#1B1638", boxShadow: "0 12px 32px -12px rgba(76,29,149,0.25)" } as const;
const TOOLTIP_ITEM = { color: "#1B1638" } as const;
const TOOLTIP_LABEL = { color: "#5C5685", fontWeight: 600 } as const;

const PIE_RAD = Math.PI / 180;
// Dark, readable labels placed just outside the donut.
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

export default function SpreadsheetDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<DataRow | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"data" | "charts">("data");
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: sheet, isLoading: sheetLoading } = useQuery<Spreadsheet>({
    queryKey: ["spreadsheet", id],
    queryFn: () => api.get(`/spreadsheets/${id}`).then((r) => r.data),
  });

  const { data: rowsData, isLoading: rowsLoading } = useQuery<PaginatedRows>({
    queryKey: ["rows", id, page, search, sortBy, sortDir],
    queryFn: () =>
      api.get(`/spreadsheets/${id}/rows`, {
        params: { page, per_page: 25, search: search || undefined, sort_by: sortBy, sort_dir: sortDir },
      }).then((r) => r.data),
    enabled: !!sheet,
  });

  const { data: charts } = useQuery<ChartRecommendation[]>({
    queryKey: ["charts", id],
    queryFn: () => api.get(`/spreadsheets/${id}/charts/recommend`).then((r) => r.data),
    enabled: !!sheet && tab === "charts",
  });

  const createRow = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(`/spreadsheets/${id}/rows`, { data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rows", id] }); setShowForm(false); setErr(""); },
    onError: (e) => setErr(apiErr(e)),
  });

  const updateRow = useMutation({
    mutationFn: ({ rowId, data }: { rowId: number; data: Record<string, unknown> }) =>
      api.put(`/spreadsheets/${id}/rows/${rowId}`, { data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rows", id] }); setEditRow(null); setErr(""); },
    onError: (e) => setErr(apiErr(e)),
  });

  const deleteRow = useMutation({
    mutationFn: (rowId: number) => api.delete(`/spreadsheets/${id}/rows/${rowId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rows", id] }),
  });

  const share = useMutation({
    mutationFn: (enable: boolean) =>
      api.post(`/spreadsheets/${id}/share?enable=${enable}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spreadsheet", id] }),
  });

  const shareUrl = sheet?.share_token ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${sheet.share_token}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSort = useCallback((col: string) => {
    if (sortBy === col) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortBy(col); setSortDir("asc"); }
  }, [sortBy]);

  const exportCSV = () => {
    window.open(`${api.defaults.baseURL}/spreadsheets/${id}/rows/export?format=csv`, "_blank");
  };

  if (sheetLoading) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="h-8 w-8 text-violet" /></div>;
  if (!sheet) return <Empty title="Spreadsheet not found" />;

  const cols = sheet.columns.sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display">{sheet.name}</h2>
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Badge label={sheet.status} tone={sheet.status === "ready" ? "bull" : "warn"} />
            {sheet.row_count} rows · {cols.length} columns
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab(tab === "data" ? "charts" : "data")} className="btn-ghost"><BarChart3 size={16} />{tab === "data" ? "Charts" : "Data"}</button>
          <button onClick={() => setShareOpen(true)} className="btn-ghost"><Share2 size={16} /> Share</button>
          <Link href={`/spreadsheets/${id}/eject`} className="btn-ghost"><Code2 size={16} /> Eject</Link>
          <button onClick={exportCSV} className="btn-ghost"><Download size={16} /> Export</button>
          <button onClick={() => { setEditRow(null); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Row</button>
        </div>
      </div>

      <ErrorNote message={err} />

      {shareOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShareOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Share spreadsheet</h3>
              <button onClick={() => setShareOpen(false)} className="cursor-pointer rounded-lg p-1 text-ink-faint hover:text-ink"><X size={16} /></button>
            </div>
            {sheet.share_token ? (
              <div className="space-y-3">
                <p className="text-sm text-ink-muted">Anyone with this link can view a read-only copy.</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={shareUrl} className="field flex-1 font-mono text-xs" />
                  <button onClick={copyLink} className="btn-ghost shrink-0">{copied ? <Check size={16} className="text-bull" /> : <Copy size={16} />}</button>
                </div>
                <button onClick={() => share.mutate(false)} disabled={share.isPending} className="btn-ghost w-full text-bear">Disable sharing</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-ink-muted">Generate a public read-only link for this spreadsheet.</p>
                <button onClick={() => share.mutate(true)} disabled={share.isPending} className="btn-primary w-full">
                  {share.isPending ? <Spinner className="h-4 w-4" /> : <><Share2 size={16} /> Create share link</>}
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {(showForm || editRow) && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{editRow ? "Edit Row" : "New Row"}</h3>
            <button onClick={() => { setShowForm(false); setEditRow(null); }} className="cursor-pointer rounded-lg p-1 text-ink-faint hover:text-ink"><X size={16} /></button>
          </div>
          <DynamicForm
            columns={cols}
            initial={editRow?.data}
            onSubmit={async (data) => { editRow ? await updateRow.mutateAsync({ rowId: editRow.id, data }) : await createRow.mutateAsync(data); }}
            onCancel={() => { setShowForm(false); setEditRow(null); }}
            submitLabel={editRow ? "Update" : "Create"}
          />
        </Card>
      )}

      {tab === "data" ? (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search across all columns..."
              className="field pl-10"
            />
          </div>

          {rowsLoading ? (
            <div className="grid min-h-[40vh] place-items-center"><Spinner className="h-6 w-6 text-violet" /></div>
          ) : rowsData ? (
            <DataTable
              columns={cols}
              rows={rowsData.rows}
              total={rowsData.total}
              page={rowsData.page}
              pages={rowsData.pages}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              onPage={setPage}
              onEdit={(row) => { setEditRow(row); setShowForm(false); }}
              onDelete={(row) => { if (confirm("Delete this row?")) deleteRow.mutate(row.id); }}
            />
          ) : null}
        </>
      ) : (
        <ChartsDashboard spreadsheetId={id} charts={charts ?? []} />
      )}
    </div>
  );
}

function ChartsDashboard({ spreadsheetId, charts }: { spreadsheetId: string; charts: ChartRecommendation[] }) {
  if (charts.length === 0) return <Empty title="No chart recommendations" desc="Upload data with numeric and categorical columns to see charts." />;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {charts.map((c, i) => (
        <ChartCard key={i} spreadsheetId={spreadsheetId} chart={c} />
      ))}
    </div>
  );
}

function ChartCard({ spreadsheetId, chart }: { spreadsheetId: string; chart: ChartRecommendation }) {
  const { data, isLoading } = useQuery({
    queryKey: ["chart-data", spreadsheetId, chart.chart_type, chart.x_column, chart.y_column],
    queryFn: () =>
      api.get(`/spreadsheets/${spreadsheetId}/charts/data`, {
        params: { chart_type: chart.chart_type, x_column: chart.x_column, y_column: chart.y_column },
      }).then((r) => r.data),
  });

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold">{chart.title}</h3>
      {isLoading ? (
        <div className="grid h-52 place-items-center"><Spinner className="h-5 w-5 text-violet" /></div>
      ) : chart.chart_type === "kpi" ? (
        <div className="text-center">
          <div className="text-5xl font-bold font-display nums text-gradient">{data?.value?.toLocaleString?.() ?? data?.value}</div>
          {data?.label && <div className="mt-1 text-xs text-ink-muted">{data.label}</div>}
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
