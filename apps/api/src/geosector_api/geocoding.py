from __future__ import annotations

import hashlib
from typing import Any

import httpx

from geosector_api.models import BoundingBox, LocationInput, LocationMode


class NominatimClient:
    def __init__(self, timeout_seconds: float = 8.0) -> None:
        self._timeout = timeout_seconds
        self._base_url = "https://nominatim.openstreetmap.org/search"

    async def search(self, query: str, mode: LocationMode, limit: int = 6) -> list[LocationInput]:
        params = {
            "q": self._normalize_query(query),
            "format": "jsonv2",
            "addressdetails": "1",
            "limit": str(limit),
            "accept-language": "es",
            "dedupe": "1",
        }

        headers = {"User-Agent": "GeoSectorIntelligence/0.1 local-development"}

        async with httpx.AsyncClient(timeout=self._timeout, headers=headers) as client:
            response = await client.get(self._base_url, params=params)
            response.raise_for_status()
            payload = response.json()

        filtered = self._filter_by_mode(payload, mode)
        return [self._normalize(item, mode) for item in filtered[:limit]]

    def _normalize_query(self, query: str) -> str:
        normalized = query.strip()
        return normalized.replace(" Espana", " España").replace(", Espana", ", España").replace(" espana", " España")

    def _filter_by_mode(self, payload: list[dict[str, Any]], mode: LocationMode) -> list[dict[str, Any]]:
        if mode == "countries":
            countries = [item for item in payload if str(item.get("type")) == "country"]
            return countries or payload

        city_types = {"city", "town", "village", "municipality", "administrative"}
        candidates = []
        for item in payload:
            address = item.get("address") or {}
            if str(item.get("type")) in city_types and (
                address.get("city") or address.get("town") or address.get("village") or address.get("municipality")
            ):
                candidates.append(item)
        return candidates or payload

    def _normalize(self, item: dict[str, Any], mode: LocationMode) -> LocationInput:
        address = item.get("address") or {}
        osm_type = str(item.get("osm_type", "nominatim"))
        osm_id = str(item.get("osm_id", hashlib.sha1(str(item).encode()).hexdigest()[:12]))
        location_type = self._resolve_type(item, mode)
        bounding_box = self._parse_bounding_box(item.get("boundingbox"))

        return LocationInput(
            id=f"nominatim:{osm_type}:{osm_id}",
            label=str(item.get("display_name") or item.get("name") or "Unknown location"),
            type=location_type,
            country=str(address.get("country") or ""),
            countryCode=str(address.get("country_code") or "").upper(),
            region=address.get("state") or address.get("region") or address.get("province"),
            city=address.get("city") or address.get("town") or address.get("village") or address.get("municipality"),
            lat=float(item["lat"]),
            lng=float(item["lon"]),
            boundingBox=bounding_box,
            source="nominatim",
            raw=item,
        )

    def _resolve_type(self, item: dict[str, Any], mode: LocationMode) -> str:
        place_type = str(item.get("type") or "")
        place_class = str(item.get("class") or "")
        if mode == "countries" or place_type == "country":
            return "country"
        if place_class == "place" and place_type in {"city", "town", "village", "municipality"}:
            return "city"
        if place_type == "administrative":
            address = item.get("address") or {}
            if address.get("city") or address.get("town") or address.get("village") or address.get("municipality"):
                return "city"
        return "address"

    def _parse_bounding_box(self, raw: Any) -> BoundingBox | None:
        if not isinstance(raw, list) or len(raw) != 4:
            return None

        south, north, west, east = [float(value) for value in raw]
        return BoundingBox(south=south, west=west, north=north, east=east)
