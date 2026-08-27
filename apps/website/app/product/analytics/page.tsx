import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "analytics")!;
export const metadata: Metadata = { title: "Restaurant analytics software", description: "Turn restaurant order and operational data into useful dashboards, reports and business insights.", alternates: { canonical: "/product/analytics" }, openGraph: { title: "Restaurant analytics software | Servora", description: "Turn restaurant order and operational data into useful dashboards, reports and business insights.", url: "/product/analytics", images: [{ url: "/og?title=analytics", width: 1200, height: 630, alt: "Analytics — Servora" }] }, twitter: { card: "summary_large_image", title: "Restaurant analytics software | Servora", description: "Turn restaurant order and operational data into useful dashboards, reports and business insights.", images: ["/og?title=analytics"] } };
export default function Page() { return <ProductDetail module={module} />; }
