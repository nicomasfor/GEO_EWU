from geosector_api.normalizers import calculate_confidence_score, normalize_name, normalize_phone, normalize_website


def test_normalize_name_removes_accents_and_noise():
    assert normalize_name("Café Bar  Ali-Oil!!") == "cafe bar ali oil"


def test_normalize_phone_keeps_international_prefix():
    assert normalize_phone(" +34 965 123 456 ") == "+34965123456"


def test_normalize_website_removes_www_and_trailing_slash():
    assert normalize_website("www.Example.com/path/") == "https://example.com/path"


def test_confidence_score_increases_with_complete_fields():
    low = calculate_confidence_score(
        name="A",
        lat=1,
        lng=2,
        phone=None,
        website=None,
        address=None,
        category="restaurant",
    )
    high = calculate_confidence_score(
        name="A",
        lat=1,
        lng=2,
        phone="+34123",
        website="https://example.com",
        address="Street 1",
        category="restaurant",
    )
    assert high > low
