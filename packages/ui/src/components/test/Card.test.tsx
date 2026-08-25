import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "../Card";

describe("Card", () => {
  it("renders children with default padding", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toHaveClass("p-lg");
  });
  it("supports interactive styling and custom element type", () => {
    render(
      <Card as="section" interactive padding="sm">
        Details
      </Card>,
    );
    const section = screen.getByText("Details");
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveClass("p-sm", "cursor-pointer");
  });
});
