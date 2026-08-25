import { toast } from '@pos/ui';
import { getErrorMessage } from './errors';

// Phase 14 bundle-analysis finding: `@pos/ui` has shipped a full
// `Toast`/`toast()`/`Toaster` (Phase 5, hardened for swipe-to-dismiss in
// Phase 8) since early in this project, but its own doc comment says
// plainly it was never wired into any app's `main.tsx` — "no real call
// site to verify placement against yet, so adding it unused risks
// silently getting it wrong." That was the right call at the time. Every
// app shipped `react-hot-toast` instead, so the bundle carried two full
// toast implementations, only one of them actually mounted anywhere.
//
// This file (`notifyError`/`notifySuccess`) is the single choke point 48
// files across `apps/web` call through instead of hitting
// `react-hot-toast` directly (confirmed by grep), so redirecting it here
// is the highest-leverage fix available — one file instead of 48. The
// direct-import files (`main.tsx`, `DashboardLayout.tsx`, `LoginPage.tsx`,
// `SignupPage.tsx`) are migrated alongside this one; so are Waiter App's
// and Kitchen Display's own direct `react-hot-toast` call sites (neither
// has an equivalent wrapper to centralize through). `react-hot-toast` is
// dropped from all 3 apps' `package.json` once every call site is moved.
//
// **Flagged, not hidden:** mounting `@pos/ui`'s `Toaster` for real (see
// each app's `main.tsx`) moves the toast viewport from wherever
// `react-hot-toast` was positioned to `Toaster`'s fixed bottom-right —
// see each `main.tsx`'s own note on that. This is also the first time
// `Toaster`'s swipe-to-dismiss CSS renders in an actual browser; worth a
// manual check, same standing caveat every phase since Phase 4 has
// carried for its own changes.
/**
 * Thin wrapper so mutation `onError` handlers don't each re-implement
 * `toast({ title: err?.response?.data?.message ?? '...', tone: 'danger' })`.
 * Use as:
 *
 *   onError: (err) => notifyError(err, 'Failed to update order'),
 */
export function notifyError(error: unknown, fallback?: string): void {
  toast({ title: getErrorMessage(error, fallback), tone: 'danger' });
}

export function notifySuccess(message: string): void {
  toast({ title: message, tone: 'success' });
}
