import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NumberInput } from "../NumberInput";

describe("NumberInput", () => {
  it("increments and clamps through stepper buttons", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(
      <NumberInput label="Qty" value={2} min={0} max={3} onChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Increase value" }));
    expect(onChange).toHaveBeenCalledWith(3);
    view.rerender(
      <NumberInput label="Qty" value={3} min={0} max={3} onChange={onChange} />,
    );
    expect(
      screen.getByRole("button", { name: "Increase value" }),
    ).toBeDisabled();
  });
  it("can hide steppers and reports typed numeric values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(
      <NumberInput
        label="Qty"
        value={2}
        showSteppers={false}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton", { name: "Qty" });
    await user.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(0);
    view.rerender(
      <NumberInput
        label="Qty"
        value={0}
        showSteppers={false}
        onChange={onChange}
      />,
    );
    await user.type(input, "5");
    expect(onChange).toHaveBeenLastCalledWith(5);
    expect(
      screen.queryByRole("button", { name: "Increase value" }),
    ).not.toBeInTheDocument();
  });
});
