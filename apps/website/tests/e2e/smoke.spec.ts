import { test, expect } from "@playwright/test";

test("homepage exposes primary conversion paths", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Servora/);
  await expect(
    page.getByRole("link", { name: /request a demo/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /pricing/i }).first(),
  ).toBeVisible();
});

test("demo form exposes accessible fields", async ({ page }) => {
  await page.goto("/book-a-demo");
  await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Work email" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /request a demo/i }),
  ).toBeVisible();
});
