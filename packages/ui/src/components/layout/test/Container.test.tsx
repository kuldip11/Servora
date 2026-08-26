import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Container } from "../Container";

describe("Container", () => {
  it("renders content with the selected width and element type", () => {
    render(
      <Container size="sm" as="main">
        Content
      </Container>,
    );
    expect(screen.getByRole("main")).toHaveClass("max-w-screen-sm");
  });
});
