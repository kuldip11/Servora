# 07 — Launch Phasing & Checklist

Read this document first. It sequences everything in `01`–`06` into an
actual build order, and defines the gate that flips the site's primary CTA
from "Book a Demo" to self-serve signup.

## Phase 0 — Minimum honest site (target: ~1–2 weeks)

**Goal**: stop being invisible, start collecting real demo requests, zero
overpromising.

**Pages**: `/`, `/product`, `/pricing`, `/book-a-demo`, `/contact`,
`/login` (redirect), `/legal/privacy`, `/legal/terms`, `/legal/cookies`,
`/404`, `/500`

**Build order within Phase 0**:
1. `apps/marketing` scaffold (Next.js, `presets: [uiPreset]`) — `05 §1–3`
2. `<SiteHeader>` / `<SiteFooter>` / `<Hero>` / `<CtaBanner>` components — `03`
3. `/` and `/product` — `04 §1–2`
4. `<DemoRequestForm>` + `/api/lead` handler + `/book-a-demo` — `03`, `05 §5`
5. `<PricingCard>` (Contact-Sales mode) + `/pricing` — `04 §5`
6. `<ContactForm>` + `/contact`
7. Legal pages — **commission real drafting now**, this has external lead
   time (lawyer/consultant), don't leave it to the last week
8. `/login` redirect, `/404`, `/500`
9. Basic SEO pass (`06 §1–3`) + analytics wiring (`06 §5`) + sitemap submission
10. Deploy to production hosting (`05 §7`)

**Phase 0 exit criteria**:
- [ ] All Phase 0 pages live at production URL
- [ ] Demo form successfully delivers leads (test end-to-end, including the
      failure path — what happens if the email provider is down)
- [ ] Legal pages reviewed by someone qualified, not placeholder text
- [ ] Sitemap submitted to Search Console
- [ ] No page contains any claim flagged by the content rules in `04 §0`

## Phase 1 — Feature depth (target: after Phase 0 ships)

**Pages**: all 9 `/product/[module]` pages, in this order (matches buyer
priority, not alphabetical):
1. POS & Orders
2. Menu Management
3. **QR Customer Ordering** — promote in nav ahead of its position here once
   built; it's the real differentiator
4. Kitchen Operations
5. Billing & Payments *(write conservatively — see `04 §3`)*
6. Staff & Roles
7. Inventory
8. Analytics & Reports
9. Multi-Branch
10. Security & Reliability *(write conservatively — see `04 §3`)*

**Before writing each page**: re-verify its capability list against the
current codebase — the product is under active development, and a spec
written today can drift from what's actually shipped by the time the page
is built. Treat the per-module notes in `04 §3` as a starting checklist to
confirm, not a final source of truth.

## Phase 2 — Conversion + trust layer

**Pages**: `/solutions/*` (4 pages), `/about`, `/faq`

**Also in this phase**: flip the primary CTA site-wide from "Book a Demo" to
real self-serve signup — **but only once every item below is true**:

### The self-serve release gate (from the README's own P0 blockers)
- [ ] Payment completion is atomic and idempotent (server-side, not two
      separate client-triggered calls)
- [ ] Refunds are atomic and idempotent
- [ ] Production secrets are managed via a dedicated secret manager, not
      env-file defaults
- [ ] A clean CI run proves install, typecheck, lint, unit tests, E2E tests,
      accessibility checks, migrations, and production builds all pass
- [ ] Tenant-isolation testing has been completed

Until all of these are checked, **do not** change "Get Started"/"Book a
Demo" to open signup anywhere on the site, regardless of business pressure
to "just launch signup" — this is the single highest-risk shortcut this
spec set exists to prevent, per the reviewed plan's original finding.

Once the gate is met: swap `<PricingCard>` CTAs, header/footer CTAs, and the
`/book-a-demo` page's role from "request a demo" to "start free" (or
whatever the actual signup flow is called) — the component contracts in `03`
already support both states, so this is a content/copy change, not a
rebuild.

## Phase 3 — SEO & content engine

**Pages**: `/resources`, `/resources/[slug]` (multiple), `/resources/glossary`

Correctly sequenced last — per `06 §4`, these pages should link *into* the
Phase 1 product pages, which need to exist first. Add `/resources` to the
main nav (currently hidden per `01 §2`) once at least 3 articles are
published — a nav item pointing to a near-empty section looks unfinished.

## Phase 4 — Polish

- Full accessibility audit (WCAG AA minimum, matching the repo's existing
  Playwright + axe pattern)
- Performance re-measurement against the `05 §8` targets under real traffic
- Structured data validation (Google's Rich Results Test on every schema
  type used)
- Full launch checklist run-through (below)

---

## Master Launch Checklist (run before any public traffic push, and again
before the self-serve flip)

**Content accuracy**
- [ ] No page contains an unverified claim (uptime, certifications, customer
      counts, "guaranteed")
- [ ] No fake testimonials, logos, or reviews anywhere on the site
- [ ] Every feature claim was checked against current code within the last
      build cycle, not assumed from this spec

**Legal**
- [ ] Privacy Policy, Terms, Cookie Policy are real, reviewed drafts
- [ ] Cookie consent mechanism works and blocks non-essential scripts pre-consent

**Technical**
- [ ] All internal links resolve (automated broken-link check)
- [ ] `/login` redirects correctly to the live dashboard sign-in URL
- [ ] Demo/contact forms deliver leads reliably, including a tested failure path
- [ ] Sitemap/robots.txt correct and submitted
- [ ] Core Web Vitals pass on mobile and desktop for the top 5 pages by
      expected traffic
- [ ] Accessibility: keyboard navigation and screen-reader pass on
      `<DemoRequestForm>`, `<ProductMegaMenu>`, `<FaqAccordion>` at minimum

**Business**
- [ ] Someone is actually monitoring the lead inbox/CRM before launch —
      a form that works technically but nobody reads is a silent failure
- [ ] Analytics events firing correctly for the funnel in `06 §5`
