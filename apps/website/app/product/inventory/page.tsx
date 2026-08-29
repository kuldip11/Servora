import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "inventory")!;
export const metadata: Metadata = {
  title: "Restaurant inventory management software",
  description:
    "Connect restaurant stock, recipes and availability workflows to the rest of your daily operations.",
  alternates: { canonical: "/product/inventory" },
  openGraph: {
    title: "Restaurant inventory management software | Servora",
    description:
      "Connect restaurant stock, recipes and availability workflows to the rest of your daily operations.",
    url: "/product/inventory",
    images: [
      {
        url: "/og?title=inventory",
        width: 1200,
        height: 630,
        alt: "Inventory — Servora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant inventory management software | Servora",
    description:
      "Connect restaurant stock, recipes and availability workflows to the rest of your daily operations.",
    images: ["/og?title=inventory"],
  },
};
export default function Page() {
  return <ProductDetail module={module} />;
}
