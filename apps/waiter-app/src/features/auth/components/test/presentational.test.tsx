import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BranchSelector } from "@/features/auth/components/BranchSelector";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { MembershipSelector } from "@/features/auth/components/MembershipSelector";
describe("auth components", () => {
  it("renders auth UI", () => {
    expect(
      renderToStaticMarkup(<LoginForm onSubmit={vi.fn()} loading={false} />),
    ).toContain("Sign In");
    expect(
      renderToStaticMarkup(
        <BranchSelector branches={[]} onSelect={vi.fn()} onBack={vi.fn()} />,
      ),
    ).toContain("Which branch today?");
    expect(
      renderToStaticMarkup(
        <MembershipSelector memberships={[]} onSelect={vi.fn()} />,
      ),
    ).toContain("Choose your business");
  });
});
