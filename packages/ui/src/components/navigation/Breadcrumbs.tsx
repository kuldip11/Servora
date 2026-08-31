import type { ElementType } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string | undefined;
  /** Router `Link`-like component, e.g. `@tanstack/react-router`'s `Link`. Omit to render a plain `<a>`. */
  as?: ElementType | undefined;
  linkProps?: Record<string, unknown> | undefined;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string | undefined;
}

/**
 * Page hierarchy trail (the design-system contract Phase 6) — meant
 * for `PageHeader`'s `eyebrow` slot (see that Phase 2 component's doc
 * comment, which already anticipates this).
 *
 * The last item is always rendered as the current page: plain text,
 * `aria-current="page"`, no link — even if it's passed `href`/`as`,
 * since a breadcrumb never links to the page you're already on.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const As = item.as;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-text-disabled shrink-0"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-text-primary font-medium"
                >
                  {item.label}
                </span>
              ) : As ? (
                <As
                  {...item.linkProps}
                  className="text-text-secondary hover:text-text-primary transition-colors duration-fast ease-standard"
                >
                  {item.label}
                </As>
              ) : (
                <a
                  href={item.href}
                  className="text-text-secondary hover:text-text-primary transition-colors duration-fast ease-standard"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
