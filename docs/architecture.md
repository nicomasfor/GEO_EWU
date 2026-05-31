# Architecture Notes

GeoSector Intelligence is organized as a monorepo so the web client, API worker surface, shared TypeScript contracts, Convex functions, and deployment assets can evolve together.

## Current phase

Phases 0-2 provide:

- A pnpm workspace.
- A React/Vite frontend with the initial geospatial intelligence shell.
- A FastAPI service with `/health`.
- A Convex schema draft prepared for the future data model.
- Docker Compose assets for local and Coolify deployment.

## Data source policy

The initial product scope is OpenStreetMap-compatible data only. Google Maps and unauthorized scraping are intentionally excluded.

## Source connector contract

Backend source integrations implement `SourceConnector` and are registered in `SourceRegistry`. OSM is currently the only active connector; placeholder modules exist for Foursquare, Yelp, official directories, and public web sources.

## Hosted Convex

Convex is expected to run as a hosted deployment. Docker Compose does not run a Convex backend service by default.
