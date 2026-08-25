import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkipLink } from "../SkipLink";

describe("SkipLink", () => {
  it("links to the configured main content target", () => {
    render(<SkipLink targetId="content">Skip content</SkipLink>);
    expect(screen.getByRole("link", { name: "Skip content" })).toHaveAttribute(
      "href",
      "#content",
    );
  });
});
