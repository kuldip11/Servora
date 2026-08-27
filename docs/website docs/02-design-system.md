# 02 — Design System

**Source of truth**: `packages/ui/src/theme/tokens.css` and
`packages/ui/tailwind-preset.js` in the Servora monorepo. These are the
*real* values already shipping in the dashboard, waiter app, and kitchen
display — the marketing site reuses them rather than inventing a new palette,
per the master plan's "single design system across marketing and application"
goal.

## 1. Color Tokens (light theme — marketing site default)

| Token | Value | Use |
|---|---|---|
| `--background` | `#f9fafb` | Page background |
| `--surface` | `#ffffff` | Cards, nav bar, modals |
| `--surface-secondary` | `#f3f4f6` | Subtle section backgrounds, alternating rows |
| `--text-primary` | `#111827` | Headlines, body copy |
| `--text-secondary` | `#4b5563` | Subheads, captions |
| `--text-disabled` | `#6b7280` | Disabled/placeholder text |
| `--border` | `#e5e7eb` | Card borders, dividers between sections |
| `--divider` | `#f3f4f6` | Hairlines within a card |
| `--primary` | `#7c3aed` (violet-600) | Primary buttons, links, active nav state |
| `--primary-hover` | `#6d28d9` (violet-700) | Hover/active state |
| `--primary-surface` | `#f5f3ff` (violet-50) | Highlighted panels, selected states |
| `--primary-border` | `#ddd6fe` (violet-200) | Border on primary-tinted elements |
| `--primary-foreground` | `#ffffff` | Text on solid primary buttons (AA-passing, 5.70:1) |
| `--success` | `#047857` | Confirmation states, "included" checkmarks |
| `--warning` | `#92400e` | Caution copy (e.g. "beta" labels, if ever used) |
| `--danger` | `#b91c1c` | Error states in forms |
| `--info` | `#1d4ed8` | Informational callouts |

**Do not introduce a new accent color for marketing.** Violet is the brand
color across the entire product; the marketing site should feel like the
same company, not a separate agency-designed brand wrapped around it.

**Dark mode**: the app's dark theme (used by Kitchen Display) exists but is
tuned for a low-light kitchen environment (amber accent on near-black). It is
**not** appropriate for the public marketing site's default experience — do
not port it 1:1. If a dark mode toggle is wanted for the marketing site later,
design it separately for a daylight/reading context, not lifted from KDS.

## 2. Typography

- **Typeface**: Inter (already the product's font — `apps/web/src/index.css`),
  loaded via `next/font/google` or a self-hosted variable font file for
  performance (avoid a render-blocking Google Fonts `<link>`).
- **Fallback stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Scale** (marketing needs a bigger display scale than the dashboard has,
  since the dashboard has no hero/landing typography — add these on top of
  the shared tokens, don't remove anything from the shared set):

| Role | Size (desktop) | Size (mobile) | Weight |
|---|---|---|---|
| Display / Hero H1 | 56px / 1.1 | 34px / 1.15 | 700 |
| H2 (section) | 40px / 1.15 | 28px / 1.2 | 700 |
| H3 (subsection/card title) | 24px / 1.3 | 20px / 1.3 | 600 |
| Body large (hero subhead) | 20px / 1.6 | 17px / 1.6 | 400 |
| Body | 16px / 1.6 | 16px / 1.6 | 400 |
| Small / caption | 14px / 1.5 | 13px / 1.5 | 400/500 |

## 3. Spacing & Radius

Reuse shared tokens directly — do not redefine:
- Radius: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`,
  `--radius-xl: 24px`
- Spacing base unit: 4px, scale `4 / 8 / 16 / 24` px from tokens, extended
  for marketing's larger sections with an 8-point scale up to 128px for
  section vertical padding (`py-16` desktop / `py-10` mobile as a default
  section rhythm).
- Shadows: reuse `--shadow-sm`, `--shadow-md`, `--shadow-dropdown` exactly —
  these are already tuned and used across the product.

## 4. Layout Grid

- Max content width: `1280px`, centered, `24px` horizontal gutter mobile /
  `48px` desktop.
- 12-column grid on desktop, 4-column on mobile.
- Section vertical rhythm: every full-width section gets consistent
  `py-16`/`py-24` (desktop) so scroll pacing feels intentional, not ad hoc
  per page.

## 5. Core Marketing Components (visual spec — see `03` for behavior/props)

- **Button** — reuse `packages/ui`'s Button primitive and variants
  (primary/secondary/ghost). Do not build a new button component for
  marketing; import the shared one so hover/focus states match the app.
- **Card** — `bg-surface`, `border border-border`, `rounded-lg`,
  `shadow-card` on hover only (flat by default, elevated on hover) —
  matches existing dashboard card behavior.
- **Badge/Pill** — for labels like "Differentiator" in the product mega-menu,
  or module tags on feature pages. Use `primary-surface` background +
  `primary` text, `rounded-full`, small caps or 12px medium weight.
- **Nav bar** — sticky, `bg-surface` with `shadow-sm` on scroll only (transparent
  over hero on `/`, solid once scrolled past 64px).

## 6. Iconography

Use the same icon set already in `packages/ui` (check for `lucide-react` or
whichever set the dashboard uses — do not introduce a second icon library,
which bloats bundle size and creates visual inconsistency between a feature
page's icon and the icon the dashboard actually uses for that same feature).

## 7. Imagery / Screenshots

- Use **real product screenshots**, not stock photography or invented UI
  mockups, for every feature page. This is the single highest-leverage trust
  signal for a pre-revenue product — fake "dashboard" illustrations are an
  instant credibility red flag to a restaurant owner who has seen a dozen
  POS pitch decks.
- Screenshot chrome: crop to content, add a subtle `shadow-elevated` +
  `rounded-lg` frame, optionally a thin browser/device bezel — keep it
  consistent across every page (define one `<ProductScreenshot>` component,
  see `03`).
- Do not retouch screenshots to show data/numbers that look like real
  customer metrics (e.g., a fake "$45,231 today" on a demo dashboard reads
  as a real customer claim to a visitor).

## 8. Motion

Reuse the product's existing motion tokens (`packages/ui/src/animations/tokens.ts`):
durations `100/150/200/300/500ms`, easing `standard/decelerate/accelerate/spring`.
Marketing-specific additions: scroll-reveal fade-up for section entrances
(`translateY(12px)→0`, `opacity 0→1`, `duration-slow`, `ease-decelerate`),
used sparingly — not on every single element, which reads as gimmicky.
