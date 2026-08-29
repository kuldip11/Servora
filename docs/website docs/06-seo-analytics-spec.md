# 06 — SEO & Analytics Spec

## 1. Per-page metadata requirements

Every page needs, at minimum:

- Unique `<title>` — pattern: `{Page Topic} | Servora` (Home: `Servora — {short value prop}`)
- Unique meta description, 140–160 chars, written for a click from search
  results, not just a restated H1
- Canonical URL tag (self-referencing on every indexable page)
- OG tags: `og:title`, `og:description`, `og:image` (dedicated per-page OG
  image, not one global image reused everywhere — a shared generic OG image
  makes every link preview identical and forgettable)
- Twitter card: `summary_large_image`

Example (feature page):

```
title: "QR Ordering for Restaurants | Servora"
description: "Let guests order and pay from their table with a QR code — no app download, synced to your kitchen and POS in real time."
```

## 2. Structured data (schema.org via JSON-LD)

- **Organization** schema on every page (name, logo, url, sameAs social
  profiles — only real, active ones)
- **SoftwareApplication** or **Product** schema on `/product` and each
  `/product/[module]` page — omit `aggregateRating`/`review` fields entirely
  until real reviews exist; a fabricated rating is both a Google Rich
  Results policy violation and a factual misrepresentation
- **BreadcrumbList** on all `/product/*` and `/solutions/*` pages, matching
  the visible `<Breadcrumbs>` component
- **FAQPage** schema on `/faq` and any page using `<FaqAccordion>` with
  real Q&A content
- **Article** schema on `/resources/[slug]` (Phase 3)
- Do **not** add `Review`/`AggregateRating` schema anywhere until genuine
  reviews exist — same rule as the no-fake-testimonials content rule in `04`.

## 3. `sitemap.xml` and `robots.txt`

- Generate `sitemap.xml` dynamically from the route list (Next.js
  `app/sitemap.ts`), including only pages that exist at each phase — don't
  list Phase 3 `/resources/*` URLs in the sitemap before they're published.
- `robots.txt`: allow all by default; disallow `/api/*` (lead capture
  endpoint shouldn't be crawled/indexed).
- Submit sitemap to Google Search Console and Bing Webmaster Tools at
  Phase 0 launch — this is a 10-minute task that's easy to forget and
  meaningfully speeds up indexing.

## 4. Keyword/content targeting by phase

- **Phase 0–1**: target commercial-intent, product-specific terms tied to
  each real module — "restaurant QR ordering system," "restaurant POS
  billing software," "multi-branch restaurant management software" — these
  map directly to pages that already exist and are truthful.
- **Phase 3 (Resources)**: broader informational terms ("how does a
  restaurant POS system work," "QSR vs full service POS differences") —
  correctly sequenced last per the reviewed plan, since these should link
  into the product pages built in Phase 1, not the reverse.
- Avoid keyword-stuffing feature pages with terms the product doesn't
  actually support (e.g. don't target "restaurant loyalty program software"
  on the Analytics page if loyalty/rewards isn't an implemented module) —
  ranking for a term the product can't deliver on just produces bounces and
  erodes trust the moment a visitor lands.

## 5. Analytics event taxonomy

Track these as the core conversion funnel (tool-agnostic — implement in
whichever analytics platform the team chooses, e.g. GA4, Plausible, PostHog):

| Event                 | Fires when                                 | Key properties                                  |
| --------------------- | ------------------------------------------ | ----------------------------------------------- |
| `page_view`           | Every page load                            | `path`, `referrer`                              |
| `nav_cta_click`       | Header/footer "Book a Demo" clicked        | `location: "header"\|"footer"\|"mobile_sticky"` |
| `module_card_click`   | Any `<ModuleCard>` clicked                 | `module_slug`, `source_page`                    |
| `demo_form_start`     | First field focused in `<DemoRequestForm>` | `source_page`                                   |
| `demo_form_submit`    | Successful submission                      | `location_count_bucket` (from the form field)   |
| `demo_form_error`     | Validation or submit failure               | `error_type`                                    |
| `contact_form_submit` | `<ContactForm>` successful submission      | `subject`                                       |
| `pricing_cta_click`   | Any `<PricingCard>` CTA clicked            | `plan_name`                                     |
| `faq_item_expand`     | `<FaqAccordion>` item opened               | `question`                                      |

Because `/book-a-demo` is the single canonical URL for the primary CTA (per
`01-information-architecture.md §4`), funnel reporting can key off that one
path rather than reconciling multiple demo-request destinations.

## 6. Privacy & cookie compliance

- Ship a real, working cookie consent mechanism if analytics/marketing
  cookies are used and the site has visitors in jurisdictions requiring
  consent (GDPR/EU visitors, India's DPDP Act given the product's evident
  India-market fit via UPI/Razorpay support) — this pairs directly with the
  `/legal/cookies` page content requirement in `04 §12`.
- Load analytics scripts only after consent where required, and always
  asynchronously/deferred so they never block LCP.

## 7. Performance monitoring

- Set up Core Web Vitals monitoring (Vercel Analytics, or GA4's Web Vitals
  integration) from Phase 0 launch, not retrofitted later — regressions are
  far cheaper to catch immediately after each deploy than to diagnose months
  in.
