import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Product Updates", description: "A transparent view of the Servora product areas represented today." };
const areas = [
  ["Connected order operations", "Management, waiter, kitchen and customer experiences share order and status context."],
  ["Advanced menu and pricing", "Variants, modifiers, combos, schedules, overrides, promotions, loyalty and buffet pricing are represented."],
  ["Cost and margin visibility", "Recipes, inventory impact, waste and menu engineering connect operations with financial insight."],
  ["Role-aware control", "Permissions, branch context, approvals and audit activity support accountable operations."],
];
export default function UpdatesPage(){return <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8"><p className="text-sm font-semibold text-primary">Product updates</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">A clear record of what Servora represents.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">This initial update page describes the current product areas without assigning release dates or claiming unverified future availability.</p><div className="mt-12 space-y-5">{areas.map(([title,text])=><article key={title} className="rounded-2xl border border-border bg-surface p-7"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Current platform</p><h2 className="mt-3 text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{text}</p></article>)}</div><div className="mt-10"><Link href="/product" className="text-sm font-semibold text-primary">Explore current product capabilities →</Link></div></section>}
