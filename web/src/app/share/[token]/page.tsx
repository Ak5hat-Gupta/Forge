"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Hammer, Search, LayoutDashboard, Table2 } from "lucide-react";
import { V1 } from "@/lib/api";
import { Spinner, Empty } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ChartGrid } from "@/components/charts";
import type { Column, DataRow, ChartRecommendation } from "@/lib/types";

interface PublicRows {
  rows: DataRow[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  columns: Column[];
  name: string;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState("asc");

  const { data, isLoading, isError } = useQuery<PublicRows>({
    queryKey: ["public", token, page, search, sortBy, sortDir],
    queryFn: () =>
      fetch(
        `${V1}/public/${token}/rows?page=${page}&per_page=25&search=${encodeURIComponent(search)}` +
          (sortBy ? `&sort_by=${sortBy}&sort_dir=${sortDir}` : "")
      ).then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      }),
  });

  const { data: charts } = useQuery<ChartRecommendation[]>({
    queryKey: ["public-charts", token],
    queryFn: () => fetch(`${V1}/public/${token}/charts/recommend`).then((r) => (r.ok ? r.json() : [])),
    enabled: !isError,
  });

  const loadChart = useCallback((c: ChartRecommendation) => {
    const p = new URLSearchParams({ chart_type: c.chart_type });
    if (c.x_column) p.set("x_column", c.x_column);
    if (c.y_column) p.set("y_column", c.y_column);
    return fetch(`${V1}/public/${token}/charts/data?${p.toString()}`).then((r) => r.json());
  }, [token]);

  const handleSort = useCallback((col: string) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  }, [sortBy]);

  const cols = (data?.columns ?? []).slice().sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-canvas/70 px-4 backdrop-blur-2xl lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand via-magenta to-violet text-white shadow-[0_4px_20px_-4px_rgba(219,39,119,0.6)]"><Hammer size={18} /></span>
          <div className="leading-tight">
            <div className="text-sm font-semibold font-display">{data?.name ?? "Shared Dashboard"}</div>
            <div className="text-[11px] text-ink-faint">Public dashboard · read-only</div>
          </div>
        </div>
        <a href="https://github.com/Ak5hat-Gupta/Forge" target="_blank" rel="noopener noreferrer" className="chip border border-violet/40 bg-violet/10 text-violet">Made with Forge</a>
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 lg:p-8">
        {isLoading ? (
          <div className="grid min-h-[50vh] place-items-center"><Spinner className="h-9 w-9 text-violet" /></div>
        ) : isError || !data ? (
          <Empty title="Dashboard not available" desc="This shared link is invalid or has been turned off." />
        ) : (
          <div className="space-y-8 animate-in">
            <div>
              <h1 className="text-3xl font-bold font-display">{data.name}</h1>
              <p className="text-sm text-ink-muted">{data.total.toLocaleString()} rows · {cols.length} columns · live read-only dashboard</p>
            </div>

            {charts && charts.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-muted"><LayoutDashboard size={15} className="text-violet" /> Overview</h2>
                <ChartGrid charts={charts} keyScope={`public-${token}`} loadData={loadChart} />
              </section>
            )}

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-muted"><Table2 size={15} className="text-cyan" /> Data</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…" className="field pl-10" />
              </div>
              <DataTable
                columns={cols}
                rows={data.rows}
                total={data.total}
                page={data.page}
                pages={data.pages}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={handleSort}
                onPage={setPage}
              />
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-line px-4 py-5 text-center lg:px-8">
        <a href="https://github.com/Ak5hat-Gupta" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] tracking-wide text-ink-faint hover:text-violet transition-colors">
          Built by Akshat Gupta
        </a>
      </footer>
    </div>
  );
}
