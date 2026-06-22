"use client";
import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...p }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass p-5", className)} {...p}>{children}</div>;
}

const ACCENTS: Record<string, { text: string; ring: string; glow: string; bar: string }> = {
  violet: { text: "text-violet", ring: "border-violet/40", glow: "hover:shadow-glow-violet", bar: "from-violet to-indigo" },
  cyan: { text: "text-cyan", ring: "border-cyan/40", glow: "hover:shadow-glow-cyan", bar: "from-cyan to-info" },
  magenta: { text: "text-magenta", ring: "border-magenta/40", glow: "hover:shadow-glow-magenta", bar: "from-magenta to-violet" },
  brand: { text: "text-brand", ring: "border-brand/40", glow: "hover:shadow-glow-brand", bar: "from-brand to-magenta" },
};

export function Stat({ label, value, sub, accent = "violet", icon }: {
  label: string; value: ReactNode; sub?: ReactNode;
  accent?: "violet" | "cyan" | "magenta" | "brand"; icon?: ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border bg-surface-raised/60 p-5 backdrop-blur-xl transition-all duration-300", a.ring, a.glow)}>
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", a.bar)} />
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</div>
        {icon && <div className={cn("opacity-70", a.text)}>{icon}</div>}
      </div>
      <div className={cn("mt-2 text-3xl font-bold font-display nums", a.text)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-faint">{sub}</div>}
    </div>
  );
}

export function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "bull" | "bear" | "warn" | "info" | "violet" }) {
  const cls = {
    default: "bg-surface-overlay text-ink-muted",
    bull: "bg-bull-soft text-bull",
    bear: "bg-bear-soft text-bear",
    warn: "bg-warn-soft text-warn",
    info: "bg-info-soft text-info",
    violet: "bg-violet/15 text-violet",
  }[tone];
  return <span className={cn("chip capitalize", cls)}>{label}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="spin-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="url(#spin-grad)" strokeWidth="3" strokeLinecap="round" />
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
      {icon && <div className="mb-3 text-violet/70">{icon}</div>}
      <h3 className="text-base font-semibold font-display">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-ink-muted">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
