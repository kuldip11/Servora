import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("../../../auth", () => ({
  getToken: () => null,
  logout: vi.fn(),
  KitchenLogin: () => <div>login</div>,
}));
vi.mock("../../pages/KitchenBoard", () => ({
  KitchenBoard: () => <div>board</div>,
}));
import { KitchenApp } from "../KitchenApp";
describe("KitchenApp", () =>
  it("renders login when no token", () =>
    expect(renderToStaticMarkup(<KitchenApp />)).toContain("login")));
