import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../../../../../../../packages/ui/src/theme/ThemeProvider";
import { ProfilePage } from "../ProfilePage";

describe("ProfilePage", () => {
  it("renders profile and theme controls", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <ProfilePage waiterName="Asha" onBack={vi.fn()} />
      </ThemeProvider>,
    );
    expect(html).toContain("Profile");
    expect(html).toContain("Asha");
    expect(html).toContain("Appearance");
  });
});
