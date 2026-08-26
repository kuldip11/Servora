import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders a labeled badge with a status dot by default", () => {
    const { container } = render(<StatusBadge label="Paid" tone="success" />);
    expect(screen.getByText("Paid")).toBeVisible();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
  it("can hide the dot and supports neutral tone", () => {
    const { container } = render(
      <StatusBadge label="Draft" dot={false} tone="neutral" />,
    );
    expect(screen.getByText("Draft")).toHaveClass("bg-surface-secondary");
    expect(
      container.querySelector('[aria-hidden="true"]'),
    ).not.toBeInTheDocument();
  });
});
