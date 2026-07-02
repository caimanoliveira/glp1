"use client";

import type { ReactNode } from "react";
import type { Alert, AlertSeverity } from "@/lib/calc";

export function Card({
  title,
  children,
  className = "",
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold text-slate-700">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{children}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </header>
  );
}

// Barra de progresso de uma meta diária (proteína, líquidos, etc.)
export function GoalBar({
  label,
  value,
  target,
  unit,
  hint,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  hint?: string;
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const reached = target != null && value >= target;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={reached ? "font-semibold text-brand" : "text-slate-500"}>
          {value}
          {target != null ? ` / ${target}` : ""} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${reached ? "bg-brand" : "bg-teal-400"}`}
          style={{ width: `${target ? pct : 0}%` }}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "good" | "bad";
}) {
  const toneClass =
    tone === "good" ? "text-brand" : tone === "bad" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-0.5 text-xl font-bold ${toneClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

const ALERT_STYLES: Record<AlertSeverity, string> = {
  red: "border-red-300 bg-red-50 text-red-800",
  warn: "border-amber-300 bg-amber-50 text-amber-800",
  info: "border-sky-300 bg-sky-50 text-sky-800",
};

export function AlertBanner({ alert }: { alert: Alert }) {
  const icon = alert.severity === "red" ? "🚨" : alert.severity === "warn" ? "⚠️" : "ℹ️";
  return (
    <div className={`rounded-xl border p-3 text-sm ${ALERT_STYLES[alert.severity]}`}>
      <div className="flex items-start gap-2">
        <span aria-hidden>{icon}</span>
        <div>
          <p className="font-semibold">{alert.title}</p>
          <p className="mt-0.5 leading-snug">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40";
  const styles =
    variant === "primary"
      ? "bg-brand text-white active:bg-teal-700"
      : variant === "danger"
        ? "bg-red-50 text-red-700 active:bg-red-100"
        : "bg-slate-100 text-slate-700 active:bg-slate-200";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  unit,
  placeholder,
}: {
  label: string;
  value: number | "" | null;
  onChange: (v: number | "") => void;
  step?: number;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-brand">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none"
        />
        {unit && <span className="pr-3 text-xs text-slate-400">{unit}</span>}
      </div>
    </label>
  );
}
