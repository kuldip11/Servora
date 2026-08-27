# 01 — Information Architecture

## 1. Full Sitemap

```
/                               Home
/product                        Product Overview (all modules at a glance)
/product/pos-and-orders         Feature: POS & Orders
/product/menu-management        Feature: Menu Management
/product/qr-ordering            Feature: QR Customer Ordering  ★ lead with this
/product/kitchen-display        Feature: Kitchen Operations / KDS
/product/billing-and-payments   Feature: Billing & Payments
/product/staff-and-roles        Feature: Staff & Roles (RBAC)
/product/inventory               Feature: Inventory
/product/analytics               Feature: Analytics & Reports
/product/multi-branch            Feature: Multi-Branch / Franchise
/product/security                Feature: Security & Reliability

/solutions                      Solutions hub (by restaurant type)
/solutions/quick-service        QSR / fast casual
/solutions/full-service         Full-service / dine-in
/solutions/multi-location       Chains & franchises
/solutions/cloud-kitchens       Cloud kitchens / delivery-only

/pricing                        Pricing (Contact Sales — see 07 for gating)
/book-a-demo                    Primary conversion page
/contact                        General contact / support
/about                          About / mission / team (only if true content exists)
/faq                            FAQ
/resources                      Resources / guides hub (Phase 3)
/resources/[slug]                Individual guide/article (Phase 3)
/resources/glossary              POS glossary (Phase 3)

/login                          Redirects to app.servora.<tld> sign-in
/legal/privacy                  Privacy Policy
/legal/terms                    Terms of Service
/legal/cookies                  Cookie Policy
/404                             Not found
/500                             Error page
```

## 2. Primary Navigation (header)

Desktop, left to right:

```
[Servora logo] → /
Product ▾   (mega-menu — see 2.1)
Solutions ▾ (dropdown — see 2.2)
Pricing     → /pricing
Resources   → /resources   (hide this nav item entirely until Phase 3 has ≥3 published articles — a nav link to an empty section looks broken, not "coming soon")
                                                                       [Sign In]  [Book a Demo] (primary button)
```

### 2.1 Product mega-menu columns
1. **Operations** — POS & Orders, Menu Management, Kitchen Operations
2. **Guest Experience** — QR Ordering (badge: "Differentiator"), 
3. **Management** — Staff & Roles, Inventory, Analytics, Multi-Branch
4. **Trust** — Security & Reliability
Each item: icon + 1-line description, links to its feature page. Footer row
of the mega-menu: "See the full product →" linking to `/product`.

### 2.2 Solutions dropdown
Flat list, 4 items, no mega-menu needed: Quick Service, Full Service,
Multi-Location, Cloud Kitchens.

### Mobile nav
Hamburger → full-screen overlay. Order: Product (expandable accordion listing
all 9 feature pages), Solutions (accordion), Pricing, Resources (if live),
About, FAQ, then Sign In / Book a Demo as two full-width stacked buttons at
the bottom, Book a Demo visually primary.

## 3. Footer

4-column layout + bottom bar.

**Column 1 — Product**: links to all `/product/*` pages
**Column 2 — Solutions**: links to all `/solutions/*` pages
**Column 3 — Company**: About, Contact, Book a Demo, FAQ (Resources once live)
**Column 4 — Legal**: Privacy Policy, Terms of Service, Cookie Policy

**Bottom bar**: `© {year} Servora. All rights reserved.` + social icons (only
include icons for accounts that actually exist and are maintained — a dead
Twitter/X icon linking nowhere or to an inactive account is worse than
omitting it).

## 4. URL & Routing Conventions

- All lowercase, hyphen-separated, no trailing slash canonicalized to no
  trailing slash.
- Feature pages nest under `/product/` (not `/features/`) to match the nav
  label and avoid a second competing term.
- `/login` is a **redirect**, not a page — it 302s to the real dashboard's
  sign-in URL (`apps/web`'s auth route). Do not build a fake login form on
  the marketing site.
- `/book-a-demo` is the canonical conversion URL — every "Book a Demo" CTA
  site-wide points here, never to an anchor on another page, so it can be
  measured as one destination in analytics (see `06-seo-analytics-spec.md`).

## 5. Redirects to plan for later

Reserve these now even if unused in Phase 0, so Phase 2/3 URLs don't collide
with anything already indexed:
- `/demo` → `/book-a-demo`
- `/features` → `/product`
- `/customers` → reserved for future case studies index (do not build until
  real, permissioned customer case studies exist — see the no-fake-social-proof
  rule in `04-page-content-specs.md`)

## 6. Page inventory by phase (cross-reference)

See `07-launch-phasing-and-checklist.md` for the authoritative phase
assignment. Summary:
- **Phase 0**: `/`, `/product`, `/pricing`, `/book-a-demo`, `/contact`,
  `/login` (redirect), `/legal/*`, `/404`
- **Phase 1**: all 9 `/product/*` feature pages
- **Phase 2**: `/solutions/*`, `/about`, `/faq`
- **Phase 3**: `/resources/*`
