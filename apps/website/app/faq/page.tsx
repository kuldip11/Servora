import type { Metadata } from "next";
import { CtaBanner } from "@/components/marketing/CtaBanner";
export const metadata: Metadata = { title: "Frequently Asked Questions", description: "Answers about Servora ordering, kitchen, waiter, multi-branch, onboarding and pricing." };
const faqs = [
  ["What restaurant workflows does Servora cover?", "Servora connects management and POS, kitchen display, waiter operations and customer QR ordering with menu, inventory, billing, analytics, staff and branch controls."],
  ["Do guests need to download an app?", "No. The customer experience is designed to open from a QR or ordering link in the guest’s browser."],
  ["Can a guest order more during a meal?", "Yes. A dine-in table session can keep the tab open, support additional kitchen rounds and allow the guest to return to the menu."],
  ["Does it support takeaway?", "Yes. Takeaway ordering is represented in the management, waiter and customer flows, including required online payment where configured."],
  ["Can kitchen screens be separated by station?", "Yes. Kitchen terminals can show a selected station as well as all or unassigned tickets."],
  ["What can waiters do from the mobile app?", "Waiters can create and customize orders, manage active orders, see ready items, respond to guest requests, transfer tables, split bills, merge tables and request settlement."],
  ["Does Servora support multiple branches?", "Yes. The platform includes organization, tenant and branch context, branch-aware access, branch configuration and menu overrides."],
  ["Can existing menu data be imported?", "The product includes a menu import workflow as well as export, templates and bulk actions. The exact migration approach should be confirmed during onboarding."],
  ["Which payment providers and hardware are supported?", "Payment and deployment requirements vary by setup. Confirm the provider, region, devices and restaurant environment with the Servora team before purchase."],
  ["How is pricing calculated?", "Pricing depends on locations, required workspaces, operating needs and onboarding scope. The pricing page shows the intended package structure; a quote confirms commercial terms."],
];
export default function FaqPage(){return <><section className="mx-auto max-w-4xl px-6 py-20 lg:px-8"><p className="text-sm font-semibold text-primary">Frequently asked questions</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Questions teams ask before a demo.</h1><div className="mt-12 space-y-4">{faqs.map(([q,a])=><details key={q} className="group rounded-2xl border border-border bg-surface p-6"><summary className="cursor-pointer list-none pr-8 text-lg font-semibold">{q}</summary><p className="mt-4 text-sm leading-7 text-text-secondary">{a}</p></details>)}</div></section><CtaBanner title="Still deciding whether Servora fits?" /></>}
