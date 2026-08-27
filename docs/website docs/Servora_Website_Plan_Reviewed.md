# Servora Website — Reviewed & Refined Plan

This document does three things:
1. **What I found in your actual application** (from the code, not assumptions)
2. **Review of your existing master plan** — what's excellent, what's risky, what's missing
3. **A refined, buildable plan** — same ambition, but sequenced so you can actually ship it starting from zero

---

## 1. What Servora Actually Is (from the codebase)

Your plan describes an ambitious platform. I checked, and the good news is: **it's not vaporware — the plan matches the real product.**

- It's a **multi-tenant restaurant POS platform**: one backend (`apps/api`, Bun + Elysia + PostgreSQL + Redis) serving four separate frontends — the main dashboard (`apps/web`), a **waiter app**, a **kitchen display**, and a **customer-facing QR ordering app** (`apps/customer-app`).
- Every module your plan references genuinely exists in code: auth, tenant/branch/RBAC, menu (categories/items/modifiers/variants/availability), tables, orders, kitchen tickets, billing/payments, inventory, staff, analytics, and realtime (WebSockets + Redis pub/sub).
- Payment methods in the UI: **Cash, Card, UPI, Razorpay, Stripe.**

### The one fact that should shape your whole website strategy
Your own repo's README says, in plain terms: **"NOT READY FOR PRODUCTION."** The specific blocker that matters most for a website: **payment completion isn't atomic yet** — creating a payment and marking an order paid are two separate API calls, so a network hiccup can leave a paid order looking unpaid (or vice versa). There are also open items around production secrets, tenant-isolation testing, and full CI verification.

This doesn't mean "don't build the website." It means: **your website's conversion path and claims need to match where the product actually is right now**, not where it will be in three months. This is actually something your own plan already insists on ("verify every claim against the current implementation") — I'm just flagging the specific place where the temptation to overpromise will be strongest: the pricing/signup/payments pages.

---

## 2. Review of Your Master Plan

Being direct, since that's more useful than blanket praise: **this is a genuinely strong plan** — better organized than most agency briefs I see. The instinct to ban unverified claims (uptime %, certifications, customer counts) throughout the doc is exactly the right discipline for a product that's pre-production. Keep that rule; it protects you legally and reputationally.

Three things worth changing:

### 2.1 It's a 40-page site plan with no MVP — that's the real gap
Sections 1–39 describe a *complete, mature SaaS marketing site*: 20+ top-level pages, a resources/blog engine with topic clusters, a full design system, analytics event taxonomy, structured data, accessibility audits. That's the right **end state**. But you said you have "0 idea" — building all of this before launching anything means you launch nothing. The plan needs a **Phase 0** that gets a real, honest, working site live in days, not months. I've added that below.

### 2.2 "Get Started" as self-serve signup is premature given the README
Your plan (sections 4.1, 4.8, 18, 25) treats **Get Started** as a friction-minimized self-serve signup straight into onboarding. Given payments aren't atomic yet, I'd change the primary CTA for now to **"Book a Demo" / "Request Early Access"** rather than open self-serve signup — until the P0 payment fix and full CI verification (README §15–16) are done. This is a sequencing fix, not a scope cut: your plan's *structure* (Sign In, Get Started routes) stays identical; you're just controlling what "Get Started" *does* until the backend is ready. Swap it back to instant self-serve the moment the release gate is met.

### 2.3 A few implementation gaps the plan doesn't mention
- **No marketing site exists yet in your repo.** `apps/web` is the *authenticated POS dashboard*, not the public site. You need a genuinely new app.
- **Where does it live?** Given you already have a Turborepo with a shared `packages/ui` (your plan explicitly wants "a single design system across marketing and application," §30), the highest-leverage choice is adding the marketing site as a new workspace app — e.g. `apps/marketing` — reusing `packages/ui` and `packages/types`, rather than a totally separate repo/stack.
- **Rendering approach isn't chosen.** Your performance section (§28) wants server-rendered/static marketing pages, but your app stack is Vite + TanStack Router (a client-heavy SPA pattern) — fine for the dashboard, wrong for a public marketing/SEO site. You need a different tool for the marketing app specifically. See §3.1 below.
- **Legal pages are only listed in the footer** (§32) but never scoped as content to actually write (Privacy Policy, Terms, Cookie notice). For a payments-handling product these need real legal drafting, not placeholder text, before public launch.

---

## 3. The Refined Plan

Everything from your original document is preserved conceptually — I'm not cutting scope, I'm **sequencing it** and fixing the accuracy risks above.

### 3.1 Tech recommendation for the site itself
- **Framework:** Next.js or Astro, deployed static/SSR (not the Vite SPA pattern your dashboard uses). Astro if the site is mostly content with light interactivity; Next.js if you want one React codebase across marketing + app and can share more components.
- **Location:** new `apps/marketing` in your existing Turborepo, importing `packages/ui` for shared design tokens/components and `packages/types` where relevant (e.g., typed pricing/plan data).
- **Content:** MDX or a lightweight headless CMS for Resources/FAQ/Use Case pages so non-engineers can edit copy later without a deploy for every typo.
- **Hosting:** Vercel/Netlify/Cloudflare Pages for CDN + image optimization out of the box — satisfies your Core Web Vitals goals (§28) with far less manual work than self-hosting.

### 3.2 Phase 0 — Minimum honest site (launch this first, ~1–2 weeks)
Ship only what's needed to stop being invisible and start collecting real interest, with zero overpromising:

| Page | Purpose | Primary CTA |
|---|---|---|
| **Home** | Hero, problem/value, product overview grid, role-based value, final CTA (trimmed version of your §4) | Book a Demo |
| **Product Overview** | One page covering all modules at a glance with real screenshots | Book a Demo |
| **Pricing** | Even if it's "Contact us" only for now — don't fake tiers you can't honor yet | Contact Sales |
| **Contact / Book a Demo** | Real form → your inbox/CRM | Submit |
| **Support** | Where to email/reach you — doesn't need a help center yet | Contact |
| **Sign In** | Links to the real dashboard login | — |
| **Privacy Policy / Terms** | Minimum viable legal text (get this properly drafted — payments product) | — |
| **404 page** | Basic | — |

This alone lets you go live, start SEO indexing, and put a real URL in front of people — while the payment-atomicity and CI gates in your README get closed out.

### 3.3 Phase 1 — Feature depth (your original §7–17, unchanged in content)
Once Phase 0 is live, build out the individual module pages in this order — roughly matching restaurant buying priorities (what a prospect asks about first):
1. POS & Orders
2. Menu Management
3. QR Customer Ordering (this is your strongest differentiator vs. legacy POS — consider promoting it earlier in nav than your current alphabetical-ish ordering)
4. Kitchen Operations
5. Billing & Payments *(hold public claims here tightly aligned to what's actually live — this is the page most likely to be scrutinized by a skeptical buyer)*
6. Staff & Roles
7. Inventory
8. Analytics & Reports
9. Multi-Branch
10. Security & Reliability *(be conservative here too — no compliance claims until verified)*

Each page follows your §6 template — that template is good as-is, keep it.

### 3.4 Phase 2 — Conversion + trust layer
- Solutions/Use Cases (§19)
- About (§21)
- FAQ (§24)
- Flip **Get Started** from "Book a Demo" to real self-serve signup **only once** the README's P0 release gate (atomic payments, full CI pass, production secrets) is actually satisfied.

### 3.5 Phase 3 — SEO & content engine
- Resources/guides, glossary, topic clusters (§20, §26–27) — this is a long-term compounding investment, correctly sequenced last since it needs the product pages (Phase 1) to link into.

### 3.6 Phase 4 — Polish
- Full accessibility audit (§29), performance measurement (§28), analytics event taxonomy (§33), structured data validation, launch checklist (§38).

---

## 4. What Changed vs. Your Original Document, at a Glance

| Your plan said | Refined |
|---|---|
| One big buildout, 20+ pages, everything mapped upfront | Same end-state, split into Phase 0 (ship in ~2 weeks) → Phase 3 |
| "Get Started" = self-serve signup CTA everywhere | "Book a Demo" as primary CTA until README's P0 payment/CI gate is closed, then flip |
| Site structure/pages not tied to a specific stack | Next.js/Astro in a new `apps/marketing` workspace, reusing `packages/ui` |
| Legal pages listed only in footer nav | Called out explicitly as Phase-0, real-drafting-required content |
| No stated launch order for feature pages | Ordered by buyer priority, with QR ordering promoted (your real differentiator) |

Everything else in your original document — the SEO strategy, performance rules, accessibility checklist, design direction, footer structure, analytics plan, and content rules — was already correct and doesn't need changes. It's genuinely solid work.
