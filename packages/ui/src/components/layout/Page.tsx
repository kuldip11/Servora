import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Container, type ContainerProps } from "./Container";
import { Stack } from "./Stack";

export interface PageProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;

  containerSize?: ContainerProps["size"];

  contained?: boolean;
}

export const Page = ({
  children,
  containerSize = "xl",
  contained = true,
  className,
  ...props
}: PageProps) => {
  const content = (
    <Stack gap="lg" className={cn("py-6", className)} {...props}>
      {children}
    </Stack>
  );

  if (!contained) return content;

  return <Container size={containerSize}>{content}</Container>;
};
