import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("../../../orders/hooks/useOrders", () => ({
  useOrders: vi.fn(() => ({ data: [] })),
}));
import { HomePage } from "@/features/home/pages/HomePage";
describe("HomePage", () => {
  it("renders empty state", () => {
    const html = renderToStaticMarkup(
      <HomePage
        onNewOrder={vi.fn()}
        onViewOrders={vi.fn()}
        onSelectOrder={vi.fn()}
      />,
    );
    expect(html).toContain("Good evening");
    expect(html).toContain("All caught up");
  });
});
