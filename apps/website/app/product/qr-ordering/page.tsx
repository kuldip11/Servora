import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "qr-ordering")!;
export const metadata: Metadata = {
  title: "Restaurant QR ordering system",
  description:
    "Let guests browse the menu and place orders from their phones with QR ordering connected to your kitchen and POS.",
  alternates: { canonical: "/product/qr-ordering" },
  openGraph: {
    title: "Restaurant QR ordering system | Servora",
    description:
      "Let guests browse the menu and place orders from their phones with QR ordering connected to your kitchen and POS.",
    url: "/product/qr-ordering",
    images: [
      {
        url: "/og?title=qr-ordering",
        width: 1200,
        height: 630,
        alt: "QR Ordering — Servora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant QR ordering system | Servora",
    description:
      "Let guests browse the menu and place orders from their phones with QR ordering connected to your kitchen and POS.",
    images: ["/og?title=qr-ordering"],
  },
};
export default function Page() {
  return <ProductDetail module={module} />;
}
