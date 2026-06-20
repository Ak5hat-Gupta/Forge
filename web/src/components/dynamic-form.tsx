"use client";
import { useState } from "react";
import type { Column } from "@/lib/types";
import { Spinner } from "./ui";

interface Props {
  columns: Column[];
  initial?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function DynamicForm({ columns, initial, onSubmit, onCancel, submitLabel = "Save" }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(initial ?? {});
  const [loading, setLoading] = useState(false);

  const set = (slug: string, val: unknown) => setValues((prev) => ({ ...prev, [slug]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await onSubmit(values); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {columns.map((col) => (
        <div key={col.slug}>
          <label className="lbl">{col.name}</label>
          {col.inferred_type === "boolean" ? (
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={!!values[col.slug]} onChange={(e) => set(col.slug, e.target.checked)} className="h-4 w-4 rounded border-line bg-surface accent-brand" />
              <span className="text-sm text-ink-muted">{values[col.slug] ? "Yes" : "No"}</span>
            </label>
          ) : col.inferred_type === "enum" && col.enum_values ? (
            <select value={String(values[col.slug] ?? "")} onChange={(e) => set(col.slug, e.target.value)} className="field">
              <option value="">Select...</option>
              {col.enum_values.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          ) : col.inferred_type === "date" ? (
            <input type="date" value={String(values[col.slug] ?? "")} onChange={(e) => set(col.slug, e.target.value)} className="field" />
          ) : col.inferred_type === "email" ? (
            <input type="email" value={String(values[col.slug] ?? "")} onChange={(e) => set(col.slug, e.target.value)} className="field" placeholder={col.name} />
          ) : col.inferred_type === "url" ? (
            <input type="url" value={String(values[col.slug] ?? "")} onChange={(e) => set(col.slug, e.target.value)} className="field" placeholder="https://" />
          ) : col.inferred_type === "integer" ? (
            <input type="number" step="1" value={String(values[col.slug] ?? "")} onChange={(e) => set(col.slug, e.target.value === "" ? null : parseInt(e.target.value))} className="field" />
          ) : col.inferred_type === "float" || col.inferred_type === "currency" ? (
            <input type="number" step="0.01" value={String(values[col.slug] ?? "")} onChange={(e) => set(col.slug, e.target.value === "" ? null : parseFloat(e.target.value))} className="field" />
          ) : (
            <input type="text" value={String(values[col.slug] ?? "")} onChange={(e) => set(col.slug, e.target.value)} className="field" placeholder={col.name} />
          )}
        </div>
      ))}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">{loading ? "Cancel" : "Cancel"}</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? <Spinner className="h-4 w-4" /> : submitLabel}</button>
      </div>
    </form>
  );
}
