from geosector_api.deduplication import BusinessDeduplicator
from geosector_api.models import NormalizedBusiness


def business(**overrides):
    base = {
        "canonicalName": "Cafe Test",
        "normalizedName": "cafe test",
        "sectorSlug": "hospitality",
        "primaryCategory": "cafe",
        "rawCategories": ["amenity=cafe"],
        "lat": 38.345,
        "lng": -0.481,
        "osmId": "1",
        "osmType": "node",
        "confidenceScore": 0.8,
        "sourceExternalId": "node/1",
    }
    base.update(overrides)
    return NormalizedBusiness(**base)


def test_same_osm_id_is_deduplicated():
    deduplicator = BusinessDeduplicator()
    merged, duplicates = deduplicator.merge([business(), business(phone="+34123")])
    assert len(merged) == 1
    assert duplicates == 1
    assert merged[0].phone == "+34123"


def test_near_identical_name_is_deduplicated():
    deduplicator = BusinessDeduplicator()
    first = business(osmId="1", sourceExternalId="node/1")
    second = business(osmId="2", sourceExternalId="node/2", lat=38.34501, lng=-0.48101)
    merged, duplicates = deduplicator.merge([first, second])
    assert len(merged) == 1
    assert duplicates == 1
