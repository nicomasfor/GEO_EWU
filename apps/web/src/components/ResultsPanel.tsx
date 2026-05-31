import { Download, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Business } from "@geosector/shared";
import { exportBusinessesCsv, exportBusinessesJson } from "../lib/export";
import { useGeoStore } from "../store/useGeoStore";
import { BusinessDetail } from "./BusinessDetail";
import { BusinessCard } from "./BusinessCard";
import { MetricBadge } from "./MetricBadge";

type SortKey = "confidence" | "name" | "category";

function categoryOptions(businesses: Business[]) {
  return Array.from(new Set(businesses.map((business) => business.primaryCategory))).sort();
}

export function ResultsPanel() {
  const businesses = useGeoStore((state) => state.businesses);
  const selectedBusiness = useGeoStore((state) => state.selectedBusiness);
  const selectBusiness = useGeoStore((state) => state.selectBusiness);
  const status = useGeoStore((state) => state.status);
  const activeJobId = useGeoStore((state) => state.activeJobId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [onlyWebsite, setOnlyWebsite] = useState(false);
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("confidence");

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return businesses
      .filter((business) => {
        if (normalizedQuery && !business.canonicalName.toLowerCase().includes(normalizedQuery)) return false;
        if (category !== "all" && business.primaryCategory !== category) return false;
        if (onlyPhone && !business.phone) return false;
        if (onlyWebsite && !business.website) return false;
        if (onlyEmail && !business.email) return false;
        if (business.confidenceScore < minConfidence / 100) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortKey === "name") return a.canonicalName.localeCompare(b.canonicalName);
        if (sortKey === "category") return a.primaryCategory.localeCompare(b.primaryCategory);
        return b.confidenceScore - a.confidenceScore;
      });
  }, [businesses, category, minConfidence, onlyEmail, onlyPhone, onlyWebsite, query, sortKey]);

  const averageConfidence = businesses.length
    ? Math.round((businesses.reduce((sum, business) => sum + business.confidenceScore, 0) / businesses.length) * 100)
    : 0;
  const visibleBusinesses = filteredBusinesses.slice(0, 300);

  return (
    <aside className="max-h-[calc(100vh-120px)] overflow-hidden rounded-lg border border-white/10 bg-slate-950/72 p-4 shadow-panel-glow backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-cyan-100" />
          <h2 className="text-sm font-semibold text-slate-100">Resultados</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={filteredBusinesses.length === 0}
            onClick={() => exportBusinessesCsv(filteredBusinesses, activeJobId)}
            className="rounded border border-white/10 p-2 text-slate-300 hover:border-cyan-200/30 disabled:opacity-40"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={filteredBusinesses.length === 0}
            onClick={() => exportBusinessesJson(filteredBusinesses, activeJobId)}
            className="rounded border border-white/10 px-2 py-1 font-mono text-xs text-slate-300 hover:border-cyan-200/30 disabled:opacity-40"
            title="Exportar JSON"
          >
            JSON
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricBadge label="Detectados" value={businesses.length || (status === "running" ? "..." : 0)} />
        <MetricBadge label="Fuente" value="OSM" tone="green" />
        <MetricBadge label="Filtrados" value={filteredBusinesses.length} tone="amber" />
        <MetricBadge label="Confianza" value={`${averageConfidence}%`} />
      </div>

      <div className="mt-4 grid gap-2">
        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar por nombre"
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            <option value="all">Todas</option>
            {categoryOptions(businesses).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            <option value="confidence">Confianza</option>
            <option value="name">Nombre</option>
            <option value="category">Categoria</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
          <label className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-2 py-2">
            <input type="checkbox" checked={onlyPhone} onChange={(event) => setOnlyPhone(event.target.checked)} />
            Telefono
          </label>
          <label className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-2 py-2">
            <input type="checkbox" checked={onlyWebsite} onChange={(event) => setOnlyWebsite(event.target.checked)} />
            Web
          </label>
          <label className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-2 py-2">
            <input type="checkbox" checked={onlyEmail} onChange={(event) => setOnlyEmail(event.target.checked)} />
            Email
          </label>
        </div>
        <label className="grid gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
          Confianza minima {minConfidence}%
          <input type="range" min="0" max="100" step="5" value={minConfidence} onChange={(event) => setMinConfidence(Number(event.target.value))} />
        </label>
      </div>

      <div className="mt-4 max-h-[42vh] space-y-3 overflow-auto pr-1">
        {businesses.length === 0 && status === "running" ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-md border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
            Los resultados apareceran aqui al completar la exploracion.
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
            No hay negocios con los filtros activos.
          </div>
        ) : (
          visibleBusinesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              active={selectedBusiness?.id === business.id}
              onSelect={selectBusiness}
            />
          ))
        )}
        {filteredBusinesses.length > visibleBusinesses.length && (
          <div className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-3 text-center font-mono text-xs uppercase tracking-[0.14em] text-slate-500">
            Mostrando 300 de {filteredBusinesses.length}. Afina filtros para reducir el panel.
          </div>
        )}
      </div>

      {selectedBusiness && (
        <div className="mt-4 max-h-[32vh] overflow-auto pr-1">
          <BusinessDetail business={selectedBusiness} />
        </div>
      )}
    </aside>
  );
}
