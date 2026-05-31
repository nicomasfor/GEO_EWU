import { Copy, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { Business } from "@geosector/shared";

type BusinessDetailProps = {
  business: Business;
};

export function BusinessDetail({ business }: BusinessDetailProps) {
  const osmUrl = `https://www.openstreetmap.org/${business.sourceExternalId}`;
  const summary = [
    business.canonicalName,
    business.primaryCategory,
    business.address,
    business.city,
    business.phone,
    business.website,
    `${business.lat}, ${business.lng}`,
    business.sourceExternalId,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="rounded-md border border-emerald-200/15 bg-emerald-300/[0.055] p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">Ficha</div>
      <h3 className="mt-2 text-base font-semibold text-slate-50">{business.canonicalName}</h3>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{business.primaryCategory}</div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
          <span>{business.address ?? "Direccion no disponible"}</span>
        </p>
        {business.phone && (
          <p className="flex gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
            <span>{business.phone}</span>
          </p>
        )}
        {business.email && (
          <p className="flex gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
            <span>{business.email}</span>
          </p>
        )}
        {business.website && (
          <a href={business.website} target="_blank" rel="noreferrer" className="flex gap-2 text-cyan-100 hover:text-cyan-50">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="truncate">{business.website}</span>
          </a>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs text-slate-400">
        <span>{business.lat.toFixed(5)}</span>
        <span>{business.lng.toFixed(5)}</span>
        <span>{Math.round(business.confidenceScore * 100)}% confidence</span>
        <a href={osmUrl} target="_blank" rel="noreferrer" className="text-cyan-100 hover:text-cyan-50">
          {business.sourceExternalId}
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {business.phone && (
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(business.phone ?? "")}
            className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200 hover:border-cyan-200/30"
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar telefono
          </button>
        )}
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(summary)}
          className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200 hover:border-cyan-200/30"
        >
          <Copy className="h-3.5 w-3.5" />
          Copiar ficha
        </button>
      </div>

      <details className="mt-4 rounded border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Raw source</summary>
        <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap text-xs text-slate-400">
          {JSON.stringify(business.rawPayload ?? {}, null, 2)}
        </pre>
      </details>
    </div>
  );
}
