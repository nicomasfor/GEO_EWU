from __future__ import annotations

import asyncio
import json
from datetime import UTC

from geosector_api.convex_client import ConvexClient
from geosector_api.deduplication import BusinessDeduplicator
from geosector_api.models import JobLog, NormalizedBusiness, SearchJob, SearchRequest, utc_now
from geosector_api.sources import SourceRegistry


class JobService:
    def __init__(self, convex_client: ConvexClient, source_registry: SourceRegistry) -> None:
        self._convex = convex_client
        self._source_registry = source_registry
        self._jobs: dict[str, SearchJob] = {}
        self._businesses_by_job: dict[str, list[NormalizedBusiness]] = {}
        self._businesses_by_search: dict[str, list[NormalizedBusiness]] = {}
        self._logs: dict[str, list[JobLog]] = {}
        self._cancelled: set[str] = set()

    async def create_search_job(self, request: SearchRequest) -> SearchJob:
        job = SearchJob(
            location=request.location,
            sectorSlug=request.sectorSlug,
            sourceMode=request.sourceMode,
            status="pending",
            currentStep="resolving_location",
            progress=3,
        )
        self._jobs[job.id] = job
        await self.append_log(job.id, "info", "Search job accepted", {"sourceMode": request.sourceMode})
        await self._convex.mutation("jobs:createSearchJobExternal", self._serialize_job(job))
        return job

    def get_job(self, job_id: str) -> SearchJob | None:
        return self._jobs.get(job_id)

    def get_job_businesses(self, job_id: str) -> list[NormalizedBusiness] | None:
        job = self._jobs.get(job_id)
        if job is None:
            return None
        businesses = self._businesses_by_job.get(job_id)
        if businesses is not None:
            return businesses
        cached = self._businesses_by_search.get(self._search_cache_key(job))
        if cached is not None:
            self._businesses_by_job[job_id] = cached
            return cached
        return []

    def export_job_rows(self, job_id: str) -> list[dict[str, object]] | None:
        businesses = self.get_job_businesses(job_id)
        if businesses is None:
            return None

        return [
            {
                "canonicalName": business.canonicalName,
                "category": business.primaryCategory,
                "address": business.address,
                "city": business.city,
                "country": business.country,
                "phone": business.phone,
                "website": business.website,
                "email": business.email,
                "lat": business.lat,
                "lng": business.lng,
                "confidenceScore": business.confidenceScore,
                "sourceName": business.sourceName,
                "sourceExternalId": business.sourceExternalId,
            }
            for business in businesses
        ]

    async def cancel_job(self, job_id: str) -> SearchJob | None:
        job = self._jobs.get(job_id)
        if job is None:
            return None
        self._cancelled.add(job_id)
        self._update_job(job, status="cancelled", currentStep="failed", progress=job.progress)
        await self.append_log(job.id, "warning", "Search job cancelled")
        return job

    async def run_search_job(self, job_id: str) -> None:
        try:
            job = self._jobs[job_id]
            self._update_job(job, startedAt=utc_now())
            await self._progress(job, "resolving_location", 10, "Resolving location envelope")
            await asyncio.sleep(0.1)

            cached_businesses = self._businesses_by_search.get(self._search_cache_key(job))
            if cached_businesses is not None:
                self._businesses_by_job[job.id] = cached_businesses
                self._update_job(
                    job,
                    status="completed",
                    currentStep="completed",
                    progress=100,
                    totalFound=len(cached_businesses),
                    totalInserted=len(cached_businesses),
                    totalUpdated=0,
                    totalDuplicates=0,
                    finishedAt=utc_now(),
                )
                await self.append_log(job.id, "info", "Search job completed from local search cache")
                return

            connector = self._source_registry.get(job.sourceMode)
            await self._progress(job, "querying_osm", 24, f"Querying {connector.name} through source registry")
            raw_businesses = await connector.search_businesses(job.location, job.sectorSlug)
            self._update_job(job, totalFound=len(raw_businesses))

            await self._progress(job, "normalizing_entities", 58, f"Normalized {len(raw_businesses)} OSM candidates")
            await asyncio.sleep(0.1)

            await self._progress(job, "deduplicating_candidates", 74, "Deduplicating candidates")
            inserted_businesses, duplicate_count = BusinessDeduplicator().merge(raw_businesses)
            self._businesses_by_job[job.id] = inserted_businesses
            self._businesses_by_search[self._search_cache_key(job)] = inserted_businesses

            await self._progress(job, "saving_results", 90, "Saving results to local cache and Convex when configured")
            await self._persist_businesses(job, inserted_businesses)

            self._update_job(
                job,
                status="completed",
                currentStep="completed",
                progress=100,
                totalFound=len(raw_businesses),
                totalInserted=len(inserted_businesses),
                totalUpdated=0,
                totalDuplicates=duplicate_count,
                finishedAt=utc_now(),
            )
            await self.append_log(job.id, "info", "Search job completed with OpenStreetMap results")
            await self._convex.mutation("jobs:completeSearchJobExternal", self._serialize_job(job))
        except Exception as exc:
            job = self._jobs.get(job_id)
            if job is not None:
                error_message = self._public_error_message(exc)
                self._update_job(job, status="failed", currentStep="failed", errorMessage=error_message)
                await self.append_log(job.id, "error", "Search job failed", {"error": str(exc)})
                await self._convex.mutation("jobs:updateSearchJobProgressExternal", self._serialize_job(job))

    async def append_log(
        self,
        job_id: str,
        level: str,
        message: str,
        metadata: dict[str, object] | None = None,
    ) -> None:
        log = JobLog(jobId=job_id, level=level, message=message, metadata=metadata)
        self._logs.setdefault(job_id, []).append(log)
        await self._convex.mutation(
            "logs:appendJobLogExternal",
            {
                "externalJobId": job_id,
                "level": level,
                "message": message,
                "metadata": metadata,
                "createdAt": self._to_ms(log.createdAt),
            },
        )

    def _update_job(self, job: SearchJob, **changes: object) -> None:
        for key, value in changes.items():
            setattr(job, key, value)
        job.updatedAt = utc_now()
        self._jobs[job.id] = job

    async def _progress(self, job: SearchJob, step: str, progress: int, message: str) -> None:
        if job.id in self._cancelled:
            raise RuntimeError("Search job cancelled")
        self._update_job(job, status="running", currentStep=step, progress=progress)
        await self.append_log(job.id, "info", message)
        await self._convex.mutation("jobs:updateSearchJobProgressExternal", self._serialize_job(job))

    async def _persist_businesses(self, job: SearchJob, businesses: list[NormalizedBusiness]) -> None:
        for business in businesses:
            await self._convex.mutation("businesses:upsertBusinessExternal", self._serialize_business(job.id, business))
            await self._convex.mutation(
                "businesses:addBusinessSourceExternal",
                self._serialize_business_source(job.id, business),
            )

    def _serialize_job(self, job: SearchJob) -> dict[str, object]:
        payload = job.model_dump(mode="json")
        payload["createdAt"] = self._to_ms(job.createdAt)
        payload["updatedAt"] = self._to_ms(job.updatedAt)
        return payload

    def _serialize_business(self, external_job_id: str, business: NormalizedBusiness) -> dict[str, object]:
        return {
            "externalJobId": external_job_id,
            "canonicalName": business.canonicalName,
            "normalizedName": business.normalizedName,
            "sectorSlug": business.sectorSlug,
            "primaryCategory": business.primaryCategory,
            "rawCategories": business.rawCategories,
            "address": business.address,
            "city": business.city,
            "region": business.region,
            "country": business.country,
            "countryCode": business.countryCode,
            "lat": business.lat,
            "lng": business.lng,
            "phone": business.phone,
            "website": business.website,
            "email": business.email,
            "openingHours": business.openingHours,
            "osmId": business.osmId,
            "osmType": business.osmType,
            "confidenceScore": business.confidenceScore,
        }

    def _serialize_business_source(self, external_job_id: str, business: NormalizedBusiness) -> dict[str, object]:
        return {
            "externalJobId": external_job_id,
            "sourceName": business.sourceName,
            "sourceExternalId": business.sourceExternalId,
            "sourceUrl": f"https://www.openstreetmap.org/{business.sourceExternalId}",
            "rawName": business.canonicalName,
            "rawAddress": business.address,
            "rawPhone": business.phone,
            "rawWebsite": business.website,
            "rawCategories": business.rawCategories,
            "rawPayload": business.rawPayload,
            "fetchedAt": self._to_ms(utc_now()),
        }

    def _to_ms(self, value) -> int:
        return int(value.astimezone(UTC).timestamp() * 1000)

    def _search_cache_key(self, job: SearchJob) -> str:
        bbox = job.location.boundingBox.model_dump(mode="json") if job.location.boundingBox else None
        payload = {
            "sectorSlug": job.sectorSlug,
            "sourceMode": job.sourceMode,
            "locationId": job.location.id,
            "lat": round(job.location.lat, 5),
            "lng": round(job.location.lng, 5),
            "boundingBox": bbox,
        }
        return json.dumps(payload, sort_keys=True)

    def _public_error_message(self, exc: Exception) -> str:
        text = str(exc)
        if "429" in text or "Too Many Requests" in text:
            return (
                "OpenStreetMap/Overpass esta limitando peticiones ahora mismo. "
                "Espera unos minutos o configura OVERPASS_API_URLS con endpoints alternativos."
            )
        if "Selected area is too large" in text:
            return (
                "La zona seleccionada es demasiado grande para esta version inicial. "
                "Prueba con una ciudad o area menor."
            )
        return text
