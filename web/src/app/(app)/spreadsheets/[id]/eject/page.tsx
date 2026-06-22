"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, FileCode, ArrowLeft, Package } from "lucide-react";
import { api, V1, getToken } from "@/lib/api";
import { Card, Spinner, Stat } from "@/components/ui";

interface PreviewFile { path: string; content: string }
interface PreviewResponse {
  files: PreviewFile[];
  summary: { backend_files: number; frontend_files: number; total_files: number };
}

export default function EjectPage() {
  const { id } = useParams<{ id: string }>();
  const [selected, setSelected] = useState<string>("backend/main.py");

  const { data, isLoading } = useQuery<PreviewResponse>({
    queryKey: ["eject-preview", id],
    queryFn: () => api.get(`/spreadsheets/${id}/eject/preview`).then((r) => r.data),
  });

  const download = async () => {
    const r = await fetch(`${V1}/spreadsheets/${id}/eject`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forge_app_${id}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="h-8 w-8 text-violet" /></div>;
  if (!data) return null;

  const current = data.files.find((f) => f.path === selected);
  const backendFiles = data.files.filter((f) => f.path.startsWith("backend/"));
  const frontendFiles = data.files.filter((f) => f.path.startsWith("web/"));
  const rootFiles = data.files.filter((f) => !f.path.startsWith("backend/") && !f.path.startsWith("web/"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/spreadsheets/${id}`} className="mb-1 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            <ArrowLeft size={12} /> Back to spreadsheet
          </Link>
          <h2 className="text-2xl font-bold">Eject Code</h2>
          <p className="text-sm text-ink-muted">Download a standalone Next.js + FastAPI project</p>
        </div>
        <button onClick={download} className="btn-primary"><Download size={16} /> Download ZIP</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total Files" value={data.summary.total_files} sub={<span className="flex items-center gap-1"><Package size={12} /> Standalone project</span>} />
        <Stat label="Backend" value={data.summary.backend_files} sub="FastAPI + SQLAlchemy" />
        <Stat label="Frontend" value={data.summary.frontend_files} sub="Next.js + Tailwind" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="!p-3">
          <div className="space-y-3">
            <FileTree title="Root" files={rootFiles} selected={selected} onSelect={setSelected} />
            <FileTree title="backend/" files={backendFiles} selected={selected} onSelect={setSelected} />
            <FileTree title="web/" files={frontendFiles} selected={selected} onSelect={setSelected} />
          </div>
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="font-mono text-xs text-ink-muted">{current?.path}</span>
            <span className="text-[10px] uppercase tracking-wide text-ink-faint">
              {current?.content.split("\n").length ?? 0} lines
            </span>
          </div>
          <pre className="overflow-auto p-4 text-xs leading-relaxed">
            <code className="font-mono text-ink">{current?.content}</code>
          </pre>
        </Card>
      </div>
    </div>
  );
}

function FileTree({ title, files, selected, onSelect }: { title: string; files: PreviewFile[]; selected: string; onSelect: (p: string) => void }) {
  if (files.length === 0) return null;
  return (
    <div>
      <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{title}</div>
      <div className="space-y-0.5">
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => onSelect(f.path)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-mono transition-colors cursor-pointer ${
              selected === f.path
                ? "bg-violet/15 text-violet"
                : "text-ink-muted hover:bg-surface-overlay/60 hover:text-ink"
            }`}
          >
            <FileCode size={12} className="shrink-0" />
            <span className="truncate">{f.path.replace(/^(backend\/|web\/)/, "")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
