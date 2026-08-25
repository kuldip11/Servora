import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@pos/ui", () => ({
  Button: ({ children }: any) => <button>{children}</button>,
  TextInput: (p: any) => <input {...p} />,
  PasswordInput: (p: any) => <input {...p} />,
  toast: vi.fn(),
}));
import { MembershipSelector } from "../MembershipSelector";
import { BranchSelector } from "../BranchSelector";
describe("auth selectors", () => {
  it("renders memberships", () => {
    const m: any = {
      membershipId: "m1",
      tenant: { name: "Demo" },
      roles: [{ name: "Manager" }],
    };
    expect(
      renderToStaticMarkup(
        <MembershipSelector memberships={[m]} onSelect={() => {}} />,
      ),
    ).toContain("Demo");
  });
  it("renders branches", () => {
    const b: any = { id: "b1", name: "Main Kitchen", address: "Address" };
    const h = renderToStaticMarkup(
      <BranchSelector branches={[b]} onSelect={() => {}} onBack={() => {}} />,
    );
    expect(h).toContain("Main Kitchen");
    expect(h).toContain("Enter Kitchen");
  });
});
