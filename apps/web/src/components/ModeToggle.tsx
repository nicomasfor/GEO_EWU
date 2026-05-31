import type { LocationMode } from "@geosector/shared";
import { Building2, Globe2 } from "lucide-react";
import { useGeoStore } from "../store/useGeoStore";

const options: Array<{ mode: LocationMode; label: string; icon: typeof Building2 }> = [
  { mode: "cities", label: "Ciudades", icon: Building2 },
  { mode: "countries", label: "Paises", icon: Globe2 },
];

export function ModeToggle() {
  const mode = useGeoStore((state) => state.mode);
  const setMode = useGeoStore((state) => state.setMode);

  return (
    <div className="inline-flex rounded-md border border-white/10 bg-white/[0.04] p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = mode === option.mode;

        return (
          <button
            key={option.mode}
            type="button"
            onClick={() => setMode(option.mode)}
            className={`flex min-w-28 items-center justify-center gap-2 rounded px-3 py-2 text-sm transition ${
              active ? "bg-cyan-300/12 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.14)]" : "text-slate-400 hover:text-slate-100"
            }`}
            title={`Modo ${option.label}`}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
