# Phases 6-8 Notes

## Phase 6

The backend now has a real OpenStreetMap connector using Overpass. It generates hospitality queries for:

- `amenity=restaurant`
- `amenity=cafe`
- `amenity=bar`
- `amenity=pub`
- `amenity=fast_food`
- `amenity=food_court`
- `amenity=ice_cream`
- hotels tagged with restaurant data
- bakeries tagged with cafe data

Large bounding boxes are split into smaller tiles before querying Overpass.

Public Overpass instances can return HTTP 429 under repeated use. The backend retries transient 429/5xx responses, rotates configured endpoints from `OVERPASS_API_URLS`, caches identical tile queries for a short period, and waits between tile requests.

## Phase 7

The backend normalizes business names, phones, websites, source categories, address fields, and confidence scores. Initial deduplication covers same OSM id/type, phone in the same area, website in the same area, and identical normalized name within 50 meters.

## Phase 8

The frontend launches a backend job, polls progress, then reads real businesses from `/jobs/{job_id}/businesses`. Convex hosted remains the primary database target, but local development works without a connected Convex deployment.
