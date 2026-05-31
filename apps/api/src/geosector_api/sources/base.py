from __future__ import annotations

from abc import ABC, abstractmethod

from geosector_api.models import LocationInput, NormalizedBusiness


class SourceConnector(ABC):
    name: str

    @abstractmethod
    async def search_businesses(self, location: LocationInput, sector_slug: str) -> list[NormalizedBusiness]:
        raise NotImplementedError
