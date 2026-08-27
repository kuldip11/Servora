import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  CreditCard,
  QrCode,
  ShoppingBag,
  Users,
} from "lucide-react";
import { modules } from "@/content/modules";
import { ModuleCard } from "@/components/marketing/ModuleCard";
import { CtaBanner } from "@/components/marketing/CtaBanner";
import { ProductPreview } from "@/components/marketing/ProductPreview";

export const metadata: Metadata = {
  title: "Servora — Restaurant operations, connected.",
  description:
    "Connect restaurant orders, kitchen operations, billing, staff, inventory, analytics and QR ordering in one operational platform.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Servora — Restaurant operations, connected.",
    description:
      "Connect restaurant orders, kitchen operations, billing, staff, inventory, analytics and QR ordering in one operational platform.",
    url: "/",
    images: [
      {
        url: "/og?title=home",
        width: 1200,
        height: 630,
        alt: "Servora — Restaurant operations, connected.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Servora — Restaurant operations, connected.",
    description:
      "Connect restaurant orders, kitchen operations, billing, staff, inventory, analytics and QR ordering in one operational platform.",
    images: ["/og?title=home"],
  },
};

const workflow = [
  [
    QrCode,
    "Customer QR ordering",
    "Guests browse, customize and place orders from their own devices.",
  ],
  [
    ShoppingBag,
    "Orders & POS",
    "Bring front-of-house orders into a shared operational workflow.",
  ],
  [
    ChefHat,
    "Kitchen",
    "Keep kitchen teams focused on tickets and order progress.",
  ],
  [
    CreditCard,
    "Billing",
    "Move orders through billing and supported payment workflows.",
  ],
  [
    BarChart3,
    "Inventory & insights",
    "Connect operational data to inventory and analytics.",
  ],
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_50%_0%,var(--primary-surface),transparent_65%)]"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-7xl px-6 pb-12 pt-20 text-center lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex rounded-full border border-[var(--primary-border)] bg-[var(--primary-surface)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
              Restaurant operations, connected.
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Run the restaurant from one connected platform.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              Servora brings orders, kitchen operations, billing, staff,
              inventory, analytics and customer QR ordering into one operational
              system.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/book-a-demo"
                className="rounded-lg bg-[var(--primary)] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              >
                Book a Demo
              </Link>
              <Link
                href="/product"
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-center text-sm font-semibold hover:bg-[var(--surface-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              >
                Explore Product <ArrowRight className="ml-1 inline" size={16} />
              </Link>
            </div>
          </div>
          <ProductPreview label="Connected restaurant operations" />
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[var(--primary)]">
              One system, multiple teams
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              The tools work better when the workflow is connected.
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              From the first customer interaction to the kitchen and back
              office, Servora is designed around the restaurant workflow rather
              than isolated screens.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard key={module.slug} module={module} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
              <Users className="text-[var(--primary)]" />
              <h2 className="mt-4 text-xl font-semibold">
                For restaurant teams
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Give owners, managers, waiters, cashiers and kitchen teams the
                operational context they need.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
              <ChefHat className="text-[var(--primary)]" />
              <h2 className="mt-4 text-xl font-semibold">
                For daily operations
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Keep ordering, kitchen execution and billing connected instead
                of passing information between systems.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
              <BarChart3 className="text-[var(--primary)]" />
              <h2 className="mt-4 text-xl font-semibold">
                For growing businesses
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Use branch and role-aware workflows as your restaurant operation
                grows.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
