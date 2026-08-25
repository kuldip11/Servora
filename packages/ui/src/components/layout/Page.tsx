import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Container, type ContainerProps } from "./Container";
import { Stack } from "./Stack";

export interface PageProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** @default 'xl' */
  containerSize?: ContainerProps["size"];
  /** Set false for a full-bleed page (e.g. Kitchen Display's board) that manages its own width. */
  contained?: boolean;
}

/**
 * Top-level page wrapper: consistent padding + vertical rhythm between
 * a `PageHeader` and however many `Section`/`Card` blocks follow.
 * Replaces the `<div className="p-6 space-y-6">` every page currently
 * repeats by hand.
 */
export function Page({
  children,
  containerSize = "xl",
  contained = true,
  className,
  ...props
}: PageProps) {
  const content = (
    <Stack gap="lg" className={cn("py-6", className)} {...props}>
      {children}
    </Stack>
  );

  if (!contained) return content;

  return <Container size={containerSize}>{content}</Container>;
}
