import type { Metadata } from "next";
import { ProductDetail } from "@/components/marketing/ProductDetail";
import { modules } from "@/content/modules";
const module = modules.find((item) => item.slug === "kitchen-display")!;
export const metadata: Metadata = {
  title: "Restaurant kitchen display system",
  description:
    "Give kitchen teams a focused view of tickets, order progress and realtime operational updates.",
  alternates: { canonical: "/product/kitchen-display" },
  openGraph: {
    title: "Restaurant kitchen display system | Servora",
    description:
      "Give kitchen teams a focused view of tickets, order progress and realtime operational updates.",
    url: "/product/kitchen-display",
    images: [
      {
        url: "/og?title=kitchen-display",
        width: 1200,
        height: 630,
        alt: "Kitchen Display — Servora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant kitchen display system | Servora",
    description:
      "Give kitchen teams a focused view of tickets, order progress and realtime operational updates.",
    images: ["/og?title=kitchen-display"],
  },
};
export default function Page() {
  return <ProductDetail module={module} />;
}
