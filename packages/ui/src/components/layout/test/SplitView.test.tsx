import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SplitView } from "../SplitView";

describe("SplitView", () => {
  it("renders both panes and scopes the primary width", () => {
    render(
      <SplitView
        primary={<div>List</div>}
        secondary={<div>Details</div>}
        primaryWidth="400px"
      />,
    );
    expect(screen.getByText("List")).toBeVisible();
    expect(screen.getByText("Details")).toBeVisible();
    expect(screen.getByText("List").parentElement).toHaveStyle({
      "--split-primary-width": "400px",
    });
  });
});
