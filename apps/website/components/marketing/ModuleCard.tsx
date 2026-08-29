"use client";
import Link from "next/link";
import type { Module } from "@/content/modules";
import { track } from "@/lib/analytics";

export function ModuleCard({ module }: { module: Module }) {
  return (
    <Link
      onClick={() =>
        track({
          event: "module_card_click",
          module_slug: module.slug,
          source_page: window.location.pathname,
        })
      }
      href={`/product/${module.slug}`}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--primary-border)] hover:shadow-[var(--shadow-sm)]"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
        {module.eyebrow}
      </span>
      <h3 className="mt-3 text-lg font-semibold group-hover:text-[var(--primary)]">
        {module.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {module.description}
      </p>
      <ul className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
        {module.capabilities.map((cap) => (
          <li key={cap}>• {cap}</li>
        ))}
      </ul>
    </Link>
  );
}
