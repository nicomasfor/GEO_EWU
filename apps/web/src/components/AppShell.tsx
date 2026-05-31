import { motion } from "framer-motion";
import { Activity, RadioTower } from "lucide-react";
import { GlobeViewport } from "./GlobeViewport";
import { LocationSearchBar } from "./LocationSearchBar";
import { ModeToggle } from "./ModeToggle";
import { OperationPanel } from "./OperationPanel";
import { ResultsPanel } from "./ResultsPanel";

export function AppShell() {
  return (
    <div className="min-h-screen overflow-hidden bg-obsidian text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(45,212,191,0.15),transparent_30%),radial-gradient(circle_at_15%_40%,rgba(56,189,248,0.12),transparent_25%),linear-gradient(180deg,rgba(6,10,18,0)_0%,#05070d_86%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <header className="relative z-10 border-b border-white/8 bg-black/18 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-200/20 bg-cyan-200/10">
              <RadioTower className="h-4 w-4 text-cyan-100" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-100">GeoSector Intelligence</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">OSM acquisition layer</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 font-mono text-xs text-emerald-200/80 sm:flex">
            <Activity className="h-4 w-4" />
            local phase 02
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1500px] gap-5 px-5 py-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="grid gap-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center gap-4 pt-3 text-center"
          >
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-100/70">Massive business discovery</div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-slate-50 md:text-5xl">
              Exploracion geoespacial de hosteleria por zona
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              Selecciona ciudad o pais, activa el sector y prepara la adquisicion desde OpenStreetMap con trazabilidad de fuente.
            </p>
            <div className="flex w-full flex-col items-center justify-center gap-3 md:flex-row">
              <LocationSearchBar />
              <ModeToggle />
            </div>
          </motion.div>

          <GlobeViewport />
          <OperationPanel />
        </section>

        <ResultsPanel />
      </main>

      <footer className="relative z-10 mx-auto flex max-w-[1500px] items-center justify-between px-5 pb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">
        <span>Hosted Convex ready</span>
        <span>OpenStreetMap only · no Google Maps</span>
      </footer>
    </div>
  );
}
