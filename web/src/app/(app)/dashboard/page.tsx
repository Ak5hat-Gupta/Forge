"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Table2, Upload, Clock, FileSpreadsheet } from "lucide-react";
import { api } from "@/lib/api";
import { ago } from "@/lib/format";
import { Card, Stat, Empty, Spinner, Badge } from "@/components/ui";
import type { SpreadsheetListItem } from "@/lib/types";

export default function Dashboard() {
  const { data: sheets, isLoading } = useQuery<SpreadsheetListItem[]>({
    queryKey: ["spreadsheets"],
    queryFn: () => api.get("/spreadsheets").then((r) => r.data),
  });

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="h-8 w-8 text-brand" /></div>;

  const list = sheets ?? [];
  const recent = list.slice(0, 5);
  const totalRows = list.reduce((s, a) => s + a.row_count, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-ink-muted">Your spreadsheet apps at a glance</p>
        </div>
        <Link href="/spreadsheets" className="btn-primary"><Upload size={16} /> Upload Spreadsheet</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total Apps" value={list.length} sub={<span className="flex items-center gap-1"><FileSpreadsheet size={12} /> Spreadsheets uploaded</span>} />
        <Stat label="Total Rows" value={totalRows.toLocaleString()} sub="Across all spreadsheets" />
        <Stat label="Latest Upload" value={recent[0] ? ago(recent[0].created_at) : "—"} sub={recent[0]?.name ?? "No uploads yet"} />
      </div>

      {recent.length === 0 ? (
        <Empty
          icon={<Table2 size={36} />}
          title="No spreadsheets yet"
          desc="Upload a CSV or Excel file to create your first app."
          action={<Link href="/spreadsheets" className="btn-primary"><Upload size={16} /> Upload</Link>}
        />
      ) : (
        <Card>
          <h3 className="mb-4 text-sm font-semibold">Recent Spreadsheets</h3>
          <div className="space-y-2">
            {recent.map((s) => (
              <Link key={s.id} href={`/spreadsheets/${s.id}`} className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-surface-overlay/60">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={18} className="text-brand" />
                  <div><div className="text-sm font-medium">{s.name}</div><div className="text-xs text-ink-faint">{s.row_count} rows</div></div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={s.status} tone={s.status === "ready" ? "bull" : s.status === "processing" ? "warn" : "bear"} />
                  <span className="flex items-center gap-1 text-xs text-ink-faint"><Clock size={12} />{ago(s.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
