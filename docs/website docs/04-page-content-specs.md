# 04 — Page Content Specs

## 0. Non-negotiable content rules (apply to every page below)

1. **No unverified claims.** No uptime %, no security certifications (SOC 2,
   PCI-DSS, ISO 27001, etc.) unless actually obtained, no customer counts,
   no "trusted by X restaurants" — until each is true and evidenced.
2. **No fake social proof.** No testimonials, logos, or review-site badges
   until real, permissioned ones exist. Leave the section out entirely
   rather than using placeholder names.
3. **Primary CTA is "Book a Demo," not self-serve signup**, everywhere,
   until the release gate in `07-launch-phasing-and-checklist.md` is met.
4. **Every feature claim must trace to real code.** Before writing a feature
   page, confirm the capability against the module list in
   `00-README-start-here.md`. If a capability is partially built (e.g. one
   payment provider works end-to-end and another is UI-only), say what's
   true, not the aspirational version.
5. **Screenshots are real**, per `02-design-system.md §7` and the
   `<ProductScreenshot>` component contract in `03`.

---

## 1. Home (`/`)

**Purpose**: Establish what Servora is, who it's for, and get a demo booked
or drive to a specific module. Primary landing page for all paid/organic
traffic.

**Sections, in order**:

1. **Hero** — Eyebrow: "Restaurant POS, built as one system." Headline:
   something like "One platform to run your restaurant — orders, kitchen,
   billing, and staff." Subhead: 1–2 sentences naming the 4 surfaces
   (dashboard, waiter app, kitchen display, QR ordering) as _one connected
   system_ — this "connectedness" is the actual differentiator vs. bolted-
   together point solutions. Primary CTA: Book a Demo. Secondary CTA: "See
   the product" → `/product`. Media: real dashboard screenshot or short
   silent product video loop.
2. **Problem/value framing** — 3 short statements naming real restaurant pain
   (orders lost between front-of-house and kitchen, no visibility across
   branches, manual reconciliation at close) each paired with which Servora
   module solves it. Keep to true, common pain points — do not invent
   statistics ("73% of restaurants lose X") without a cited, real source.
3. **Product overview grid** — `<FeatureGrid columns=3>` with all core
   modules (POS/Orders, Menu, QR Ordering — badge "Differentiator", Kitchen
   Display, Billing, Staff/RBAC, Inventory, Analytics, Multi-Branch),
   each linking to its feature page.
4. **Role-based value strip** — 3 tabs/cards: "For Owners" (multi-branch
   visibility, analytics), "For Staff" (waiter app, faster order flow), "For
   Guests" (QR ordering, no app download). Short, concrete, no fluff.
5. **Why one system, not five tools** — short section making the
   integration argument (realtime sync via WebSockets/Redis pub/sub across
   dashboard/waiter/kitchen — described in plain language, not jargon) —
   this is a real architectural fact, safe to state.
6. **Final CTA banner** — `<CtaBanner>` "See it running in your restaurant" →
   Book a Demo.

**Do not include on Home**: pricing numbers, testimonials/logos, uptime/SLA
claims, "trusted by" language.

---

## 2. Product Overview (`/product`)

**Purpose**: One scannable page covering every module, for a visitor who
wants the full picture before drilling into specifics.

**Sections**:

1. Short hero (headline + one-paragraph framing, no separate big CTA needed
   beyond header/sticky bar)
2. Full `<FeatureGrid columns=3>` of all 9 modules with 2–3 sentence
   descriptions each (longer than Home's grid) and a real screenshot
   thumbnail per item
3. `<Breadcrumbs>` not needed here (top-level page) but each module card
   links into its dedicated `/product/[module]` page
4. Closing `<CtaBanner>`

---

## 3. Feature Page Template (`/product/[module]`)

Applies to all 9 module pages. Repeatable structure so each page is fast to
produce and consistent for the visitor:

1. **Hero** (split layout) — module name as H1, 1-sentence value prop,
   primary screenshot, Book a Demo CTA
2. **How it works** — 3–5 step or capability breakdown, each with a small
   real screenshot or UI detail crop
3. **Capabilities list** — bullet list of what's actually implemented (pull
   directly from the module's real feature set — see per-module notes below)
4. **Connects to** — 2–3 sentence callout + icons linking to related modules
   (e.g. Menu Management page links to POS & Orders and Inventory, since
   menu items drive both)
5. **CTA banner**

### Per-module notes (verified capabilities to draw from — confirm against

current code before publishing, since the app is under active development):

- **POS & Orders** (`/product/pos-and-orders`): order creation, item
  customization, order status transitions, kitchen ticket generation,
  inventory impact on order.
- **Menu Management** (`/product/menu-management`): categories, items,
  modifiers, variants, recipes, allergens, tags, images, scheduling
  (time-based availability), templates, import/export.
- **QR Customer Ordering** (`/product/qr-ordering`) — **promote this in nav
  and internal linking; it's the real differentiator vs. legacy POS
  competitors**: guest-facing ordering app, no app download, tied to table/
  session, syncs to kitchen and POS in realtime.
- **Kitchen Operations** (`/product/kitchen-display`): kitchen display
  workflow, ticket routing, status updates flowing back to POS/waiter app
  in realtime.
- **Billing & Payments** (`/product/billing-and-payments`) — **write this
  page most conservatively of all nine**: list the payment methods that
  exist in the UI today (Cash, Card, UPI, Razorpay, Stripe) plainly, but do
  **not** claim "instant," "guaranteed," or "always consistent" settlement —
  the underlying atomicity fix is not yet shipped per the README. Avoid
  language implying financial guarantees a pre-production system can't back.
- **Staff & Roles** (`/product/staff-and-roles`): RBAC with global/tenant/
  branch-level roles, staff management, role/branch assignment.
- **Inventory** (`/product/inventory`): stock tracking, stock adjustments,
  linkage to recipes/menu items and order-driven depletion.
- **Analytics & Reports** (`/product/analytics`): dashboard support and
  analytics endpoints — describe what's genuinely queryable today; don't
  promise a specific report catalog until confirmed against the API's
  actual analytics routes.
- **Multi-Branch** (`/product/multi-branch`): tenant/franchise membership,
  branch selection, branch-scoped authorization — genuinely real and a
  strong page for the "Solutions → Multi-Location" audience to land on.
- **Security & Reliability** (`/product/security`) — **write this page most
  conservatively of all**: describe real, implemented mechanisms only (JWT
  access tokens + persisted refresh tokens, RBAC, branch-scoped
  authorization). Do **not** claim compliance certifications, uptime SLAs,
  or "enterprise-grade security" as marketing filler — these are exactly
  the claims a technical buyer will probe, and none are currently backed
  by the repo's own stated status.

---

## 4. Solutions Pages (`/solutions/*`) — Phase 2

Template: same skeleton as feature pages, but organized around a restaurant
type instead of a module. Each page: hero framed around that segment's
specific problem, 3–4 relevant modules highlighted (link back to `/product/*`
pages rather than duplicating capability copy), one "day in the life" style
short narrative (real, plausible workflow — not a fabricated customer story
attributed to a named restaurant that doesn't exist), CTA banner.

- `/solutions/quick-service` — speed, QR ordering, simple menu structure
- `/solutions/full-service` — table management, waiter app, modifiers/variants
- `/solutions/multi-location` — multi-branch, analytics roll-up, RBAC
- `/solutions/cloud-kitchens` — menu management, kitchen display, minimal
  front-of-house needs (be honest if dine-in-specific features like table
  management are irrelevant to this segment rather than force-fitting them)

---

## 5. Pricing (`/pricing`)

**Current honest state**: no self-serve tiers exist yet operationally.
Structure the page as:

1. Short hero: "Pricing built around your restaurant" or similar
2. 2–3 illustrative plan _shapes_ (e.g. "Single Location," "Multi-Location,"
   "Enterprise/Franchise") **without hard numbers** — use `<PricingCard priceDisplay="Contact Sales">`
   for all tiers, differentiated by feature scope only
3. A short FAQ block addressing "why isn't there a price?" honestly (e.g.
   "Pricing depends on branch count and payment processing setup — talk to
   us and we'll give you a number in one call") — this reframes the absence
   of self-serve pricing as normal B2B practice rather than an evasion
4. CTA: Contact Sales / Book a Demo

**Once real fixed pricing exists**, swap `<PricingCard>` to numeric mode —
the component already supports both states per `03`.

---

## 6. Book a Demo (`/book-a-demo`)

Single-purpose conversion page. Short hero (1 sentence: what happens after
they submit — "We'll reach out within 1 business day to schedule a live
walkthrough"), `<DemoRequestForm>`, and a short trust strip below the form:
3 bullet reassurances that are true today (e.g. "No credit card required,"
"See it running with your own menu data," "Talk to the people building it,
not a sales script") — avoid generic B2B filler bullets that could apply to
any SaaS product.

## 7. Contact (`/contact`)

`<ContactForm>` + direct email address + (if real) phone/hours. No live
chat widget unless someone is actually staffing it — an unmanned chat bubble
that never responds is a worse experience than no chat bubble.

## 8. Support (`/contact` or dedicated `/support` — Phase 0 can fold this

into Contact)

Where existing customers/pilot users go: email, and if applicable, a link to
the in-app help. Do not promise a help center/knowledge base until one
exists (Phase 3 candidate once Resources content exists).

## 9. About (`/about`) — Phase 2

Only build this page once there is real, honest content: who's building
Servora, why, and what the mission is. Do not pad with a fake "leadership
team" grid of stock photos or invented bios. If the team isn't ready to be
publicly named, keep this page short and mission-focused rather than
fabricating an org chart.

## 10. FAQ (`/faq`) — Phase 2

Organize by category: Product, Pricing, Onboarding/Demo process, Security/
Data. Pull real questions from actual prospect conversations once Book a
Demo starts generating them — don't invent a generic SaaS FAQ list from
scratch; it reads as boilerplate.

## 11. Resources (`/resources/*`) — Phase 3

Deferred by design (see `07`). When built: guides organized by topic cluster
(e.g. "Running a QSR," "Multi-branch operations," "Restaurant tech basics"),
each linking into relevant `/product/*` pages. Glossary page targets
long-tail SEO terms (POS glossary entries).

## 12. Legal (`/legal/privacy`, `/legal/terms`, `/legal/cookies`)

**Do not ship placeholder/Lorem-Ipsum legal text or a generic template
copy-pasted from another SaaS site.** This product handles payments — get
these three documents properly drafted (or reviewed) by someone qualified
before public launch, per the reviewed plan's original flag. This is a
Phase 0 blocker, not a "fix later" item, precisely because it's easy to
forget once the rest of the site looks done.

## 13. Sign In (`/login`)

Not a content page — a redirect to the real dashboard's authenticated
sign-in route. See `01-information-architecture.md §4`.

## 14. 404 / 500

Simple, on-brand, with a search box or 3 top-nav links (Home, Product,
Book a Demo) to recover a lost visitor. No dead ends.
