# Phase 5 — Website / Application Ecosystem Navigation

Status: **COMPLETE**  
Completed: 2026-08-28

## Scope

Phase 5 makes the marketing website the discoverable entry point to the full Servora application ecosystem.

## Implemented

- Added a dedicated `/apps` application launcher.
- Added an **Apps** menu to desktop website navigation.
- Added the full application launcher to mobile navigation.
- Kept the footer application links and moved their labels/descriptions into one shared definition.
- Connected all four first-class applications:
  - Management & POS (`NEXT_PUBLIC_WEB_APP_URL`)
  - Kitchen Display (`NEXT_PUBLIC_KITCHEN_APP_URL`)
  - Waiter App (`NEXT_PUBLIC_WAITER_APP_URL`)
  - Customer Ordering (`NEXT_PUBLIC_CUSTOMER_APP_URL`)
- Continued using the shared `@pos/config` URL resolver so local/staging/production fallbacks remain consistent.
- Added `/apps` to the sitemap.
- Added E2E route coverage for `/apps`.
- Added E2E assertions that all four configured application destinations are exposed.
- Preserved the sticky-bottom footer through the existing `flex min-h-screen flex-col` layout and `main.flex-1` structure.
- Website styling remains Tailwind-based and uses the shared Servora design tokens.

## Deployment contract

Set these public variables for the website deployment:

```text
NEXT_PUBLIC_WEB_APP_URL
NEXT_PUBLIC_KITCHEN_APP_URL
NEXT_PUBLIC_WAITER_APP_URL
NEXT_PUBLIC_CUSTOMER_APP_URL
```

The existing production environment validator requires and HTTPS-validates all four.

## Roadmap status

- Phase 1 — Foundation cleanup: COMPLETE
- Phase 2 — Identity & tenancy: COMPLETE
- Phase 3 — Operational integration: COMPLETE
- Phase 4 — Product polish: COMPLETE
- Phase 5 — Website / Application ecosystem navigation: COMPLETE

**Servora roadmap phases 1–5 are complete.**
