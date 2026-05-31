# GeoSector Intelligence

GeoSector Intelligence is a geospatial business intelligence platform for discovering businesses by area and sector. The first product slice targets hospitality businesses sourced from OpenStreetMap-compatible data, with an architecture prepared for future connectors.

## Monorepo Layout

```text
apps/
  web/      React + Vite frontend
  api/      FastAPI auxiliary backend
packages/
  shared/   Shared TypeScript domain contracts
convex/     Convex schema and future functions
docker/     Dockerfiles and nginx config
docs/       Technical notes
```

## Local Setup

```bash
pnpm install
pnpm dev:web
```

The web app runs on `http://localhost:5173`.

Run the API locally from `apps/api`:

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn geosector_api.main:app --reload --host 0.0.0.0 --port 8000
```

The API health endpoint is `http://localhost:8000/health`.

Useful API endpoints in the current phase:

- `GET /locations/search?q=Alicante%20Espana&mode=cities`
- `POST /jobs/search`
- `GET /jobs/{job_id}`
- `POST /jobs/{job_id}/cancel`
- `GET /jobs/{job_id}/businesses`
- `GET /jobs/{job_id}/export.csv`
- `GET /jobs/{job_id}/export.json`
- `GET /sources/osm/test`

## Quality Commands

```bash
pnpm check
pnpm build
docker compose config --quiet
```

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

By default Compose starts `web` and `api`. Convex is expected to run as a hosted Convex deployment in your Convex account.

## Environment Variables

- `VITE_CONVEX_URL`: Convex URL consumed by the frontend.
- `CONVEX_DEPLOYMENT`: Convex deployment selected by the Convex CLI.
- `CONVEX_URL`: Hosted Convex URL used by server-side integrations when enabled.
- `CONVEX_ADMIN_KEY`: Server-only key for controlled backend-to-Convex calls when configured.
- `API_BASE_URL`: Public API URL.
- `VITE_API_BASE_URL`: Frontend-visible API URL.
- `OVERPASS_API_URL`: Overpass API endpoint.
- `OVERPASS_API_URLS`: Comma-separated Overpass endpoints used with retry/rotation when public instances rate-limit.
- `OVERPASS_TILE_DELAY_SECONDS`: Delay between Overpass tile requests. Raise it if you see HTTP 429.
- `OVERPASS_MAX_RETRIES`: Retry count for transient Overpass failures.
- `APP_ENV`: Runtime environment name.
- `FRONTEND_PORT`: Local exposed web port.
- `API_PORT`: Local exposed API port.
- `CORS_ORIGINS`: Comma-separated origins allowed to call the API.

## Coolify Deployment

1. Create a new Coolify resource from the Git repository.
2. Select Docker Compose as the build pack.
3. Add the variables from `.env.example`.
4. Configure the public domain for the `web` service.
5. Keep `api` internal unless you need a public API URL.
6. Configure `VITE_CONVEX_URL`, `CONVEX_DEPLOYMENT`, and any server-side Convex credentials needed for your hosted project.
7. Deploy and verify `/health` on the API plus the frontend root route.
8. If you keep the API private in Coolify, set `VITE_API_BASE_URL` to the internal/public route that the browser can reach.

## OpenStreetMap Rate Limits

The app uses public Overpass instances. HTTP `429 Too Many Requests` means the public endpoint is temporarily rate-limiting you. The backend now retries with backoff, rotates `OVERPASS_API_URLS`, caches identical tile queries briefly, and waits between tile requests.

For heavier usage, configure your own Overpass endpoint or increase `OVERPASS_TILE_DELAY_SECONDS`.

## Phase Status

- Phase 0: monorepo, base API, Convex draft, Docker, documentation.
- Phase 1: dark geospatial frontend shell with mock operation states and result panels.
- Phase 2: interactive 3D globe with city/country modes, markers, auto-rotation, and selection state.
- Phase 3: Nominatim-backed location search through the API with debounce and normalized candidates.
- Phase 4: Convex schema, indexes, query/mutation modules, and hospitality seed.
- Phase 5: FastAPI job orchestration surface, Overpass test client, Convex HTTP client, and background job skeleton.
- Phase 6: OpenStreetMap/Overpass hospitality connector with bounding-box tiling and normalized raw extraction.
- Phase 7: Initial normalization, confidence scoring, and deduplication rules.
- Phase 8: End-to-end frontend/backend flow with real OSM results returned to the UI.
- Phase 9: results panel, filters, ordering, metrics, and business detail.
- Phase 10: category-colored geospatial result points with click-to-detail behavior.
- Phase 11: CSV/JSON exports and OSM source traceability.
- Phase 12: Coolify-oriented hosted Convex deployment configuration.
- Phase 13: backend tests, Ruff config, API limits, and quality commands.
- Phase 14: source connector interface and registry for future providers.
- Phase 15: final visual polish, loaders, and intelligence-oriented UI states.
