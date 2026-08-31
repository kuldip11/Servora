import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Stack } from "./Stack";

export interface SectionProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;

  actions?: ReactNode;
}

export function Section({
  children,
  title,
  description,
  actions,
  className,
  ...props
}: SectionProps) {
  return (
    <section className={cn(className)} {...props}>
      {(title || description || actions) && (
        <Stack
          direction="row"
          justify="between"
          align="start"
          gap="md"
          className="mb-md"
        >
          <div>
            {title && (
              <h2 className="text-base font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </Stack>
      )}
      {children}
    </section>
  );
}
