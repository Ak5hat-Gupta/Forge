"use client";
import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...p }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass p-5", className)} {...p}>{children}</div>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface/40 p-4">
      <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-faint">{sub}</div>}
    </div>
  );
}

export function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "bull" | "bear" | "warn" | "info" }) {
  const cls = {
    default: "bg-surface-overlay text-ink-muted",
    bull: "bg-bull-soft text-bull",
    bear: "bg-bear-soft text-bear",
    warn: "bg-warn-soft text-warn",
    info: "bg-info-soft text-info",
  }[tone];
  return <span className={cn("chip capitalize", cls)}>{label}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  return message ? (
    <div className="mb-4 rounded-xl border border-bear/40 bg-bear-soft px-4 py-3 text-sm text-bear">{message}</div>
  ) : null;
}

export function Empty({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/30 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink-faint">{icon}</div>}
      <h3 className="text-sm font-semibold">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-ink-muted">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
