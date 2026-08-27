import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "security")!;
export const metadata: Metadata = { title: "Restaurant software security and access control", description: "Protect restaurant operations with authentication, role-based access and tenant isolation architecture.", alternates: { canonical: "/product/security" }, openGraph: { title: "Restaurant software security and access control | Servora", description: "Protect restaurant operations with authentication, role-based access and tenant isolation architecture.", url: "/product/security", images: [{ url: "/og?title=security", width: 1200, height: 630, alt: "Security & Reliability — Servora" }] }, twitter: { card: "summary_large_image", title: "Restaurant software security and access control | Servora", description: "Protect restaurant operations with authentication, role-based access and tenant isolation architecture.", images: ["/og?title=security"] } };
export default function Page() { return <ProductDetail module={module} />; }
