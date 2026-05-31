import { ExternalLink, Mail, Phone } from "lucide-react";
import type { Business } from "@geosector/shared";

type BusinessCardProps = {
  business: Business;
  active: boolean;
  onSelect: (business: Business) => void;
};

export function BusinessCard({ business, active, onSelect }: BusinessCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(business)}
      className={`w-full rounded-md border p-3 text-left transition ${
        active ? "border-cyan-200/35 bg-cyan-300/10" : "border-white/10 bg-white/[0.035] hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{business.canonicalName}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{business.primaryCategory}</div>
        </div>
        <div className="font-mono text-xs text-emerald-200">{Math.round(business.confidenceScore * 100)}%</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
        {business.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {business.phone}
          </span>
        )}
        {business.website && (
          <span className="inline-flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            web
          </span>
        )}
        {business.email && (
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3" />
            email
          </span>
        )}
      </div>
    </button>
  );
}
