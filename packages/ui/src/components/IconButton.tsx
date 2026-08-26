import {
  type ButtonHTMLAttributes,
  type ComponentType,
  forwardRef,
} from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../utils/cn";
import {
  BUTTON_VARIANT_CLASSES,
  BUTTON_ICON_SIZE_CLASSES,
  type ButtonVariant,
  type ButtonSize,
} from "./Button";

const PADDING: Record<ButtonSize, string> = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
};

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label"
> {
  icon: ComponentType<{ className?: string }>;
  /**
   * Required, not optional — an icon-only button has no accessible name
   * without it. `docs/frontend/COMPONENT_GUIDE.md`'s a11y section calls
   * this out directly ("An icon-only button ... needs `aria-label`").
   */
  "aria-label": string;
  /** @default 'ghost' */
  variant?: ButtonVariant;
  /** @default 'md' */
  size?: ButtonSize;
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      variant = "ghost",
      size = "md",
      loading,
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
          "inline-flex items-center justify-center rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast ease-standard",
          PADDING[size],
          BUTTON_VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2
            className={cn("animate-spin", BUTTON_ICON_SIZE_CLASSES[size])}
          />
        ) : (
          <Icon className={BUTTON_ICON_SIZE_CLASSES[size]} />
        )}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
