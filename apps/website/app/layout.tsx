import { CookieConsent } from "@/components/privacy/CookieConsent";
import { Analytics } from "@/components/analytics/Analytics";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://servora.example",
  ),
  title: {
    default: "Servora — Restaurant operations, connected.",
    template: "%s | Servora",
  },
  description:
    "Servora connects management and POS, kitchen display, waiter operations, customer QR ordering, billing, inventory and restaurant insights.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Servora",
    title: "Servora — Restaurant operations, connected.",
    description: "One connected platform for guests, waiters, kitchen teams and restaurant operators.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
