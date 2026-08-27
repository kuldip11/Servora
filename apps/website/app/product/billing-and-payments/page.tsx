import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "billing-and-payments")!;
export const metadata: Metadata = {
  title: "Restaurant POS billing and payments",
  description:
    "Support restaurant billing, payment methods and refund workflows within one connected operational platform.",
  alternates: { canonical: "/product/billing-and-payments" },
  openGraph: {
    title: "Restaurant POS billing and payments | Servora",
    description:
      "Support restaurant billing, payment methods and refund workflows within one connected operational platform.",
    url: "/product/billing-and-payments",
    images: [
      {
        url: "/og?title=billing-and-payments",
        width: 1200,
        height: 630,
        alt: "Billing & Payments — Servora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant POS billing and payments | Servora",
    description:
      "Support restaurant billing, payment methods and refund workflows within one connected operational platform.",
    images: ["/og?title=billing-and-payments"],
  },
};
export default function Page() {
  return <ProductDetail module={module} />;
}
