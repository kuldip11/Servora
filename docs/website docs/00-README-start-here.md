# Servora Marketing Website — Build Spec Set

This is a set of implementation-ready documents for building the Servora public
marketing website. Hand the whole folder to a developer, an agency, or an AI
coding agent (Claude Code, Cursor, etc.) and it should be enough to generate
the site end to end.

## Documents in this set

| #   | File                                 | What it defines                                                                               |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| 1   | `01-information-architecture.md`     | Full sitemap, URL structure, nav, footer, redirects                                           |
| 2   | `02-design-system.md`                | Colors, type, spacing, components — pulled from the **real** Servora app tokens, not invented |
| 3   | `03-component-library-spec.md`       | Every reusable marketing component: props, states, content slots                              |
| 4   | `04-page-content-specs.md`           | Section-by-section spec for every page: purpose, content, CTA, copy guardrails                |
| 5   | `05-technical-build-plan.md`         | Stack, repo layout, data model, forms, integrations, deployment                               |
| 6   | `06-seo-analytics-spec.md`           | Per-page metadata, structured data, sitemap/robots, event taxonomy                            |
| 7   | `07-launch-phasing-and-checklist.md` | Phase 0→4 build order, release gates, QA/legal checklist                                      |

## How these fit together

```
01 (IA)  ─┬─→ 04 (Page content specs — one section per page in the sitemap)
          │
02 (Design system) ─→ 03 (Component library) ─→ 04 (pages assembled from components)
          │
05 (Technical plan) ─→ ties 01–04 into an actual Next.js/Astro codebase
          │
06 (SEO/Analytics) ─→ overlays metadata + tracking onto every page in 01/04
          │
07 (Phasing) ─→ tells you the ORDER to build 01–06 in, and when each gate opens
```

Read **07 first** if you only read one document before starting — it tells you
what to build this week vs. what to defer.

## Ground truth this spec set is built from

Everything below is derived from the actual Servora codebase (`apps/api`,
`apps/web`, `apps/waiter-app`, `apps/kitchen-display`, `apps/customer-app`,
`packages/ui`), not assumptions:

- **Product**: multi-tenant restaurant POS — dashboard, waiter app, kitchen
  display, customer QR ordering, all on one Bun + Elysia + PostgreSQL + Redis
  backend.
- **Modules that exist and can be described truthfully on the site**: auth,
  tenant/branch/RBAC, menu (categories/items/modifiers/variants/scheduling),
  tables, orders, kitchen tickets, billing/payments, inventory, staff,
  analytics, realtime (WebSockets + Redis pub/sub).
- **Payments**: Cash, Card, UPI, Razorpay, Stripe are implemented in the UI.
- **Production status** (from the repo's own README): **not production-ready**.
  Payment completion is not yet atomic (a network failure between "record
  payment" and "mark order paid" can leave inconsistent state). Production
  secrets management, tenant-isolation testing, and full CI verification are
  also open items.
- **Design tokens**: real hex values and component tokens pulled from
  `packages/ui/src/theme/tokens.css` and `packages/ui/tailwind-preset.js` —
  see `02-design-system.md` for the exact source values.

### The one rule that overrides everything else in this spec set

> **Never state a capability, number, certification, or guarantee on the
> website that isn't true of the product today.** Where the product isn't
> ready (self-serve signup, uptime SLAs, security certifications, customer
> counts, integrations not yet built), the copy specs below say "Contact us"
> or omit the claim — they do not say "coming soon" with a fake date, and
> they do not paper over the gap with vague marketing language.

This rule is why the primary CTA across the whole site is **"Book a Demo"**
rather than self-serve signup, until the payment-atomicity fix and CI
verification gate (see `07-launch-phasing-and-checklist.md`) are closed.
