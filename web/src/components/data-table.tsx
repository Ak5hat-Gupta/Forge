"use client";
import { useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Column, DataRow } from "@/lib/types";

interface Props {
  columns: Column[];
  rows: DataRow[];
  total: number;
  page: number;
  pages: number;
  sortBy: string | null;
  sortDir: string;
  onSort: (col: string) => void;
  onPage: (p: number) => void;
  onEdit?: (row: DataRow) => void;
  onDelete?: (row: DataRow) => void;
}

const TYPE_ALIGN: Record<string, string> = {
  integer: "text-right",
  float: "text-right",
  currency: "text-right",
};

function CellValue({ value, type }: { value: unknown; type: string }) {
  if (value === null || value === undefined) return <span className="text-ink-faint">—</span>;
  if (type === "boolean") return <span className={value ? "text-bull" : "text-bear"}>{value ? "Yes" : "No"}</span>;
  if (type === "currency") return <span className="nums">${Number(value).toLocaleString()}</span>;
  if (type === "email") return <span className="text-info">{String(value)}</span>;
  if (type === "url") return <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">{String(value).replace(/^https?:\/\//, "").slice(0, 30)}</a>;
  return <span className={TYPE_ALIGN[type] ? "nums" : ""}>{String(value)}</span>;
}

export function DataTable({ columns, rows, total, page, pages, sortBy, sortDir, onSort, onPage, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-raised/60">
              {columns.map((col) => (
                <th
                  key={col.slug}
                  className={cn("whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-muted", TYPE_ALIGN[col.inferred_type])}
                >
                  <button onClick={() => onSort(col.slug)} className="inline-flex cursor-pointer items-center gap-1 hover:text-ink">
                    {col.name}
                    <ArrowUpDown size={12} className={sortBy === col.slug ? "text-brand" : "text-ink-faint"} />
                  </button>
                </th>
              ))}
              {(onEdit || onDelete) && <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-muted">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line/50 transition-colors hover:bg-surface/40">
                {columns.map((col) => (
                  <td key={col.slug} className={cn("whitespace-nowrap px-4 py-3", TYPE_ALIGN[col.inferred_type])}>
                    <CellValue value={row.data[col.slug]} type={col.inferred_type} />
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && <button onClick={() => onEdit(row)} className="cursor-pointer rounded-lg p-1.5 text-ink-faint hover:bg-info-soft hover:text-info"><Pencil size={14} /></button>}
                      {onDelete && <button onClick={() => onDelete(row)} className="cursor-pointer rounded-lg p-1.5 text-ink-faint hover:bg-bear-soft hover:text-bear"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-sm text-ink-muted">No rows found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-line bg-surface-raised/40 px-4 py-3 text-xs text-ink-muted">
        <span>{total.toLocaleString()} row{total !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="cursor-pointer rounded-lg p-1 hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
          <span>Page {page} of {pages}</span>
          <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="cursor-pointer rounded-lg p-1 hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
