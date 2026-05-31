import { operationSteps } from "../lib/mockData";
import { useGeoStore } from "../store/useGeoStore";

export function StatusConsole() {
  const currentStep = useGeoStore((state) => state.currentStep);
  const progress = useGeoStore((state) => state.progress);

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/65 p-4 shadow-panel-glow backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Operation console</div>
          <h3 className="mt-1 text-sm font-semibold text-slate-100">Entity normalization pipeline</h3>
        </div>
        <div className="font-mono text-sm text-cyan-100">{progress}%</div>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded bg-white/10">
        <div className="h-full bg-cyan-300 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 space-y-2">
        {operationSteps.map((item) => {
          const active = item.step === currentStep;
          const complete = operationSteps.findIndex((step) => step.step === item.step) < operationSteps.findIndex((step) => step.step === currentStep);

          return (
            <div key={item.step} className="flex items-center gap-3 text-sm">
              <span className={`h-2 w-2 rounded-full ${active ? "bg-cyan-200 shadow-[0_0_14px_rgba(103,232,249,0.9)]" : complete ? "bg-emerald-300" : "bg-slate-700"}`} />
              <span className={active ? "text-cyan-100" : complete ? "text-emerald-100/80" : "text-slate-500"}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
