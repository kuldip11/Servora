import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "../StatCard";
import { BarChart3 } from "lucide-react";

describe("StatCard", () => {
  it("renders title, value and subtitle", () => {
    render(
      <StatCard title="Sales" value={120} subtitle="Today" icon={BarChart3} />,
    );
    expect(screen.getByText("Sales")).toBeVisible();
    expect(screen.getByText("120")).toBeVisible();
    expect(screen.getByText("Today")).toBeVisible();
  });
  it("uses the card surface, border and shadow styles", () => {
    const { container } = render(
      <StatCard title="Sales" value={120} icon={BarChart3} />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveClass(
      "bg-surface",
      "border",
      "border-border",
      "rounded-lg",
      "shadow-sm",
    );
  });
  it("renders positive and negative trends", () => {
    const { rerender } = render(
      <StatCard
        title="Sales"
        value="1"
        icon={BarChart3}
        trend={{ value: 4, label: "this week" }}
      />,
    );
    expect(screen.getByText(/↑ 4% this week/)).toBeVisible();
    rerender(
      <StatCard
        title="Sales"
        value="1"
        icon={BarChart3}
        trend={{ value: -2, label: "this week" }}
      />,
    );
    expect(screen.getByText(/↓ 2% this week/)).toBeVisible();
  });
});
