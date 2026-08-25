import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Page } from "../Page";

describe("Page", () => {
  it("contains content by default and can render full-bleed", () => {
    const { rerender } = render(<Page>Dashboard</Page>);
    expect(screen.getByText("Dashboard")).toBeVisible();
    rerender(<Page contained={false}>Board</Page>);
    expect(screen.getByText("Board")).toBeVisible();
  });
});
