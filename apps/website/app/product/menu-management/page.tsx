import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "menu-management")!;
export const metadata: Metadata = {
  title: "Restaurant menu management software",
  description:
    "Manage restaurant categories, items, modifiers, variants and availability from one connected system.",
  alternates: { canonical: "/product/menu-management" },
  openGraph: {
    title: "Restaurant menu management software | Servora",
    description:
      "Manage restaurant categories, items, modifiers, variants and availability from one connected system.",
    url: "/product/menu-management",
    images: [
      {
        url: "/og?title=menu-management",
        width: 1200,
        height: 630,
        alt: "Menu Management — Servora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant menu management software | Servora",
    description:
      "Manage restaurant categories, items, modifiers, variants and availability from one connected system.",
    images: ["/og?title=menu-management"],
  },
};
export default function Page() {
  return <ProductDetail module={module} />;
}
