"use client";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Search, Plus, Download, X, BarChart3, Code2, Share2, Check, Copy } from "lucide-react";
import Link from "next/link";
import { api, apiErr } from "@/lib/api";
import { ErrorNote, Spinner, Badge, Empty, Card } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { DynamicForm } from "@/components/dynamic-form";
import { ChartGrid } from "@/components/charts";
import type { Spreadsheet, PaginatedRows, DataRow, ChartRecommendation } from "@/lib/types";

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
                <p className="text-sm text-ink-muted">Anyone with this link gets a live, read-only <span className="font-semibold text-violet">dashboard</span> — KPIs, charts, and searchable data. No login needed.</p>
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
        <ChartGrid
          charts={charts ?? []}
          keyScope={id}
          loadData={(c) => api.get(`/spreadsheets/${id}/charts/data`, { params: { chart_type: c.chart_type, x_column: c.x_column, y_column: c.y_column } }).then((r) => r.data)}
        />
      )}
    </div>
  );
}

