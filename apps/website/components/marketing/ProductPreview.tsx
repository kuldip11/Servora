export const ProductPreview = ({ label }: { label: string }) => {
  const normalized = label.toLowerCase();
  const mode = normalized.includes("kitchen")
    ? "kitchen"
    : normalized.includes("waiter")
      ? "waiter"
      : normalized.includes("customer") || normalized.includes("qr")
        ? "customer"
        : "management";
  const preview = {
    management: { nav: ["Overview", "Orders", "Menu", "Inventory", "Insights"], metrics: [["Orders", "24"], ["Kitchen", "08"], ["Revenue", "₹18.4k"], ["Items", "146"]], activity: ["Order #1042 · Kitchen", "Order #1041 · Ready", "QR session · Table 12"] },
    kitchen: { nav: ["Received", "Preparing", "Ready", "Served", "Stations"], metrics: [["Active", "18"], ["Urgent", "02"], ["Ready", "06"], ["Stations", "04"]], activity: ["T12 · 06:42 · Grill", "T08 · 04:15 · Pantry", "TAKEAWAY · 02:09"] },
    waiter: { nav: ["Home", "New order", "Active", "Requests", "Profile"], metrics: [["Tables", "09"], ["Ready", "03"], ["Requests", "02"], ["Open", "11"]], activity: ["Table 7 · Ready for pickup", "Table 12 · Water request", "Table 4 · Round 2 preparing"] },
    customer: { nav: ["Popular", "Starters", "Mains", "Drinks", "Your order"], metrics: [["Items", "03"], ["Round", "02"], ["ETA", "18m"], ["Table", "12"]], activity: ["Order received", "Preparing your food", "Call waiter · Water · Bill"] },
  }[mode];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#111827] p-3 shadow-2xl">
      <div className="rounded-2xl bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600">
              Servora
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{label}</p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-slate-300" />
            <span className="size-2 rounded-full bg-slate-300" />
            <span className="size-2 rounded-full bg-slate-300" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[0.7fr_1fr] gap-4">
          <div className="space-y-2">
            {preview.nav.map(
              (item, i) => (
                <div
                  key={item}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${i === 0 ? "bg-violet-50 text-violet-700" : "text-slate-500"}`}
                >
                  {item}
                </div>
              ),
            )}
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-2">
              {preview.metrics.map(([item, value]) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <p className="text-[10px] text-slate-500">{item}</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800">
                  Live activity
                </p>
                <span className="text-[10px] font-medium text-emerald-700">Updated</span>
              </div>
              <div className="mt-3 space-y-2">
                {preview.activity.map((item) => (
                  <div key={item} className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 w-2/3 rounded-full bg-violet-200"
                      title={item}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
