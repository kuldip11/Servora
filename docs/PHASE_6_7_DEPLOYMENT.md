# Phase 6.7 — Deployment

Status: **COMPLETE**

Implemented:
- Added production Dockerfiles for Customer, Kitchen, Waiter and Website; API and Web Dockerfiles remain supported.
- Added SPA-safe nginx runtime configuration and container health checks for Vite applications.
- Added `docker-compose.production.yml` covering PostgreSQL, Redis, API, Web, Kitchen, Waiter, Customer and Website.
- Added `.env.production.example`.
- Added strict production environment validation (`bun run validate:production-env`).
- Added GitHub Actions release verification with locked Bun 1.3.14, PostgreSQL, Redis, Playwright Chromium, database migration, full baseline, API performance smoke and release evidence upload.
- Added guarded PostgreSQL backup/restore scripts.

Production deployments should inject secrets through the hosting platform or secret manager; `.env.production.example` is documentation only and contains no deployable secrets.
