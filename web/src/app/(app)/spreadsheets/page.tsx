"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FileSpreadsheet, Clock, Trash2 } from "lucide-react";
import { api, apiErr } from "@/lib/api";
import { ago } from "@/lib/format";
import { Badge, Empty, ErrorNote, Spinner } from "@/components/ui";
import { UploadZone } from "@/components/upload-zone";
import type { SpreadsheetListItem, Spreadsheet } from "@/lib/types";

export default function Spreadsheets() {
  const qc = useQueryClient();
  const [err, setErr] = useState("");

  const { data: sheets, isLoading } = useQuery<SpreadsheetListItem[]>({
    queryKey: ["spreadsheets"],
    queryFn: () => api.get("/spreadsheets").then((r) => r.data),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post<Spreadsheet>("/spreadsheets/upload", fd).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spreadsheets"] });
      setErr("");
    },
    onError: (e) => setErr(apiErr(e, "Upload failed")),
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/spreadsheets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spreadsheets"] }),
  });

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="h-8 w-8 text-violet" /></div>;

  const list = sheets ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-display">Spreadsheets</h2>
        <p className="text-sm text-ink-muted">Upload and manage your data</p>
      </div>

      <ErrorNote message={err} />
      <UploadZone onFile={(f) => upload.mutate(f)} loading={upload.isPending} />

      {list.length === 0 ? (
        <Empty icon={<FileSpreadsheet size={36} />} title="No spreadsheets yet" desc="Upload a file above to get started." />
      ) : (
        <div className="space-y-2">
          {list.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-line bg-surface-raised/50 px-4 py-3 transition-colors hover:bg-surface-overlay/60">
              <Link href={`/spreadsheets/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <FileSpreadsheet size={18} className="shrink-0 text-violet" />
                <div className="min-w-0"><div className="truncate text-sm font-medium">{s.name}</div><div className="text-xs text-ink-faint">{s.row_count} rows</div></div>
              </Link>
              <div className="flex items-center gap-3">
                <Badge label={s.status} tone={s.status === "ready" ? "bull" : s.status === "processing" ? "warn" : "bear"} />
                <span className="hidden items-center gap-1 text-xs text-ink-faint sm:flex"><Clock size={12} />{ago(s.created_at)}</span>
                <button onClick={() => { if (confirm("Delete this spreadsheet?")) del.mutate(s.id); }} className="cursor-pointer rounded-lg p-1.5 text-ink-faint hover:bg-bear-soft hover:text-bear"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
