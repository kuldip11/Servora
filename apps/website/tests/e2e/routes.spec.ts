import { test, expect } from "@playwright/test";
import { modules } from "@/content/modules";
import { appExperiences } from "@/content/app-experiences";
import { solutions } from "@/content/solutions";

const routes = [
  "/",
  "/product",
  "/apps",
  "/workflow",
  "/solutions",
  "/integrations",
  "/onboarding",
  "/faq",
  "/resources",
  "/customers",
  "/updates",
  "/pricing",
  "/book-a-demo",
  "/contact",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  ...modules.map((module) => `/product/${module.slug}`),
  ...appExperiences.map((app) => `/apps/${app.slug}`),
  ...solutions.map((solution) => `/solutions/${solution.slug}`),
];

test("published marketing routes resolve", async ({ request }) => {
  for (const route of routes) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }
});

test("robots and sitemap are available", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("/sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const body = await sitemap.text();
  expect(body).toContain("/product/qr-ordering");
  expect(body).toContain("/apps/waiter");
  expect(body).toContain("/resources");
});

test("application ecosystem navigation exposes all configured apps", async ({
  page,
}) => {
  await page.goto("/apps");
  const destinations = appExperiences.map((app) => `/apps/${app.slug}`);
  for (const href of destinations) {
    await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(1);
  }
});
