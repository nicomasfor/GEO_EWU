import { create } from "zustand";
import type { Business, LocationCandidate, LocationMode, SearchJob, SearchJobStatus, SearchStep } from "@geosector/shared";
import { createSearchJob, getJobBusinesses, getSearchJob } from "../lib/api";
import { sectors } from "../lib/mockData";

type GeoState = {
  mode: LocationMode;
  selectedLocation: LocationCandidate | null;
  selectedSectorSlug: string;
  status: SearchJobStatus;
  currentStep: SearchStep;
  progress: number;
  businesses: Business[];
  selectedBusiness: Business | null;
  activeJobId: string | null;
  errorMessage: string | null;
  setMode: (mode: LocationMode) => void;
  selectLocation: (location: LocationCandidate) => void;
  selectSector: (slug: string) => void;
  selectBusiness: (business: Business | null) => void;
  startSearch: () => Promise<void>;
};

function applyJobState(job: SearchJob) {
  return {
    activeJobId: job.id,
    status: job.status,
    currentStep: job.currentStep,
    progress: job.progress,
    errorMessage: job.errorMessage ?? null,
  };
}

async function readBusinessesWithRetry(job: SearchJob): Promise<Business[]> {
  const expectedResults = job.totalInserted > 0 || job.totalFound > 0;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const businesses = await getJobBusinesses(job.id);
    if (businesses.length > 0 || !expectedResults) {
      return businesses;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 500 + attempt * 250));
  }

  return getJobBusinesses(job.id);
}

export const useGeoStore = create<GeoState>((set) => ({
  mode: "cities",
  selectedLocation: null,
  selectedSectorSlug: sectors[0].slug,
  status: "pending",
  currentStep: "idle",
  progress: 0,
  businesses: [],
  selectedBusiness: null,
  activeJobId: null,
  errorMessage: null,
  setMode: (mode) => set({ mode }),
  selectLocation: (location) => set({ selectedLocation: location, selectedBusiness: null }),
  selectSector: (slug) => set({ selectedSectorSlug: slug }),
  selectBusiness: (business) => set({ selectedBusiness: business }),
  startSearch: async () => {
    const state = useGeoStore.getState();
    if (!state.selectedLocation) return;

    set({
      status: "running",
      currentStep: "resolving_location",
      progress: 5,
      businesses: [],
      selectedBusiness: null,
      errorMessage: null,
    });

    try {
      const createdJob = await createSearchJob({
        location: state.selectedLocation,
        sectorSlug: state.selectedSectorSlug,
        sourceMode: "osm",
      });

      set(applyJobState(createdJob));

      const poll = async () => {
        const jobId = useGeoStore.getState().activeJobId;
        if (!jobId) return;

        const job = await getSearchJob(jobId);
        const nextState = applyJobState(job);
        if (job.status === "completed") {
          try {
            const businesses = await readBusinessesWithRetry(job);
            set({
              ...nextState,
              businesses,
              errorMessage:
                businesses.length === 0 && (job.totalInserted > 0 || job.totalFound > 0)
                  ? "El job termino, pero los resultados aun no estan disponibles. Reintenta la busqueda."
                  : null,
            });
          } catch (error) {
            set({
              ...nextState,
              businesses: [],
              errorMessage: error instanceof Error ? error.message : "No se pudieron leer los resultados",
            });
          }
        } else {
          set(nextState);
        }

        if (job.status === "running" || job.status === "pending") {
          window.setTimeout(poll, 700);
        }
      };

      window.setTimeout(poll, 700);
    } catch (error) {
      set({
        status: "failed",
        currentStep: "failed",
        progress: 0,
        errorMessage: error instanceof Error ? error.message : "No se pudo crear el job",
      });
    }
  },
}));
