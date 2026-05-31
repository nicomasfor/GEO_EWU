from __future__ import annotations

import asyncio
import hashlib
import time
from typing import Any

import httpx

from geosector_api.models import BoundingBox, LocationInput, NormalizedBusiness, OSMRawPlace
from geosector_api.normalizers import calculate_confidence_score, normalize_name, normalize_phone, normalize_website

HOSPITALITY_AMENITIES = ("restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "ice_cream")
MAX_TILE_AREA = 0.08
MAX_TILE_COUNT = 64
MIN_RETRY_TILE_AREA = 0.005


class OverpassClient:
    def __init__(
        self,
        api_url: str,
        timeout_seconds: float = 20.0,
        api_urls: str | None = None,
        tile_delay_seconds: float = 1.2,
        max_retries: int = 4,
    ) -> None:
        configured_urls = [url.strip() for url in (api_urls or api_url).split(",") if url.strip()]
        self._api_urls = configured_urls or [api_url]
        self._api_url = self._api_urls[0]
        self._timeout = timeout_seconds
        self._tile_delay_seconds = tile_delay_seconds
        self._max_retries = max_retries
        self._cache: dict[str, tuple[float, dict[str, Any]]] = {}

    async def test_connection(self) -> dict[str, object]:
        query = "[out:json][timeout:5];node(50.746,7.154,50.748,7.157);out count;"
        headers = {"User-Agent": "GeoSectorIntelligence/0.1 local-development"}

        async with httpx.AsyncClient(timeout=self._timeout, headers=headers) as client:
            response = await client.post(self._api_urls[0], data={"data": query})
            response.raise_for_status()
            payload = response.json()

        return {
            "status": "ok",
            "endpoint": self._api_url,
            "generator": payload.get("generator"),
        }

    async def search_hospitality(self, location: LocationInput, sector_slug: str) -> list[NormalizedBusiness]:
        bbox = location.boundingBox or self._bbox_around_point(location.lat, location.lng)
        businesses: list[NormalizedBusiness] = []
        tiles = self._split_bbox(bbox)
        if len(tiles) > MAX_TILE_COUNT:
            raise ValueError("Selected area is too large for the initial Overpass connector")

        for tile in tiles:
            businesses.extend(await self._search_tile(tile, location, sector_slug))
            await asyncio.sleep(self._tile_delay_seconds)

        return businesses

    async def _search_tile(
        self,
        tile: BoundingBox,
        location: LocationInput,
        sector_slug: str,
    ) -> list[NormalizedBusiness]:
        try:
            payload = await self._execute(self._build_hospitality_query(tile))
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code < 500 or self._tile_area(tile) <= MIN_RETRY_TILE_AREA:
                raise
            businesses: list[NormalizedBusiness] = []
            for child in self._split_bbox_once(tile):
                businesses.extend(await self._search_tile(child, location, sector_slug))
            return businesses

        businesses = []
        for element in payload.get("elements", []):
            raw_place = self._parse_element(element)
            if raw_place is None:
                continue
            normalized = self._normalize_place(raw_place, location, sector_slug)
            if normalized is not None:
                businesses.append(normalized)
        return businesses

    async def _execute(self, query: str) -> dict[str, Any]:
        headers = {"User-Agent": "GeoSectorIntelligence/0.1 local-development"}
        cache_key = hashlib.sha256(query.encode("utf-8")).hexdigest()
        cached = self._cache.get(cache_key)
        if cached and time.time() - cached[0] < 60 * 20:
            return cached[1]

        last_error: Exception | None = None

        for attempt in range(self._max_retries):
            endpoint = self._api_urls[attempt % len(self._api_urls)]
            try:
                async with httpx.AsyncClient(timeout=self._timeout, headers=headers) as client:
                    response = await client.post(endpoint, data={"data": query})
                    response.raise_for_status()
                    payload = response.json()
                    self._cache[cache_key] = (time.time(), payload)
                    return payload
            except httpx.HTTPStatusError as exc:
                last_error = exc
                if exc.response.status_code not in {429, 502, 503, 504}:
                    raise
                retry_after = exc.response.headers.get("Retry-After")
                delay = float(retry_after) if retry_after and retry_after.isdigit() else min(2**attempt, 12)
                await asyncio.sleep(delay)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = exc
                await asyncio.sleep(min(2**attempt, 12))

        if last_error:
            raise last_error
        return {"elements": []}

    def _build_hospitality_query(self, bbox: BoundingBox) -> str:
        bbox_expr = f"{bbox.south},{bbox.west},{bbox.north},{bbox.east}"
        amenity_regex = "|".join(HOSPITALITY_AMENITIES)
        return f"""
        [out:json][timeout:25];
        (
          node["amenity"~"^({amenity_regex})$"]({bbox_expr});
          way["amenity"~"^({amenity_regex})$"]({bbox_expr});
          relation["amenity"~"^({amenity_regex})$"]({bbox_expr});
          node["tourism"="hotel"]["restaurant"~".+"]({bbox_expr});
          way["tourism"="hotel"]["restaurant"~".+"]({bbox_expr});
          relation["tourism"="hotel"]["restaurant"~".+"]({bbox_expr});
          node["shop"="bakery"]["cafe"~".+"]({bbox_expr});
          way["shop"="bakery"]["cafe"~".+"]({bbox_expr});
        );
        out center tags 5000;
        """

    def _parse_element(self, element: dict[str, Any]) -> OSMRawPlace | None:
        tags = element.get("tags") or {}
        lat = element.get("lat") or (element.get("center") or {}).get("lat")
        lng = element.get("lon") or (element.get("center") or {}).get("lon")

        if lat is None or lng is None or not tags.get("name"):
            return None

        return OSMRawPlace(
            osm_id=str(element.get("id")),
            osm_type=str(element.get("type")),
            lat=float(lat),
            lng=float(lng),
            tags=tags,
            raw=element,
        )

    def _normalize_place(
        self,
        place: OSMRawPlace,
        location: LocationInput,
        sector_slug: str,
    ) -> NormalizedBusiness | None:
        tags = place.tags
        name = tags.get("name")
        if not name or place.lat is None or place.lng is None:
            return None

        category = self._primary_category(tags)
        address = self._format_address(tags)
        phone = normalize_phone(tags.get("phone") or tags.get("contact:phone"))
        website = normalize_website(tags.get("website") or tags.get("contact:website"))
        email = tags.get("email") or tags.get("contact:email")
        raw_categories = self._raw_categories(tags)

        return NormalizedBusiness(
            canonicalName=str(name),
            normalizedName=normalize_name(str(name)),
            sectorSlug=sector_slug,
            primaryCategory=category,
            rawCategories=raw_categories,
            address=address,
            city=tags.get("addr:city") or location.city,
            region=location.region,
            country=location.country,
            countryCode=location.countryCode,
            lat=place.lat,
            lng=place.lng,
            phone=phone,
            website=website,
            email=email,
            openingHours=tags.get("opening_hours"),
            osmId=place.osm_id,
            osmType=place.osm_type,
            confidenceScore=calculate_confidence_score(
                name=str(name),
                lat=place.lat,
                lng=place.lng,
                phone=phone,
                website=website,
                address=address,
                category=category,
            ),
            sourceExternalId=f"{place.osm_type}/{place.osm_id}",
            rawPayload=place.raw,
        )

    def _primary_category(self, tags: dict[str, Any]) -> str:
        amenity = tags.get("amenity")
        if amenity in HOSPITALITY_AMENITIES:
            return str(amenity)
        if tags.get("shop") == "bakery":
            return "cafe"
        if tags.get("tourism") == "hotel":
            return "restaurant"
        return "other"

    def _raw_categories(self, tags: dict[str, Any]) -> list[str]:
        categories = []
        for key in ("amenity", "tourism", "shop", "cuisine"):
            if tags.get(key):
                categories.append(f"{key}={tags[key]}")
        return categories

    def _format_address(self, tags: dict[str, Any]) -> str | None:
        street = tags.get("addr:street")
        house_number = tags.get("addr:housenumber")
        postcode = tags.get("addr:postcode")
        city = tags.get("addr:city")
        parts = []
        if street:
            parts.append(f"{street} {house_number}".strip() if house_number else str(street))
        if postcode or city:
            parts.append(" ".join(str(part) for part in (postcode, city) if part))
        return ", ".join(parts) or None

    def _bbox_around_point(self, lat: float, lng: float, delta: float = 0.04) -> BoundingBox:
        return BoundingBox(south=lat - delta, west=lng - delta, north=lat + delta, east=lng + delta)

    def _split_bbox(self, bbox: BoundingBox) -> list[BoundingBox]:
        area = self._tile_area(bbox)

        if area <= MAX_TILE_AREA:
            return [bbox]

        tiles: list[BoundingBox] = []
        for child in self._split_bbox_once(bbox):
            tiles.extend(self._split_bbox(child))
        return tiles

    def _split_bbox_once(self, bbox: BoundingBox) -> list[BoundingBox]:
        midpoint_lat = (bbox.south + bbox.north) / 2
        midpoint_lng = (bbox.west + bbox.east) / 2
        return [
            BoundingBox(south=bbox.south, west=bbox.west, north=midpoint_lat, east=midpoint_lng),
            BoundingBox(south=bbox.south, west=midpoint_lng, north=midpoint_lat, east=bbox.east),
            BoundingBox(south=midpoint_lat, west=bbox.west, north=bbox.north, east=midpoint_lng),
            BoundingBox(south=midpoint_lat, west=midpoint_lng, north=bbox.north, east=bbox.east),
        ]

    def _tile_area(self, bbox: BoundingBox) -> float:
        width = max(bbox.east - bbox.west, 0.001)
        height = max(bbox.north - bbox.south, 0.001)
        return width * height
