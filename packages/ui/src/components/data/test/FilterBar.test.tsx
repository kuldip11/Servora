import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "../FilterBar";

describe("FilterBar", () => {
  it("renders children and clears filters when requested", async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    render(
      <FilterBar onClearAll={onClearAll}>
        <input aria-label="Search" />
      </FilterBar>,
    );
    expect(screen.getByLabelText("Search")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
  it("omits the clear action when no handler is supplied", () => {
    render(
      <FilterBar>
        <span>Filters</span>
      </FilterBar>,
    );
    expect(
      screen.queryByRole("button", { name: /clear filters/i }),
    ).not.toBeInTheDocument();
  });
});
