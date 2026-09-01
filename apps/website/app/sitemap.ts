import type { MetadataRoute } from "next";
import { modules } from "@/content/modules";
import { appExperiences } from "@/content/app-experiences";
import { solutions } from "@/content/solutions";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://servora.example";
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
    "/login",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
    ...modules.map((m) => `/product/${m.slug}`),
    ...appExperiences.map((app) => `/apps/${app.slug}`),
    ...solutions.map((solution) => `/solutions/${solution.slug}`),
  ];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: "2026-09-01",
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/product") ? 0.7 : 0.6,
  }));
}
