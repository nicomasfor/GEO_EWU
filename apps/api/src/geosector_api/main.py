import csv
import io
import json

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from httpx import HTTPError

from geosector_api.config import get_settings
from geosector_api.convex_client import ConvexClient
from geosector_api.geocoding import NominatimClient
from geosector_api.jobs import JobService
from geosector_api.models import JobBusinessesResponse, LocationInput, LocationMode, SearchJob, SearchRequest
from geosector_api.osm_client import OverpassClient
from geosector_api.sources import SourceRegistry
from geosector_api.sources.osm import OSMConnector

app = FastAPI(
    title="GeoSector Intelligence API",
    version="0.1.0",
    description="Auxiliary backend for geospatial search jobs and source connectors.",
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

convex_client = ConvexClient(settings.convex_url, settings.convex_admin_key)
nominatim_client = NominatimClient()
overpass_client = OverpassClient(
    settings.overpass_api_url,
    api_urls=settings.overpass_api_urls,
    tile_delay_seconds=settings.overpass_tile_delay_seconds,
    max_retries=settings.overpass_max_retries,
)
source_registry = SourceRegistry([OSMConnector(overpass_client)])
job_service = JobService(convex_client, source_registry)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}


@app.get("/locations/search", response_model=list[LocationInput])
async def search_locations(
    q: str = Query(..., min_length=3, max_length=160),
    mode: LocationMode = "cities",
) -> list[LocationInput]:
    try:
        return await nominatim_client.search(q, mode)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail="Nominatim provider unavailable") from exc


@app.post("/jobs/search", response_model=SearchJob, status_code=202)
async def create_search_job(request: SearchRequest, background_tasks: BackgroundTasks) -> SearchJob:
    job = await job_service.create_search_job(request)
    background_tasks.add_task(job_service.run_search_job, job.id)
    return job


@app.get("/jobs/{job_id}", response_model=SearchJob)
async def get_search_job(job_id: str) -> SearchJob:
    job = job_service.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Search job not found")
    return job


@app.get("/jobs/{job_id}/businesses", response_model=JobBusinessesResponse)
async def get_search_job_businesses(job_id: str) -> JobBusinessesResponse:
    businesses = job_service.get_job_businesses(job_id)
    if businesses is None:
        raise HTTPException(status_code=404, detail="Search job not found")
    return JobBusinessesResponse(jobId=job_id, businesses=businesses)


@app.post("/jobs/{job_id}/cancel", response_model=SearchJob)
async def cancel_search_job(job_id: str) -> SearchJob:
    job = await job_service.cancel_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Search job not found")
    return job


@app.get("/jobs/{job_id}/export.csv")
async def export_search_job_csv(job_id: str) -> Response:
    rows = job_service.export_job_rows(job_id)
    if rows is None:
        raise HTTPException(status_code=404, detail="Search job not found")

    buffer = io.StringIO()
    fieldnames = [
        "canonicalName",
        "category",
        "address",
        "city",
        "country",
        "phone",
        "website",
        "email",
        "lat",
        "lng",
        "confidenceScore",
        "sourceName",
        "sourceExternalId",
    ]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{job_id}-businesses.csv"'},
    )


@app.get("/jobs/{job_id}/export.json")
async def export_search_job_json(job_id: str) -> Response:
    rows = job_service.export_job_rows(job_id)
    if rows is None:
        raise HTTPException(status_code=404, detail="Search job not found")
    return Response(
        content=json.dumps(rows, ensure_ascii=False),
        media_type="application/json; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{job_id}-businesses.json"'},
    )


@app.get("/sources/osm/test")
async def test_osm_source() -> dict[str, object]:
    try:
        return await overpass_client.test_connection()
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail="Overpass provider unavailable") from exc
