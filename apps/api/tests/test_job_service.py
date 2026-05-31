import pytest

from geosector_api.convex_client import ConvexClient
from geosector_api.jobs.service import JobService
from geosector_api.models import LocationInput, NormalizedBusiness, SearchRequest
from geosector_api.sources.base import SourceConnector
from geosector_api.sources.registry import SourceRegistry


class StaticConnector(SourceConnector):
    name = "osm"
    calls = 0

    async def search_businesses(self, location: LocationInput, sector_slug: str) -> list[NormalizedBusiness]:
        self.calls += 1
        return [
            NormalizedBusiness(
                canonicalName="Cafe Test",
                normalizedName="cafe test",
                sectorSlug=sector_slug,
                primaryCategory="cafe",
                rawCategories=["amenity=cafe"],
                lat=location.lat,
                lng=location.lng,
                osmId="1",
                osmType="node",
                confidenceScore=0.8,
                sourceExternalId="node/1",
            )
        ]


@pytest.mark.asyncio
async def test_repeated_jobs_keep_results_per_job():
    connector = StaticConnector()
    service = JobService(ConvexClient("", ""), SourceRegistry([connector]))
    request = SearchRequest(
        location=LocationInput(
            id="alicante",
            label="Alicante",
            type="city",
            country="España",
            countryCode="ES",
            lat=38.34,
            lng=-0.48,
        ),
        sectorSlug="hospitality",
        sourceMode="osm",
    )

    first = await service.create_search_job(request)
    await service.run_search_job(first.id)
    second = await service.create_search_job(request)
    await service.run_search_job(second.id)

    assert len(service.get_job_businesses(first.id) or []) == 1
    assert len(service.get_job_businesses(second.id) or []) == 1
    assert connector.calls == 1
