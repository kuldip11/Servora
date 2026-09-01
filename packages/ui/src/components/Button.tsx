import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "link" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover focus:ring-primary",
  secondary:
    "bg-surface text-text-primary border border-border hover:bg-surface-secondary focus:ring-border",
  outline:
    "bg-transparent text-primary border border-primary hover:bg-primary-surface focus:ring-primary",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-secondary focus:ring-border",
  link: "bg-transparent text-primary hover:underline underline-offset-4 p-0 h-auto focus:ring-primary",
  danger:
    "bg-danger text-danger-foreground hover:opacity-90 active:opacity-80 focus:ring-danger",
  success:
    "bg-success text-success-foreground hover:opacity-90 active:opacity-80 focus:ring-success",
};

export const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const BUTTON_ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;

  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast ease-standard",
          BUTTON_SIZE_CLASSES[size],
          BUTTON_VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      >
        {loading && (
          <Loader2
            className={cn("animate-spin", BUTTON_ICON_SIZE_CLASSES[size])}
          />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
