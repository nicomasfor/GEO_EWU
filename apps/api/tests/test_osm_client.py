from geosector_api.models import LocationInput
from geosector_api.osm_client import OverpassClient


def test_parse_and_normalize_osm_node():
    client = OverpassClient("https://overpass-api.de/api/interpreter")
    raw = {
        "type": "node",
        "id": 123,
        "lat": 38.34,
        "lon": -0.48,
        "tags": {
            "name": "Cafe Test",
            "amenity": "cafe",
            "phone": "+34 965 123 456",
            "website": "www.example.com/",
            "addr:street": "Carrer Major",
            "addr:housenumber": "1",
            "addr:city": "Alicante",
        },
    }
    place = client._parse_element(raw)
    assert place is not None

    business = client._normalize_place(
        place,
        LocationInput(
            id="alicante",
            label="Alicante",
            type="city",
            country="España",
            countryCode="ES",
            city="Alicante",
            lat=38.34,
            lng=-0.48,
        ),
        "hospitality",
    )

    assert business is not None
    assert business.primaryCategory == "cafe"
    assert business.phone == "+34965123456"
    assert business.website == "https://example.com"
    assert business.sourceExternalId == "node/123"
