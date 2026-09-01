"use client";
import Link from "next/link";
import { track } from "@/lib/analytics";

export const PricingCta = ({
  planName,
  cta,
}: {
  planName: string;
  cta: string;
}) => {
  return (
    <Link
      onClick={() => track({ event: "pricing_cta_click", plan_name: planName })}
      href="/book-a-demo"
      className="mt-7 block rounded-lg bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-white"
    >
      {cta}
    </Link>
  );
};
