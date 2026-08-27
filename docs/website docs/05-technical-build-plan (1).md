# 05 — Technical Build Plan

## 1. Where this lives

New workspace app inside the existing Turborepo: **`apps/marketing`**,
alongside `apps/api`, `apps/web`, `apps/waiter-app`, `apps/kitchen-display`,
`apps/customer-app`. Do not create a separate repo — that duplicates CI,
dependency management, and the design-token pipeline, and drifts from the
product over time.

```
apps/marketing/
├── app/                        # Next.js App Router (or src/pages for Astro)
│   ├── (marketing)/
│   │   ├── page.tsx                     # /
│   │   ├── product/
│   │   │   ├── page.tsx
│   │   │   └── [module]/page.tsx        # or explicit folders per module
│   │   ├── solutions/[segment]/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── book-a-demo/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── about/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── resources/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── legal/[doc]/page.tsx
│   ├── login/route.ts          # redirect handler → dashboard sign-in URL
│   ├── api/
│   │   └── lead/route.ts       # form submission handler
│   ├── sitemap.ts
│   ├── robots.ts
│   └── not-found.tsx
├── components/                  # marketing-only components (03-component-library-spec.md)
├── content/                     # MDX for /resources (Phase 3)
├── public/
│   ├── images/screenshots/      # real product screenshots, optimized
│   └── og/                      # per-page OG images
├── tailwind.config.js           # presets: [uiPreset] — same pattern as apps/web
├── next.config.js
└── package.json
```

## 2. Framework decision

**Recommendation: Next.js (App Router)** over Astro, for this specific
codebase, because:

- One React codebase shared with `packages/ui` — components, not just
  tokens, can be reused directly (Button, Card, Accordion primitives)
  without a second implementation.
- The team already knows React/TypeScript/Tailwind from the dashboard —
  zero new-language onboarding cost.
- Next.js's built-in image optimization, static generation for marketing
  pages (`generateStaticParams` for `/product/[module]` etc.), and route
  handlers for the lead-capture API cover every requirement without extra
  tooling.

Use **Astro instead** only if the team wants to hand content editing to a
non-engineer via MDX/CMS sooner than Phase 3, and is fine maintaining two
component implementations (Astro components + occasional React islands for
interactive bits like `<DemoRequestForm>` and `<ProductMegaMenu>`).

This plan proceeds assuming **Next.js**.

## 3. Reusing the monorepo

- `tailwind.config.js`: `presets: [uiPreset]` exactly like `apps/web` (see
  `02-design-system.md`) — do not hand-roll a second token set.
- Import shared primitives from `packages/ui` directly
  (`import { Button, Card, Accordion } from "@servora/ui"` or whatever the
  actual package name/export path is — confirm against `packages/ui/package.json`).
- `packages/types`: import typed shapes for anything that mirrors backend
  data (e.g. if pricing plan data or module metadata is ever served from the
  API rather than hardcoded content).
- Do **not** import `packages/api-client` or `packages/realtime` into the
  marketing app — those are for the authenticated product surfaces and
  pulling them in adds unnecessary bundle weight and a dependency on
  backend auth the marketing site doesn't need.

## 4. Data model for marketing content

Phase 0–2 content (feature copy, pricing tiers, FAQ) can live as typed local
data — no CMS needed yet:

```ts
// content/modules.ts
export type Module = {
  slug: string;
  name: string;
  oneLiner: string;
  icon: string;
  badge?: "Differentiator";
  capabilities: string[];
  relatedModules: string[]; // slugs
  screenshot: { src: string; alt: string };
};
```

```ts
// content/pricing-plans.ts
export type PricingPlan = {
  name: string;
  priceDisplay: string; // "Contact Sales" today; numeric string later
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaHref: string;
};
```

**Phase 3** (Resources): move to MDX files in `content/resources/*.mdx` with
frontmatter (`title`, `description`, `publishedAt`, `topicCluster`, `ogImage`),
parsed via `next-mdx-remote` or Contentlayer. A headless CMS (e.g. Sanity,
Payload) is optional and only worth adding once non-engineers are actually
publishing regularly — don't add CMS infrastructure speculatively.

## 5. Lead capture / forms

- `<DemoRequestForm>` and `<ContactForm>` POST to `app/api/lead/route.ts`
  (Next.js Route Handler).
- That handler validates input (Zod), then forwards to whatever the team
  actually uses for sales workflow — options in order of least-to-most setup:
  1. **Simplest**: send a formatted email via a transactional email provider
     (Resend, Postmark, SES) to the sales inbox.
  2. **Better long-term**: POST into a CRM's API (HubSpot, Pipedrive) if one
     is already in use elsewhere in the business.
  3. Do **not** wire this into `apps/api` (the product backend) as a new
     authenticated endpoint — leads are anonymous/public traffic and don't
     need to touch the product's tenant/auth data model at all. Keep it
     fully isolated in the marketing app.
- Store a copy of every submission (even if also emailed) in a simple table/
  service so nothing is lost if an email delivery fails — even a lightweight
  Postgres table in a separate marketing-only database, or a third-party
  form backend, is fine.
- Rate-limit the endpoint (simple IP-based throttle) to prevent spam
  submissions before real deployment.

## 6. `/login` redirect

```ts
// app/login/route.ts
import { redirect } from "next/navigation";
export function GET() {
  redirect(process.env.NEXT_PUBLIC_APP_SIGNIN_URL!); // e.g. https://app.servora.com/login
}
```

Keep the real target URL in an env var, not hardcoded, since the dashboard's
domain/path may change independent of the marketing site's deploy cycle.

## 7. Hosting & deployment

- **Recommendation**: Vercel — zero-config Next.js support, CDN, automatic
  image optimization satisfying the performance goals in `06`, preview
  deployments per PR (useful for a non-technical founder to review copy
  changes before merge).
- Alternative: Cloudflare Pages or Netlify if the team standardizes hosting
  elsewhere for cost/vendor reasons — both support Next.js adequately.
- Environment variables needed: `NEXT_PUBLIC_APP_SIGNIN_URL`,
  lead-capture provider API key(s), analytics IDs (see `06`).
- Add `apps/marketing` to the existing Turborepo pipeline
  (`turbo.json` build/dev/lint tasks) so `bun run build` at the repo root
  builds it alongside the other apps, and CI (already required for the
  product per the README's P0 gate) covers it too.

## 8. Performance targets

- Static-generate every Phase 0–2 page at build time (`force-static` /
  default Next.js static rendering) — none of this content is
  personalized, so there's no reason to server-render per request.
- Image optimization mandatory for all screenshots (`next/image`, real
  `width`/`height`, `priority` only on the hero's above-the-fold image).
- Target Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms — matches the
  original master plan's §28 goals; Next.js + Vercel + static generation
  gets most of the way there by default, remaining work is image sizing
  discipline and avoiding render-blocking third-party scripts (see `06` for
  analytics loading strategy).

## 9. Testing

- Reuse the monorepo's existing tooling rather than introducing new tools:
  Vitest for component unit tests, Playwright for E2E (at minimum: nav
  works, demo form submits successfully, all internal links resolve —
  a broken-link check is cheap and catches the most common launch-day
  embarrassment), Playwright + axe for accessibility (already a pattern in
  the repo per the README's stack table).
