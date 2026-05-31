import { Play, ShieldCheck } from "lucide-react";
import { useGeoStore } from "../store/useGeoStore";
import { SectorSelector } from "./SectorSelector";
import { StatusConsole } from "./StatusConsole";

export function OperationPanel() {
  const selectedLocation = useGeoStore((state) => state.selectedLocation);
  const startSearch = useGeoStore((state) => state.startSearch);
  const status = useGeoStore((state) => state.status);
  const errorMessage = useGeoStore((state) => state.errorMessage);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-white/10 bg-slate-950/68 p-4 shadow-panel-glow backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
              Source correlation scan
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {selectedLocation ? `Zona activa: ${selectedLocation.label}` : "Selecciona una ubicacion para habilitar la exploracion."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SectorSelector />
            <button
              type="button"
              disabled={!selectedLocation || status === "running"}
              onClick={() => void startSearch()}
              className="inline-flex items-center justify-center gap-2 rounded bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
            >
              <Play className="h-4 w-4" />
              Iniciar exploracion
            </button>
          </div>
        </div>
      </div>
      {errorMessage && (
        <div className="rounded-md border border-red-300/15 bg-red-950/30 px-4 py-3 text-sm text-red-100">{errorMessage}</div>
      )}
      <StatusConsole />
    </div>
  );
}
