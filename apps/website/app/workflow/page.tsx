import type { Metadata } from "next";
import Link from "next/link";
import { ConnectedWorkflow } from "@/components/marketing/ConnectedWorkflow";
import { CtaBanner } from "@/components/marketing/CtaBanner";

export const metadata: Metadata = { title: "How Servora Works", description: "Follow an order from guest to kitchen, service, billing and restaurant insights." };

export default function WorkflowPage() {
  return <>
    <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pt-24">
      <div className="max-w-4xl">
        <p className="text-sm font-semibold text-primary">How Servora works</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">One order. One shared operational story.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-text-secondary">Instead of making guests, waiters, kitchen teams and managers work in separate systems, Servora keeps every stage connected to the same restaurant context.</p>
      </div>
      <div className="mt-14"><ConnectedWorkflow compact /></div>
      <div className="mt-20 grid gap-5 md:grid-cols-2">
        {[
          ["1. The guest starts with context", "A table QR establishes the branch and table session. The guest sees the current menu, pricing and availability."],
          ["2. The order keeps every choice", "Variants, modifiers, fulfillment choices, customer pricing and notes remain attached as the order moves."],
          ["3. The kitchen receives actionable tickets", "Items route by station and kitchen staff advance clear preparation stages while timers keep urgency visible."],
          ["4. The floor stays informed", "Waiters see ready rounds and guest service requests while retaining table, order and customer context."],
          ["5. Billing uses the complete tab", "Additional rounds, taxes, discounts, service charges and payments stay visible in one settlement flow."],
          ["6. The back office learns from the shift", "Inventory impact, menu performance, branch reporting and audit activity are updated from the operation itself."],
        ].map(([title, text]) => <article key={title} className="rounded-2xl border border-border bg-surface p-7"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{text}</p></article>)}
      </div>
      <div className="mt-12 text-center"><Link href="/book-a-demo" className="inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white">Walk through a live service</Link></div>
    </section>
    <CtaBanner title="Bring your restaurant workflow into one conversation." />
  </>;
}
