import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "../AppShell";

describe("AppShell", () => {
  it("renders main content and optional navigation slots", () => {
    render(
      <AppShell
        sidebar={<nav>Side</nav>}
        topbar={<header>Top</header>}
        bottombar={<footer>Bottom</footer>}
      >
        <main>Content</main>
      </AppShell>,
    );
    expect(screen.getByText("Content")).toBeVisible();
    expect(screen.getByText("Side")).toBeVisible();
    expect(screen.getByText("Top")).toBeVisible();
    expect(screen.getByText("Bottom")).toBeVisible();
  });
});
