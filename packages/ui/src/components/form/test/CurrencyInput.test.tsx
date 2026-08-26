import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CurrencyInput } from "../CurrencyInput";

describe("CurrencyInput", () => {
  it("formats a numeric value and reports numeric edits", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CurrencyInput
        label="Price"
        value={12}
        currencySymbol="₹"
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Price" });
    expect(input).toHaveValue("12.00");
    await user.clear(input);
    await user.type(input, "25.5");
    expect(onChange).toHaveBeenLastCalledWith(25.5);
  });
  it("rejects non-numeric characters while typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput label="Price" value={0} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Price" });
    await user.clear(input);
    await user.type(input, "1a");
    expect(input).toHaveValue("1");
  });
});
