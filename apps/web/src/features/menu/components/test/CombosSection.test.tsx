import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { listCombos, updateCombo, createCombo, removeCombo } = vi.hoisted(
  () => ({
    listCombos: vi.fn(),
    updateCombo: vi.fn(),
    createCombo: vi.fn(),
    removeCombo: vi.fn(),
  }),
);

vi.mock("@pos/api-client", () => ({
  createMenuApi: () => ({ listCombos, updateCombo, createCombo, removeCombo }),
}));
vi.mock("@/features/menu/hooks/useMenuCategories", () => ({
  useMenuCategories: () => ({
    data: [
      {
        id: "category-1",
        name: "Mains",
        menuItems: [
          {
            id: "item-1",
            name: "Chicken Tikka",
            isPublished: true,
            status: "ACTIVE",
            variants: [{ id: "variant-1", name: "Half" }],
          },
        ],
      },
    ],
  }),
}));
vi.mock("@/shared/lib/query-client", () => ({
  queryClient: { invalidateQueries: vi.fn() },
}));
vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {},
  extractApiError: (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error",
}));

import { CombosSection } from "@/features/menu/components/CombosSection";

const renderSection = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CombosSection />
    </QueryClientProvider>,
  );
};

describe("CombosSection", () => {
  it("loads an existing combo into the editor and saves a structural update", async () => {
    listCombos.mockResolvedValue([
      {
        id: "combo-1",
        name: "Lunch Combo",
        description: "Main + side",
        pricePolicy: "FIXED",
        fixedPrice: "299.00",
        percentOff: null,
        slots: [
          {
            id: "slot-1",
            name: "Main",
            minSelections: 1,
            maxSelections: 1,
            options: [
              {
                id: "option-1",
                menuItemId: "item-1",
                variantId: "variant-1",
                upcharge: "10.00",
                isUnlimitedRefill: false,
              },
            ],
          },
        ],
      },
    ]);
    updateCombo.mockResolvedValue({ id: "combo-1" });

    renderSection();
    await screen.findByText("Lunch Combo");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const name = screen.getByLabelText("Combo name");
    fireEvent.change(name, { target: { value: "Dinner Combo" } });
    fireEvent.click(screen.getByRole("button", { name: "Save combo" }));

    await waitFor(() =>
      expect(updateCombo).toHaveBeenCalledWith(
        "combo-1",
        expect.objectContaining({
          name: "Dinner Combo",
          fixedPrice: 299,
          slots: [
            expect.objectContaining({
              name: "Main",
              options: [
                expect.objectContaining({
                  menuItemId: "item-1",
                  variantId: "variant-1",
                  upcharge: 10,
                }),
              ],
            }),
          ],
        }),
      ),
    );
  });
});
