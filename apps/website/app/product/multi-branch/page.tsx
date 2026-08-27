import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "multi-branch")!;
export const metadata: Metadata = { title: "Multi-branch restaurant management software", description: "Manage branches, tenant context and role-aware workflows as your restaurant organization grows.", alternates: { canonical: "/product/multi-branch" }, openGraph: { title: "Multi-branch restaurant management software | Servora", description: "Manage branches, tenant context and role-aware workflows as your restaurant organization grows.", url: "/product/multi-branch", images: [{ url: "/og?title=multi-branch", width: 1200, height: 630, alt: "Multi-Branch — Servora" }] }, twitter: { card: "summary_large_image", title: "Multi-branch restaurant management software | Servora", description: "Manage branches, tenant context and role-aware workflows as your restaurant organization grows.", images: ["/og?title=multi-branch"] } };
export default function Page() { return <ProductDetail module={module} />; }
