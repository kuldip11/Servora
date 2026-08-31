import { useSyncExternalStore } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn";
import type { StatusTone } from "../StatusBadge";

export interface ToastInput {
  title: string;
  description?: string | undefined;

  tone?: StatusTone | undefined;

  duration?: number | undefined;

  priority?: "foreground" | "background" | undefined;
}
interface ToastItem extends ToastInput {
  id: string;
}

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => toasts;

const nextId = () => {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const TONE_PRIORITY: Record<StatusTone, "foreground" | "background"> = {
  danger: "foreground",
  warning: "foreground",
  success: "background",
  info: "background",
  neutral: "background",
};

export const toast = (input: ToastInput) => {
  const id = nextId();
  toasts = [...toasts, { id, duration: 5000, tone: "neutral", ...input }];
  emit();
  return id;
};

const dismiss = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

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

export const Toaster = () => {
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
};
