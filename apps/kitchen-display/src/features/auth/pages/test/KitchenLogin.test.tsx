import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("../../hooks/useLogin", () => ({
  useLogin: () => ({
    step: "credentials",
    memberships: [],
    branches: [],
    submitCredentials: vi.fn(),
    selectMembership: vi.fn(),
    selectBranchForMembership: vi.fn(),
    isLoading: false,
    resetToCredentials: vi.fn(),
  }),
}));
vi.mock("@pos/ui", () => ({
  Button: ({ children }: any) => <button>{children}</button>,
  TextInput: (p: any) => <input {...p} />,
  PasswordInput: (p: any) => <input {...p} />,
}));
import { KitchenLogin } from "@/features/auth/pages/KitchenLogin";
describe("KitchenLogin", () =>
  it("renders credentials step", () => {
    const h = renderToStaticMarkup(<KitchenLogin onLogin={() => {}} />);
    expect(h).toContain("Kitchen Display");
    expect(h).toContain("Sign in to continue");
  }));
