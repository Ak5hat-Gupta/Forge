"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Hammer, Search } from "lucide-react";
import { V1 } from "@/lib/api";
import { Spinner, Empty } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import type { Column, DataRow } from "@/lib/types";

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

  const handleSort = useCallback((col: string) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  }, [sortBy]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-base/70 px-4 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet/15 text-violet"><Hammer size={20} /></span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{data?.name ?? "Shared Spreadsheet"}</div>
            <div className="text-[11px] text-ink-faint">Public view · Forge</div>
          </div>
        </div>
        <a href="https://github.com/Ak5hat-Gupta/Forge" target="_blank" rel="noopener noreferrer" className="chip bg-surface-overlay text-ink-muted hover:text-violet">Made with Forge</a>
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 lg:p-8">
        {isLoading ? (
          <div className="grid min-h-[50vh] place-items-center"><Spinner className="h-8 w-8 text-violet" /></div>
        ) : isError || !data ? (
          <Empty title="Not available" desc="This shared link is invalid or has been disabled." />
        ) : (
          <div className="space-y-6 animate-in">
            <div>
              <h1 className="text-2xl font-bold">{data.name}</h1>
              <p className="text-sm text-ink-muted">{data.total} rows · {data.columns.length} columns · read-only</p>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search..."
                className="field pl-10"
              />
            </div>
            <DataTable
              columns={data.columns.sort((a, b) => a.position - b.position)}
              rows={data.rows}
              total={data.total}
              page={data.page}
              pages={data.pages}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              onPage={setPage}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-line px-4 py-4 text-center lg:px-8">
        <a href="https://github.com/Ak5hat-Gupta" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] tracking-wide text-ink-faint hover:text-violet">
          Built by Akshat Gupta
        </a>
      </footer>
    </div>
  );
}
