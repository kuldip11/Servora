import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("../../hooks/useOrders", () => ({
  useOrders: vi.fn(() => ({
    data: [],
    isLoading: false,
    refetch: vi.fn(),
    isFetching: false,
  })),
}));
import { OrdersPage } from "../OrdersPage";
describe("OrdersPage", () => {
  it("renders empty active state", () => {
    const html = renderToStaticMarkup(<OrdersPage onSelectOrder={vi.fn()} />);
    expect(html).toContain("Orders");
    expect(html).toContain("No orders");
  });
});
