import { useSyncExternalStore } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn";
import type { StatusTone } from "../StatusBadge";

export interface ToastInput {
  title: string;
  description?: string | undefined;
  /** @default 'neutral' — same tone vocabulary as `StatusBadge`, so a toast and
   * a status badge for the same event always agree on what color means what. */
  tone?: StatusTone | undefined;
  /** Milliseconds before auto-dismiss. @default 5000 */
  duration?: number | undefined;
  /** Overrides the screen-reader announcement priority Radix derives from
   * `tone` below (`RadixToast.Root`'s `type` prop — `'foreground'` =>
   * `aria-live="assertive"`, announced immediately, may interrupt
   * whatever the screen reader is currently reading; `'background'` =>
   * `aria-live="polite"`, announced at the next natural pause). Radix's
   * own guidance (`radix-ui.com/primitives/docs/components/toast`):
   * reserve `'foreground'` for toasts that are the direct result of a
   * user action, and avoid stacking distinct foreground toasts — so the
   * tone-based default below is right for most callers; this exists for
   * the exception, not the common case. */
  priority?: "foreground" | "background" | undefined;
}
interface ToastItem extends ToastInput {
  id: string;
}

// Minimal module-level pub/sub instead of a new state-management dependency
// (no zustand/jotai in `packages/ui` today, and one boolean-array store isn't
// enough reason to add one) — `Toaster` subscribes via `useSyncExternalStore`,
// `toast()` is callable from anywhere, including outside React (an API client's
// error handler, say), which an imperative function needs to support anyway.
let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => toasts;

function nextId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Which `RadixToast.Root` `type` a given tone should announce as, when the
 * caller hasn't set `priority` explicitly. `danger`/`warning` are the
 * "something needs attention now" tones — worth an assertive interrupt, the
 * case Radix's docs describe `'foreground'` for. `success`/`info`/`neutral`
 * are routine, non-blocking confirmations — `'background'`/polite, so they
 * don't interrupt or queue-clear whatever a screen reader user is already
 * doing (Radix's own docs warn `'foreground'` "may choose to clear
 * previously queued messages" — the wrong behavior for a routine "Saved"
 * toast next to, say, an in-progress error announcement). */
const TONE_PRIORITY: Record<StatusTone, "foreground" | "background"> = {
  danger: "foreground",
  warning: "foreground",
  success: "background",
  info: "background",
  neutral: "background",
};

/** Queue a toast from anywhere in the app — no hook, no context read required. */
export function toast(input: ToastInput) {
  const id = nextId();
  toasts = [...toasts, { id, duration: 5000, tone: "neutral", ...input }];
  emit();
  return id;
}

function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const TONE_ICON: Record<StatusTone, typeof Info> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  neutral: Info,
};

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "border-border text-success",
  warning: "border-border text-warning",
  danger: "border-border text-danger",
  info: "border-border text-info",
  neutral: "border-border text-text-secondary",
};

/** Phase 8: slide+fade enter/exit, plus wiring for Radix's swipe-to-dismiss
 * gesture — `Toaster` passes `swipeDirection="right"` below, so a real
 * drag gesture needs to track the pointer 1:1 (`data-[swipe=move]` with
 * `transition-none`, or the toast would visibly lag the finger), snap back
 * on a cancelled swipe (`data-[swipe=cancel]`), and animate out along the
 * same axis on a completed one (`data-[swipe=end]`) — three distinct
 * behaviors the swipe CSS vars Radix exposes
 * (`--radix-toast-swipe-move-x`/`-end-x`) exist specifically to drive.
 * This is the same pattern shadcn/ui's own `Toast` uses, verified against
 * their source rather than assumed, since the three `data-[swipe=*]`
 * states are easy to get subtly wrong (e.g. leaving `transition-none` off
 * `move` makes the drag feel laggy in a way that's obvious once you try
 * it, but not from reading the classes alone — flagging since this pass
 * has no real browser to actually try it in, same standing caveat as
 * every phase since Phase 4). */
const toastAnimationClasses = cn(
  "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform] data-[swipe=cancel]:duration-fast data-[swipe=cancel]:ease-standard",
  "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
  "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
  "data-[state=open]:animate-in data-[state=open]:duration-base data-[state=open]:ease-decelerate",
  "data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-full",
  "data-[state=closed]:animate-out data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
  "data-[state=closed]:fade-out-80",
  "data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full",
);

/**
 * Mount once near the app root (sibling to `ThemeProvider`). Renders
 * whatever `toast()` has queued.
 *
 * **Correction (Session 10, docs/accessibility): this comment
 * previously said "not wired into any app's `main.tsx`, no real call
 * site yet" — that's stale, and was already stale before this
 * session.** All three apps' `main.tsx` mount `<Toaster />` (Phase 14's
 * "toast consolidation" migration off `react-hot-toast`, per each
 * `main.tsx`'s own inline comment) — this is real, in-production UI,
 * not a hypothetical, which is exactly why this session's `priority`/
 * `aria-live` fix (see `ToastInput.priority` and `TONE_PRIORITY` above)
 * matters immediately rather than only in theory.
 */
export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <RadixToast.Provider swipeDirection="right">
      {items.map((t) => {
        const tone = t.tone ?? "neutral";
        const Icon = TONE_ICON[tone];
        return (
          <RadixToast.Root
            key={t.id}
            type={t.priority ?? TONE_PRIORITY[tone]}
            {...(t.duration !== undefined && { duration: t.duration })}
            onOpenChange={(open) => !open && dismiss(t.id)}
            className={cn(
              "flex items-start gap-3 rounded-md border bg-surface shadow-elevated p-4 w-full",
              TONE_CLASSES[tone],
              toastAnimationClasses,
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <RadixToast.Title className="text-sm font-semibold text-text-primary">
                {t.title}
              </RadixToast.Title>
              {t.description && (
                <RadixToast.Description className="text-sm text-text-secondary mt-0.5">
                  {t.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close
              aria-label="Dismiss"
              className="shrink-0 text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              <X className="w-4 h-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        );
      })}
      <RadixToast.Viewport className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 w-full max-w-sm outline-none" />
    </RadixToast.Provider>
  );
}
