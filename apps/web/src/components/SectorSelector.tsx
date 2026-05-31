import { Utensils } from "lucide-react";
import { sectors } from "../lib/mockData";
import { useGeoStore } from "../store/useGeoStore";

export function SectorSelector() {
  const selectedSectorSlug = useGeoStore((state) => state.selectedSectorSlug);
  const selectSector = useGeoStore((state) => state.selectSector);

  return (
    <label className="flex min-w-56 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3">
      <Utensils className="h-4 w-4 text-emerald-200" />
      <span className="sr-only">Sector</span>
      <select
        value={selectedSectorSlug}
        onChange={(event) => selectSector(event.target.value)}
        className="w-full bg-transparent text-sm font-medium text-slate-100 outline-none"
      >
        {sectors.map((sector) => (
          <option key={sector.slug} value={sector.slug} className="bg-slate-950">
            {sector.name}
          </option>
        ))}
      </select>
    </label>
  );
}
