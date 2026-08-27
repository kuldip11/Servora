# 03 — Component Library Spec

Each component below is scoped to `apps/marketing` (new workspace), built on
top of `packages/ui` primitives where they already exist (Button, Card,
Badge, Input) rather than reinventing them. Components are React (Next.js)
or framework-appropriate (Astro components + islands) per the stack choice
in `05-technical-build-plan.md`.

## Layout components

### `<SiteHeader>`
- Props: none (reads current route for active nav state)
- States: transparent-over-hero (top of `/` only) vs. solid-on-scroll
  (everywhere else, and on `/` after 64px scroll)
- Contains: `<Logo>`, `<ProductMegaMenu>`, `<SolutionsDropdown>`,
  `<NavLink>` × N, `<Button variant="ghost">Sign In</Button>`,
  `<Button variant="primary">Book a Demo</Button>`, `<MobileNavToggle>`

### `<SiteFooter>`
- Props: none
- 4-column `<FooterColumn title, links[]>` + `<FooterBottomBar>`

### `<ProductMegaMenu>`
- Props: `columns: { title, items: { label, href, description, icon, badge? }[] }[]`
- Renders on hover (desktop) / tap-to-expand (tablet) / accordion (mobile)

## Marketing page-building blocks

### `<Hero>`
- Props: `eyebrow?`, `headline`, `subheadline`, `primaryCta {label, href}`,
  `secondaryCta? {label, href}`, `media {type: "screenshot"|"video", src}`
- Layout variants: `split` (text left, media right — default for feature
  pages), `centered` (for Home and conversion pages)

### `<ProductScreenshot>`
- Props: `src`, `alt` (required, descriptive — not "screenshot"), `caption?`,
  `frame: "browser" | "device" | "none"`
- Enforces consistent shadow/radius/frame treatment site-wide (see `02 §7`)
- **Never** accepts a `fakeData` or placeholder-metrics prop — this
  component is real-screenshot-only by design, to prevent a future
  contributor from swapping in an illustrated mockup with invented numbers.

### `<FeatureGrid>`
- Props: `items: { icon, title, description, href? }[]`, `columns: 2|3|4`
- Used on Home (module overview) and `/product` (all-modules-at-a-glance)

### `<ModuleCard>`
- Props: `icon`, `title`, `summary`, `href`, `badge?` (e.g. "Differentiator")
- Used within `<FeatureGrid>` and the Product mega-menu

### `<ComparisonRow>` / `<CapabilityTable>`
- Props: `rows: { capability, included: boolean | "partial" | string }[]`
- Used sparingly — only where the underlying capability is real and
  verified against the codebase (see the module verification note in
  `04-page-content-specs.md §0`). Never used to imply a competitor
  comparison unless that comparison has been fact-checked against the
  competitor's actual current offering.

### `<PricingCard>`
- Props: `planName`, `priceDisplay` (string, not necessarily a number — see
  `04` pricing page spec, which currently specifies "Contact us"),
  `description`, `features: string[]`, `cta {label, href}`, `highlighted?: boolean`
- Must support a `priceDisplay` of `"Contact Sales"` cleanly as a first-class
  state, not a hacky override — this state is the *current* real state.

### `<TestimonialCard>` / `<LogoStrip>`
- **Do not build content into these yet.** Component shells can exist in the
  library, but no page should render them until real, permissioned
  testimonials/customer logos exist. An empty or placeholder-filled
  testimonial section is worse than no section — see `04 §0`.

### `<CtaBanner>`
- Props: `headline`, `subheadline?`, `cta {label, href}`
- Full-width band, used to close out most pages before the footer

### `<FaqAccordion>`
- Props: `items: { question, answer }[]`
- Single-open or multi-open configurable; use Radix Accordion (already a
  dependency via `packages/ui`'s existing accordion keyframes — see `02`)

### `<DemoRequestForm>`
- Fields: Name (required), Work email (required), Restaurant name (required),
  Number of locations (select: 1 / 2–5 / 6–20 / 20+), Phone (optional),
  Message (optional)
- Submit → POST to `/api/lead` (see `05` for backend), success state replaces
  form with confirmation copy + expected response time, no fake "instant
  approval" language
- Validation via shared `packages/validation` schema pattern where
  practical, or a lightweight Zod schema local to `apps/marketing`

### `<ContactForm>`
- Simpler variant: Name, Email, Subject (select: Sales / Support / Other),
  Message

### `<StickyMobileCta>`
- Fixed-bottom bar on mobile only, appears after scrolling past the hero,
  single "Book a Demo" button — mobile has no room for a persistent header
  CTA, so this recovers that conversion path

## Content/SEO-adjacent components

### `<Breadcrumbs>`
- Used on all `/product/*` and `/solutions/*` pages for both UX and
  structured data (see `06-seo-analytics-spec.md`)

### `<TableOfContents>` (Phase 3 only)
- For long-form `/resources/[slug]` guides

## Component build order

Build in this order so early pages (Phase 0) aren't blocked on later
components: `SiteHeader`/`SiteFooter` → `Hero` → `ProductScreenshot` →
`FeatureGrid`/`ModuleCard` → `PricingCard` → `DemoRequestForm`/`ContactForm`
→ `CtaBanner` → `FaqAccordion` → `Breadcrumbs` → `TestimonialCard`/`LogoStrip`
shells (unpopulated) → `ComparisonRow` → `TableOfContents`.
