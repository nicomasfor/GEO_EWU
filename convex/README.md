# Convex

This folder contains the Convex data model and will hold queries/mutations in later phases.

Create a hosted Convex project in your Convex account and set `VITE_CONVEX_URL` plus `CONVEX_DEPLOYMENT` in `.env`.

## Deploy functions

```bash
pnpm convex dev
```

Then run the seed mutation:

```bash
pnpm convex run seed:seedHospitalitySector
```

The backend keeps a local development cache and can call external Convex mutations when hosted server-side credentials are configured. Until your Convex deployment is connected, the API and UI still validate the real OpenStreetMap flow using backend memory.
