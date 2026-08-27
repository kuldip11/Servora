import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "pos-and-orders")!;
export const metadata: Metadata = { title: "Restaurant POS and order management", description: "Keep restaurant orders moving from the counter or table into one connected operational workflow.", alternates: { canonical: "/product/pos-and-orders" }, openGraph: { title: "Restaurant POS and order management | Servora", description: "Keep restaurant orders moving from the counter or table into one connected operational workflow.", url: "/product/pos-and-orders", images: [{ url: "/og?title=pos-and-orders", width: 1200, height: 630, alt: "POS & Orders — Servora" }] }, twitter: { card: "summary_large_image", title: "Restaurant POS and order management | Servora", description: "Keep restaurant orders moving from the counter or table into one connected operational workflow.", images: ["/og?title=pos-and-orders"] } };
export default function Page() { return <ProductDetail module={module} />; }
