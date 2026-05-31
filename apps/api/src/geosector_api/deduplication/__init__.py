from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from geosector_api.models import NormalizedBusiness


def distance_meters(a: NormalizedBusiness, b: NormalizedBusiness) -> float:
    earth_radius = 6_371_000
    lat1 = radians(a.lat)
    lat2 = radians(b.lat)
    delta_lat = radians(b.lat - a.lat)
    delta_lng = radians(b.lng - a.lng)

    h = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lng / 2) ** 2
    return 2 * earth_radius * asin(sqrt(h))


def same_business(a: NormalizedBusiness, b: NormalizedBusiness) -> bool:
    if a.osmId and a.osmType and a.osmId == b.osmId and a.osmType == b.osmType:
        return True
    if a.phone and b.phone and a.phone == b.phone and distance_meters(a, b) < 1_000:
        return True
    if a.website and b.website and a.website == b.website and distance_meters(a, b) < 1_000:
        return True
    if a.normalizedName and a.normalizedName == b.normalizedName and distance_meters(a, b) < 50:
        return True
    return False


class BusinessDeduplicator:
    def __init__(self) -> None:
        self._businesses: list[NormalizedBusiness] = []

    def merge(self, candidates: list[NormalizedBusiness]) -> tuple[list[NormalizedBusiness], int]:
        merged: list[NormalizedBusiness] = []
        duplicates = 0

        for candidate in candidates:
            existing = self._find(candidate, merged) or self._find(candidate, self._businesses)
            if existing:
                duplicates += 1
                self._merge_into(existing, candidate)
            else:
                merged.append(candidate)
                self._businesses.append(candidate)

        return merged, duplicates

    def _find(self, candidate: NormalizedBusiness, pool: list[NormalizedBusiness]) -> NormalizedBusiness | None:
        for existing in pool:
            if same_business(existing, candidate):
                return existing
        return None

    def _merge_into(self, existing: NormalizedBusiness, candidate: NormalizedBusiness) -> None:
        existing.phone = existing.phone or candidate.phone
        existing.website = existing.website or candidate.website
        existing.email = existing.email or candidate.email
        existing.address = existing.address or candidate.address
        existing.openingHours = existing.openingHours or candidate.openingHours
        existing.confidenceScore = max(existing.confidenceScore, candidate.confidenceScore)
