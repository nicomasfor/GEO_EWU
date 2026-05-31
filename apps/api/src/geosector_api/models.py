from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field

LocationMode = Literal["cities", "countries"]
LocationType = Literal["city", "country", "address", "custom_area"]
SearchJobStatus = Literal["pending", "running", "completed", "failed", "cancelled"]
SearchStep = Literal[
    "idle",
    "resolving_location",
    "querying_osm",
    "normalizing_entities",
    "deduplicating_candidates",
    "saving_results",
    "completed",
    "failed",
]


def utc_now() -> datetime:
    return datetime.now(UTC)


class BoundingBox(BaseModel):
    south: float
    west: float
    north: float
    east: float


class LocationInput(BaseModel):
    id: str
    label: str
    type: LocationType
    country: str = ""
    countryCode: str = ""
    region: str | None = None
    city: str | None = None
    lat: float
    lng: float
    boundingBox: BoundingBox | None = None
    source: str | None = None
    raw: Any | None = None


class SectorInput(BaseModel):
    slug: str = Field(..., min_length=1)
    name: str | None = None


class SearchRequest(BaseModel):
    location: LocationInput
    sectorSlug: str = Field(..., min_length=1)
    sourceMode: Literal["osm"] = "osm"


class SearchJob(BaseModel):
    id: str = Field(default_factory=lambda: f"job_{uuid4().hex}")
    status: SearchJobStatus = "pending"
    location: LocationInput
    sectorSlug: str
    sourceMode: Literal["osm"] = "osm"
    progress: int = 0
    currentStep: SearchStep = "idle"
    totalFound: int = 0
    totalInserted: int = 0
    totalUpdated: int = 0
    totalDuplicates: int = 0
    errorMessage: str | None = None
    startedAt: datetime | None = None
    finishedAt: datetime | None = None
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)


class JobLog(BaseModel):
    jobId: str
    level: Literal["info", "warning", "error", "debug"] = "info"
    message: str
    metadata: dict[str, Any] | None = None
    createdAt: datetime = Field(default_factory=utc_now)


class OSMRawPlace(BaseModel):
    osm_id: str
    osm_type: str
    lat: float | None = None
    lng: float | None = None
    tags: dict[str, Any] = Field(default_factory=dict)
    raw: dict[str, Any] = Field(default_factory=dict)


class NormalizedBusiness(BaseModel):
    id: str = Field(default_factory=lambda: f"business_{uuid4().hex}")
    canonicalName: str
    normalizedName: str
    sectorSlug: str
    primaryCategory: str
    rawCategories: list[str] = Field(default_factory=list)
    address: str | None = None
    city: str | None = None
    region: str | None = None
    country: str | None = None
    countryCode: str | None = None
    lat: float
    lng: float
    phone: str | None = None
    website: str | None = None
    email: str | None = None
    openingHours: str | None = None
    osmId: str | None = None
    osmType: str | None = None
    confidenceScore: float = 0.0
    sourceName: Literal["OpenStreetMap"] = "OpenStreetMap"
    sourceExternalId: str
    rawPayload: dict[str, Any] = Field(default_factory=dict)


class JobBusinessesResponse(BaseModel):
    jobId: str
    businesses: list[NormalizedBusiness]
