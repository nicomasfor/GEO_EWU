import type { ReactNode } from "react";

type MetricBadgeProps = {
  label: string;
  value: ReactNode;
  tone?: "cyan" | "green" | "amber";
};

const toneClass = {
  cyan: "border-cyan-300/20 text-cyan-100",
  green: "border-emerald-300/20 text-emerald-100",
  amber: "border-amber-300/20 text-amber-100",
};

export function MetricBadge({ label, value, tone = "cyan" }: MetricBadgeProps) {
  return (
    <div className={`rounded-md border bg-white/[0.035] px-3 py-2 ${toneClass[tone]}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
