import type { Business, JobBusinessesResponse, LocationCandidate, LocationMode, SearchJob, SearchRequest } from "@geosector/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
export const apiOrigin = apiBaseUrl;

export async function searchLocations(query: string, mode: LocationMode, signal?: AbortSignal): Promise<LocationCandidate[]> {
  const params = new URLSearchParams({ q: query, mode });
  const response = await fetch(`${apiBaseUrl}/locations/search?${params.toString()}`, { signal });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Location provider unavailable");
  }

  return response.json();
}

export async function createSearchJob(request: SearchRequest): Promise<SearchJob> {
  const response = await fetch(`${apiBaseUrl}/jobs/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to create search job");
  }

  return response.json();
}

export async function getSearchJob(jobId: string): Promise<SearchJob> {
  const response = await fetch(`${apiBaseUrl}/jobs/${jobId}`);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to read search job");
  }

  return response.json();
}

export async function getJobBusinesses(jobId: string): Promise<Business[]> {
  const response = await fetch(`${apiBaseUrl}/jobs/${jobId}/businesses`);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to read job businesses");
  }

  const payload = (await response.json()) as JobBusinessesResponse;
  return payload.businesses;
}
