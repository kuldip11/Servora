import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "staff-and-roles")!;
export const metadata: Metadata = {
  title: "Restaurant staff and role management",
  description:
    "Manage restaurant staff access with role-based permissions and branch-aware operational context.",
  alternates: { canonical: "/product/staff-and-roles" },
  openGraph: {
    title: "Restaurant staff and role management | Servora",
    description:
      "Manage restaurant staff access with role-based permissions and branch-aware operational context.",
    url: "/product/staff-and-roles",
    images: [
      {
        url: "/og?title=staff-and-roles",
        width: 1200,
        height: 630,
        alt: "Staff & Roles — Servora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant staff and role management | Servora",
    description:
      "Manage restaurant staff access with role-based permissions and branch-aware operational context.",
    images: ["/og?title=staff-and-roles"],
  },
};
export default function Page() {
  return <ProductDetail module={module} />;
}
