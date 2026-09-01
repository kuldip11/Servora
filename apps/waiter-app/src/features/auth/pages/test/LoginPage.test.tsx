import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("../../hooks/useLogin", () => ({
  useLogin: vi.fn(() => ({
    step: "credentials",
    memberships: [],
    branches: [],
    submitCredentials: vi.fn(),
    selectMembership: vi.fn(),
    selectBranchForMembership: vi.fn(),
    isLoading: false,
    resetToCredentials: vi.fn(),
  })),
}));
import { LoginPage } from "@/features/auth/pages/LoginPage";
describe("LoginPage", () => {
  it("renders credentials step", () =>
    expect(renderToStaticMarkup(<LoginPage onLogin={vi.fn()} />)).toContain(
      "Sign in to start taking orders",
    ));
});
