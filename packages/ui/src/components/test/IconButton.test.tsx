import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "../IconButton";
import { X } from "lucide-react";

describe("IconButton", () => {
  it("renders an accessible icon-only button and handles clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={X} aria-label="Close" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Close" });
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it("disables and marks itself busy while loading", () => {
    render(<IconButton icon={X} aria-label="Close" loading />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });
});
