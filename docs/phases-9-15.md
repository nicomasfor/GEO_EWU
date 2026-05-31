# Phases 9-15 Notes

## Results and detail

The results panel supports filtering by name, category, phone, web, email, and minimum confidence. Results can be ordered by confidence, name, or category. A selected business opens a detail card with contact fields, coordinates, OSM source link, copy actions, and collapsible raw payload.

## Export and traceability

Exports are available both in the frontend and from the API:

- `GET /jobs/{job_id}/export.csv`
- `GET /jobs/{job_id}/export.json`

Every business keeps `sourceName`, `sourceExternalId`, OSM raw payload, and an OpenStreetMap link.

## Coolify and Convex hosted

The Compose stack runs `web` and `api`. Convex is expected to be hosted in your Convex account. Configure:

- `VITE_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `CONVEX_URL`
- `CONVEX_ADMIN_KEY` if backend writes to Convex are enabled

`docker-compose.prod.yml` keeps the API unexposed by default for Coolify-style deployments.

## Quality

Run:

```bash
pnpm check
pnpm build
docker compose config --quiet
```

Backend tests cover normalization, deduplication, and OSM parsing. Ruff is configured in `apps/api/pyproject.toml`.

## Future sources

The backend has a `SourceConnector` interface and `SourceRegistry`. OSM is registered as the first connector. Future providers should implement `search_businesses(location, sector_slug)` and return `NormalizedBusiness` records with source traceability.
