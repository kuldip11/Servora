import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchInput } from "../SearchInput";

describe("SearchInput", () => {
  it("renders an accessible search field and handles changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput label="Search" onChange={onChange} />);
    const input = screen.getByRole("searchbox", { name: "Search" });
    await user.type(input, "orders");
    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue("orders");
  });
});
