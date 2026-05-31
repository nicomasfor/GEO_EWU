# Phases 3-5 Notes

## Phase 3

Location search is routed through the FastAPI backend using `/locations/search`. The backend currently uses Nominatim and normalizes responses into the shared `LocationCandidate` shape. The frontend applies a 450 ms debounce and handles short query, loading, empty, and provider-error states.

## Phase 4

Convex now has schema coverage for the product entities plus query/mutation modules for sectors, locations, jobs, businesses, job logs, source runs, and the initial hospitality seed.

Run:

```bash
pnpm convex dev
pnpm convex run seed:seedHospitalitySector
```

## Phase 5

FastAPI exposes the job and source test endpoints. Jobs initially ran a technical background sequence and can write to hosted Convex when `CONVEX_URL` and `CONVEX_ADMIN_KEY` are configured.
