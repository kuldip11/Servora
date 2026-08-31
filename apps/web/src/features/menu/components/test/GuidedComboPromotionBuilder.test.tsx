import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuidedComboPromotionBuilder } from "../GuidedComboPromotionBuilder";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const toast = vi.hoisted(() => vi.fn());
vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { get: api.get, post: api.post },
  extractApiError: (error: unknown) => error instanceof Error ? error.message : "Request failed",
}));
vi.mock("../../../../shared/auth/permissions", () => ({
  usePermissions: () => ({ has: () => true }),
}));
vi.mock("@pos/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pos/ui")>()),
  toast,
}));

const categories = [{
  id: "cat-1",
  name: "Mains",
  menuItems: [
    { id: "item-1", name: "Burger", isPublished: true, status: "ACTIVE" },
    { id: "item-2", name: "Fries", isPublished: true, status: "ACTIVE" },
  ],
}];

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  toast.mockReset();
  api.get.mockResolvedValue({ data: { data: categories } });
  api.post.mockImplementation(async (url: string) => {
    if (url === "/menu/combos/preview") return { data: { data: { resolvedTotal: 299 } } };
    if (url === "/menu/promotions/preview") return { data: { data: { subtotal: 200, discountAmount: 20, totalAmount: 180 } } };
    return { data: { data: { id: "created" } } };
  });
});

describe("GuidedComboPromotionBuilder", () => {
  it("previews and creates combos and promotions through server-authoritative endpoints", async () => {
    render(<GuidedComboPromotionBuilder />);
    await screen.findByText("Guided combo builder");

    fireEvent.change(screen.getByLabelText("Combo name"), { target: { value: "Lunch combo" } });
    fireEvent.change(screen.getByLabelText("Fixed price"), { target: { value: "299" } });
    const itemSelectors = screen.getAllByLabelText("Menu item");
    fireEvent.change(itemSelectors[0]!, { target: { value: "item-1" } });
    fireEvent.change(itemSelectors[1]!, { target: { value: "item-2" } });

    fireEvent.click(screen.getByRole("button", { name: "Preview authoritative price" }));
    expect(await screen.findByText("Resolved total: ₹299.00")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create combo" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/menu/combos", expect.objectContaining({ name: "Lunch combo" })));

    fireEvent.click(screen.getByRole("button", { name: "Create promotion" }));
    fireEvent.change(screen.getByLabelText("Promotion name"), { target: { value: "Weekday special" } });
    fireEvent.change(screen.getByLabelText("Preview against menu item"), { target: { value: "item-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview authoritative discount" }));
    expect(await screen.findByText("Sample: ₹200.00 − ₹20.00 → ₹180.00")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create promotion" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/menu/promotions", expect.objectContaining({ name: "Weekday special", scope: "ORDER" })));
  });

  it("keeps save disabled and surfaces server validation errors when preview fails", async () => {
    api.post.mockRejectedValueOnce(new Error("Selected combo item is unavailable"));
    render(<GuidedComboPromotionBuilder />);
    await screen.findByText("Guided combo builder");
    fireEvent.change(screen.getByLabelText("Combo name"), { target: { value: "Bad combo" } });
    const itemSelectors = screen.getAllByLabelText("Menu item");
    fireEvent.change(itemSelectors[0]!, { target: { value: "item-1" } });
    fireEvent.change(itemSelectors[1]!, { target: { value: "item-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview authoritative price" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Selected combo item is unavailable", tone: "danger" })));
    expect((screen.getByRole("button", { name: "Create combo" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
