import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "../BottomSheet";

describe("BottomSheet", () => {
  it("renders open sheet content and closes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onClose={onOpenChange} title="Actions">
        Action list
      </BottomSheet>,
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});
