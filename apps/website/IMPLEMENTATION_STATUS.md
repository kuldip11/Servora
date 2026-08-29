# Servora Website — Implementation Status

Updated: 2026-08-27

## Implemented in this pass

- Added `POST /api/lead` with server-side validation, honeypot spam field, and configurable webhook delivery via `LEAD_WEBHOOK_URL`.
- Replaced the prototype-only demo form success state with real API submission, loading state, reset-on-success, and surfaced delivery errors.
- Added a cookie-consent banner with essential-only and optional-cookie choices stored locally.
- Added Next.js route-level error handling (`app/error.tsx`) for 500-class rendering failures.
- Changed `/login` to perform the documented server-side redirect to `NEXT_PUBLIC_APP_SIGNIN_URL`.
- Made sitemap `lastModified` stable rather than changing on every request.
- Added environment documentation for the lead webhook.

## Still required before production

- Connect `LEAD_WEBHOOK_URL` to the actual CRM/email automation endpoint and verify delivery end-to-end.
- Replace legal placeholder copy with approved Privacy, Terms, and Cookies policies.
- Add consent-aware analytics and the documented funnel events.
- Add automated unit/integration/E2E/accessibility coverage.
- Add production-domain configuration and verify sitemap/robots against the live domain.
- Reconcile the contact workflow if it requires fields or delivery behavior different from demo requests.
- Verify product marketing claims against the application/backend implementation before publishing them as guarantees.

## Pass 2 — SEO, structured data, analytics instrumentation

Implemented:

- Canonical URLs and page-specific Open Graph/Twitter metadata across primary pages.
- Generated OG image endpoint at `/og` for page-specific preview content.
- Organization, SoftwareApplication and BreadcrumbList JSON-LD on product detail pages.
- Visible product breadcrumbs aligned with structured data.
- Tool-agnostic analytics event helper and core `page_view`, `module_card_click`, and demo-form events.
- Optional GA4 loading controlled by `NEXT_PUBLIC_GA_ID` and only usable after optional-cookie consent.

Still pending:

- Real approved legal copy.
- Contact-specific submission/event workflow.
- Full automated test/a11y suite and CI execution.
- Search Console/Bing submission after production deployment.

\n## Pass 3 — Functional forms, consent loading, and API hardening

Implemented:

- Added a dedicated `ContactForm` with subject/message fields and `contact_form_submit` analytics.
- Extended `/api/lead` payload validation for contact subjects, location length, and a 10-second delivery timeout.
- Fixed analytics so the GA script itself is not loaded until optional-cookie consent is present.
- Added a consent-change browser event so analytics can activate immediately after acceptance.
- Added initial Vitest coverage for lead validation, honeypot handling, and successful delivery.

Still pending:

- Configure and verify the real CRM/email webhook in a deployed environment.
- Replace legal placeholders with approved legal text.
- Add full E2E/browser accessibility coverage and run CI.
- Validate production domain, environment variables, and external service delivery.

## Pass 4 — Security baseline and abuse protection

Implemented:

- Added security response headers: nosniff, frame denial, strict referrer policy, permissions policy, and cross-origin opener policy.
- Added baseline API rate limiting for lead submissions (8 requests per IP per 10 minutes) with HTTP 429/Retry-After handling.
- Corrected contact-form start analytics event to use `contact_form_start`.
- Expanded environment documentation for the production lead endpoint.

Caveat:

- The rate limiter is process-local and is a baseline safeguard; a distributed production deployment should use an external rate-limit store/WAF before launch.

Next:

- Add browser E2E and accessibility tests, then validate with installed dependencies and a production-like environment.

## Pass 5 — Quality and accessibility gate

Implemented:

- Added Playwright accessibility smoke tests using axe-core for primary conversion and product routes.
- Added lead-delivery failure coverage so upstream webhook failures return a controlled 502 response.
- Added a GitHub Actions website quality workflow covering install, typecheck, lint, unit tests, production build, browser installation, and E2E tests.

Still pending:

- Run the new CI suite against the real dependency graph and fix any source/build failures it exposes.
- Configure the real production lead destination and validate delivery.
- Replace legal placeholders with approved copy.
- Configure the real production domain and external analytics/consent verification.

## Pass 6 — Consent UX and production configuration guard

Implemented:

- Added a persistent Cookie settings control in the footer so visitors can reopen consent choices.
- Added consent-aware page-view dispatch so a visitor who accepts analytics after initial load receives a page-view event.
- Added contact-form error analytics.
- Added a production-environment validation script for the public site URL, application sign-in URL, and lead webhook, including HTTPS and placeholder checks.

Still pending:

- Supply the real production URLs/secrets and run the production validation in the deployment environment.
- Replace legal placeholders with approved legal copy.
- Connect and verify the CRM/email destination end-to-end.

## Pass 7 — Funnel instrumentation and route integrity

Implemented:

- Added `nav_cta_click` tracking to header and footer Book a Demo CTAs.
- Added `pricing_cta_click` tracking to all pricing CTAs with plan names.
- Added a web app manifest for installable/PWA metadata.
- Added Playwright route-integrity coverage for all published Phase 0/1 routes.
- Added browser checks for `robots.txt` and `sitemap.xml`, including exclusion of unpublished `/resources` routes.

Still pending:

- Configure and verify the real CRM/email destination.
- Replace legal placeholders with qualified, approved policy text.
- Run the complete CI suite successfully in an environment with dependencies/network access.
- Deploy with real production URLs and submit the sitemap to search engines.

## Phase 5 — Application ecosystem navigation

Implemented:

- Added a dedicated `/apps` launcher for Management/POS, Kitchen Display, Waiter and Customer Ordering.
- Added environment-driven application navigation to desktop and mobile website headers.
- Centralized website application metadata so header, launcher and footer use the same destinations.
- Added `/apps` to sitemap and route-integrity coverage.
- Added E2E assertions for all four configured application URLs.

Roadmap status: **Phase 5 complete.**
