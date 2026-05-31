export type LocationMode = "cities" | "countries";

export type LocationType = "city" | "country" | "address" | "custom_area";

export type BoundingBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type LocationCandidate = {
  id: string;
  label: string;
  type: LocationType;
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  lat: number;
  lng: number;
  boundingBox?: BoundingBox;
  source?: string;
  raw?: unknown;
};

export type Sector = {
  slug: string;
  name: string;
  description: string;
  enabled: boolean;
  defaultCategories: string[];
};

export type SearchJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type SearchStep =
  | "idle"
  | "resolving_location"
  | "querying_osm"
  | "normalizing_entities"
  | "deduplicating_candidates"
  | "saving_results"
  | "completed"
  | "failed";

export type BusinessCategory =
  | "restaurant"
  | "cafe"
  | "bar"
  | "pub"
  | "fast_food"
  | "food_court"
  | "ice_cream"
  | "other";

export type Business = {
  id: string;
  canonicalName: string;
  sectorSlug: string;
  primaryCategory: BusinessCategory;
  rawCategories: string[];
  address?: string;
  city?: string;
  region?: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  email?: string;
  openingHours?: string;
  confidenceScore: number;
  sourceName: "OpenStreetMap";
  sourceExternalId: string;
  rawPayload?: unknown;
};

export type SearchRequest = {
  location: LocationCandidate;
  sectorSlug: string;
  sourceMode: "osm";
};

export type SearchJob = {
  id: string;
  status: SearchJobStatus;
  location: LocationCandidate;
  sectorSlug: string;
  sourceMode: "osm";
  progress: number;
  currentStep: SearchStep;
  totalFound: number;
  totalInserted: number;
  totalUpdated: number;
  totalDuplicates: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type JobBusinessesResponse = {
  jobId: string;
  businesses: Business[];
};
