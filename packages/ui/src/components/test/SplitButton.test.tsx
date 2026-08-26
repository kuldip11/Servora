import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SplitButton } from "../SplitButton";

describe("SplitButton", () => {
  it("runs the primary action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SplitButton onClick={onClick} actions={[]}>
        Save
      </SplitButton>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it("opens the menu, runs a secondary action and closes it", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <SplitButton
        onClick={() => {}}
        actions={[{ label: "Save as draft", onClick: action }]}
      >
        Save
      </SplitButton>,
    );
    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByRole("menu")).toBeVisible();
    await user.click(screen.getByRole("menuitem", { name: "Save as draft" }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
