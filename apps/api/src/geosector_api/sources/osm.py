from __future__ import annotations

from geosector_api.models import LocationInput, NormalizedBusiness
from geosector_api.osm_client import OverpassClient
from geosector_api.sources.base import SourceConnector


class OSMConnector(SourceConnector):
    name = "osm"

    def __init__(self, overpass_client: OverpassClient) -> None:
        self._overpass_client = overpass_client

    async def search_businesses(self, location: LocationInput, sector_slug: str) -> list[NormalizedBusiness]:
        return await self._overpass_client.search_hospitality(location, sector_slug)
