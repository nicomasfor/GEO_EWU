from __future__ import annotations

import re
import unicodedata
from urllib.parse import urlparse, urlunparse


def normalize_name(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(char for char in decomposed if not unicodedata.combining(char))
    lowered = ascii_value.lower()
    cleaned = re.sub(r"[^a-z0-9\s]", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def normalize_phone(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = re.sub(r"[^\d+]", "", value)
    if cleaned.startswith("00"):
        cleaned = f"+{cleaned[2:]}"
    return cleaned or None


def normalize_website(value: str | None) -> str | None:
    if not value:
        return None
    candidate = value.strip()
    if not candidate:
        return None
    if "://" not in candidate:
        candidate = f"https://{candidate}"
    parsed = urlparse(candidate)
    netloc = parsed.netloc.lower().removeprefix("www.")
    path = parsed.path.rstrip("/")
    return urlunparse((parsed.scheme.lower(), netloc, path, "", "", ""))


def calculate_confidence_score(
    *,
    name: str | None,
    lat: float | None,
    lng: float | None,
    phone: str | None,
    website: str | None,
    address: str | None,
    category: str | None,
) -> float:
    score = 0.35
    if name:
        score += 0.18
    if lat is not None and lng is not None:
        score += 0.16
    if category:
        score += 0.12
    if address:
        score += 0.08
    if phone:
        score += 0.06
    if website:
        score += 0.05
    return round(min(score, 0.99), 2)
