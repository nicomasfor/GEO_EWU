import { FormEvent, useEffect, useMemo, useState } from "react";
import type { LocationCandidate } from "@geosector/shared";
import { Loader2, MapPin, Search, TriangleAlert } from "lucide-react";
import { searchLocations } from "../lib/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { cityLocations, countryLocations } from "../lib/mockData";
import { useGeoStore } from "../store/useGeoStore";

export function LocationSearchBar() {
  const [query, setQuery] = useState("");
  const [remoteSuggestions, setRemoteSuggestions] = useState<LocationCandidate[]>([]);
  const [status, setStatus] = useState<"idle" | "too_short" | "loading" | "ready" | "empty" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 450);
  const mode = useGeoStore((state) => state.mode);
  const selectLocation = useGeoStore((state) => state.selectLocation);
  const fallbackLocations = mode === "cities" ? cityLocations : countryLocations;

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 3) return fallbackLocations.slice(0, 4);
    if (remoteSuggestions.length > 0) return remoteSuggestions;
    if (status === "loading" || status === "error" || status === "empty") return [];
    return fallbackLocations.filter((location) => location.label.toLowerCase().includes(normalized)).slice(0, 4);
  }, [fallbackLocations, query, remoteSuggestions, status]);

  useEffect(() => {
    const normalized = debouncedQuery.trim();
    setRemoteSuggestions([]);
    setErrorMessage(null);

    if (normalized.length === 0) {
      setStatus("idle");
      return;
    }

    if (normalized.length < 3) {
      setStatus("too_short");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    searchLocations(normalized, mode, controller.signal)
      .then((locations) => {
        setRemoteSuggestions(locations);
        setStatus(locations.length > 0 ? "ready" : "empty");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Proveedor no disponible");
      });

    return () => controller.abort();
  }, [debouncedQuery, mode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (suggestions[0]) {
      selectLocation(suggestions[0]);
      setQuery(suggestions[0].label);
    }
  }

  return (
    <div className="group relative w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="flex items-center rounded-md border border-cyan-200/20 bg-slate-950/70 p-2 shadow-panel-glow backdrop-blur-xl">
        <Search className="ml-3 h-5 w-5 text-cyan-100/70" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={mode === "cities" ? "Buscar ciudad: Alicante, Espana" : "Buscar pais: Espana"}
          className="min-h-12 flex-1 bg-transparent px-4 text-base text-slate-100 outline-none placeholder:text-slate-500"
        />
        {status === "loading" && <Loader2 className="mr-3 h-4 w-4 animate-spin text-cyan-100/70" />}
        <button
          type="submit"
          className="rounded bg-cyan-300/12 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/18"
        >
          Resolver
        </button>
      </form>

      <div className="absolute left-0 right-0 z-20 mt-2 grid gap-2">
        {status === "too_short" && (
          <div className="rounded-md border border-amber-200/15 bg-slate-950/78 px-4 py-3 text-sm text-amber-100/80 shadow-panel-glow backdrop-blur-xl">
            Escribe al menos 3 caracteres para consultar Nominatim.
          </div>
        )}
        {status === "empty" && (
          <div className="rounded-md border border-white/10 bg-slate-950/78 px-4 py-3 text-sm text-slate-400 shadow-panel-glow backdrop-blur-xl">
            Sin resultados para esta busqueda.
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-md border border-red-300/15 bg-slate-950/78 px-4 py-3 text-sm text-red-100/80 shadow-panel-glow backdrop-blur-xl">
            <TriangleAlert className="h-4 w-4" />
            {errorMessage}
          </div>
        )}
        {suggestions.map((location) => (
          <button
            type="button"
            key={location.id}
            onClick={() => {
              selectLocation(location);
              setQuery(location.label);
            }}
            className="flex items-center justify-between rounded-md border border-white/10 bg-slate-950/78 px-4 py-3 text-left text-sm text-slate-200 opacity-0 shadow-panel-glow backdrop-blur-xl transition hover:border-cyan-200/30 hover:bg-slate-900/90 group-focus-within:opacity-100"
          >
            <span className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-cyan-200" />
              <span>
                <span className="block font-medium">{location.label}</span>
                <span className="block font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{location.type}</span>
              </span>
            </span>
            <span className="font-mono text-xs text-slate-500">
              {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
