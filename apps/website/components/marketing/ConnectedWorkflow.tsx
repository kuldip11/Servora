import { ArrowRight, BarChart3, ChefHat, QrCode, Receipt, UtensilsCrossed } from "lucide-react";

const steps = [
  { icon: QrCode, title: "Guest orders", text: "A guest scans the table QR, customizes items and sends an order." },
  { icon: ChefHat, title: "Kitchen prepares", text: "Items route to the right station with notes, modifiers and timers." },
  { icon: UtensilsCrossed, title: "Waiter serves", text: "The waiter sees ready items and responds to table requests." },
  { icon: Receipt, title: "Bill settles", text: "The complete table tab moves through billing and payment." },
  { icon: BarChart3, title: "Operations update", text: "Inventory, reporting and the audit trail update from the same flow." },
];

export const ConnectedWorkflow = ({ compact = false }: { compact?: boolean }) => (
  <section className={compact ? "" : "border-y border-border bg-surface"}>
    <div className={compact ? "" : "mx-auto max-w-7xl px-6 py-20 lg:px-8"}>
      {!compact && (
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">One connected shift</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Every team sees the next action, without losing the order context.
          </h2>
          <p className="mt-4 text-text-secondary">
            Servora connects the guest, front of house, kitchen and back office around one live operational record.
          </p>
        </div>
      )}
      <ol className={`${compact ? "" : "mt-10"} grid gap-4 lg:grid-cols-5`}>
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="relative rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-primary-surface p-2.5 text-primary"><Icon size={20} /></span>
              <span className="text-xs font-semibold text-text-disabled">0{index + 1}</span>
            </div>
            <h3 className="mt-5 font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p>
            {index < steps.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden text-primary lg:block" size={20} />}
          </li>
        ))}
      </ol>
    </div>
  </section>
);
