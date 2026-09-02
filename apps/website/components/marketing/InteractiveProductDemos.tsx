"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Minus, Plus, Search } from "lucide-react";

type DemoKey = "customer" | "waiter" | "kitchen" | "web";

const demos: Array<{
  key: DemoKey;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}> = [
  {
    key: "customer",
    label: "Customer ordering",
    eyebrow: "Guest experience",
    title: "Browse, customize and order without waiting.",
    description:
      "A branded, table-aware mobile experience that carries guests from menu discovery to live order updates.",
    points: [
      "QR session and table context",
      "Variants, modifiers and editable cart",
      "Live status and service requests",
    ],
  },
  {
    key: "waiter",
    label: "Waiter app",
    eyebrow: "Front of house",
    title: "Take orders quickly on mobile or tablet.",
    description:
      "A focused workspace for ready orders, customer requests, tables and fast menu ordering.",
    points: [
      "Ready orders and table attention",
      "Mobile and tablet ordering layouts",
      "Edit choices before sending",
    ],
  },
  {
    key: "kitchen",
    label: "Kitchen display",
    eyebrow: "Kitchen operations",
    title: "See what to cook next without the noise.",
    description:
      "A high-contrast ticket board that keeps timing, modifiers and preparation progress easy to scan.",
    points: [
      "Live ticket priority and elapsed time",
      "Item modifiers and preparation notes",
      "Ready signals shared with service",
    ],
  },
  {
    key: "web",
    label: "Management & POS",
    eyebrow: "Business control",
    title: "Run every branch from one clear workspace.",
    description:
      "Manage the business hierarchy, menus, orders, inventory, staff, billing and operational insight.",
    points: [
      "Business, franchise and branch context",
      "Role-aware operational access",
      "Orders, sales and branch-level signals",
    ],
  },
];

const DemoButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`rounded-xl px-3 py-3 text-sm font-semibold transition sm:px-4 ${
      active
        ? "bg-white text-[#142219] shadow-sm"
        : "text-[#68736b] hover:bg-white/60 hover:text-[#142219]"
    }`}
  >
    {children}
  </button>
);

const CustomerDemo = () => {
  const [screen, setScreen] = useState<
    "menu" | "customize" | "cart" | "status"
  >("menu");

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div
        role="tablist"
        aria-label="Customer ordering demo screens"
        className="mb-3 grid grid-cols-4 gap-1 rounded-xl bg-[#e8ece8] p-1"
      >
        {(["menu", "customize", "cart", "status"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={screen === item}
            onClick={() => setScreen(item)}
            className={`rounded-lg px-1 py-2 text-[10px] font-bold capitalize ${
              screen === item
                ? "bg-white text-[#174e36] shadow-sm"
                : "text-[#657068]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="relative h-[520px] overflow-hidden rounded-[30px] border-[6px] border-[#172019] bg-[#f6f2e8] text-[#172019] shadow-2xl">
        {screen === "menu" && (
          <div className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <header className="bg-gradient-to-br from-[#123f2c] to-[#236c4a] px-4 pb-4 pt-8 text-white">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-70">
                Welcome to
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <h3 className="font-serif text-2xl font-bold">Olive & Ember</h3>
                <span className="rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[9px] font-bold">
                  Table 12
                </span>
              </div>
              <p className="mt-1 text-[10px] opacity-75">
                Good evening — order whenever you&apos;re ready.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[10px] text-[#6d756f]">
                <Search size={13} /> Search dishes, drinks or ingredients
              </div>
            </header>
            <div className="flex gap-1.5 overflow-hidden px-3 py-3">
              {["For you", "Starters", "Mains", "Drinks"].map((item, index) => (
                <span
                  key={item}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-bold ${index === 0 ? "bg-[#174e36] text-white" : "border border-[#ddd8cd] bg-white"}`}
                >
                  {item}
                </span>
              ))}
            </div>
            <main className="px-3 pb-24">
              <h4 className="font-serif text-xl font-bold">Popular tonight</h4>
              <button
                type="button"
                onClick={() => setScreen("customize")}
                className="relative mt-2 h-36 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#e46b31] to-[#8b321b] p-4 text-left text-white"
              >
                <span className="rounded-full bg-white/15 px-2 py-1 text-[8px] font-bold">
                  BEST SELLER
                </span>
                <strong className="mt-3 block max-w-[65%] font-serif text-xl leading-tight">
                  Smoky paneer bowl
                </strong>
                <span className="mt-1 block max-w-[70%] text-[9px] opacity-80">
                  Charred peppers, saffron rice, herb yogurt
                </span>
                <span className="absolute bottom-4 left-4 text-sm font-bold">
                  ₹420
                </span>
                <span className="absolute bottom-4 right-4 grid size-9 place-items-center rounded-full bg-white text-lg text-[#8b321b]">
                  +
                </span>
              </button>
              <h4 className="mt-5 font-serif text-lg font-bold">
                Made for sharing
              </h4>
              {[
                [
                  "Truffle mushroom pizza",
                  "Roasted mushrooms and mozzarella",
                  "₹560",
                  "from-[#edca7e] to-[#c66f31]",
                ],
                [
                  "Garden mezze",
                  "Hummus, labneh and warm pita",
                  "₹380",
                  "from-[#dce6bd] to-[#789756]",
                ],
              ].map(([name, description, price, gradient]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setScreen("customize")}
                  className="mt-2 grid w-full grid-cols-[64px_1fr_30px] items-center gap-3 rounded-2xl border border-[#ddd8cd] bg-white p-2 text-left"
                >
                  <span
                    className={`h-16 rounded-xl bg-gradient-to-br ${gradient}`}
                  />
                  <span>
                    <strong className="block text-xs">{name}</strong>
                    <span className="mt-1 block text-[9px] text-[#6d756f]">
                      {description}
                    </span>
                    <span className="mt-2 block text-[10px] font-bold">
                      {price}
                    </span>
                  </span>
                  <span className="grid size-7 place-items-center rounded-full bg-[#174e36] text-white">
                    +
                  </span>
                </button>
              ))}
            </main>
            <button
              type="button"
              onClick={() => setScreen("cart")}
              className="absolute inset-x-3 bottom-3 flex h-14 items-center justify-between rounded-2xl bg-[#174e36] px-4 text-xs font-bold text-white shadow-xl"
            >
              <span>2 items</span>
              <span>
                View order · ₹980 <ChevronRight className="inline" size={14} />
              </span>
            </button>
          </div>
        )}

        {screen === "customize" && (
          <div className="flex h-full flex-col">
            <div className="bg-[#174e36] px-4 pb-6 pt-9 text-white">
              <button
                type="button"
                onClick={() => setScreen("menu")}
                className="rounded-full bg-white/15 px-3 py-1 text-xs"
              >
                Close
              </button>
              <div className="mx-auto mt-2 h-24 w-36 rounded-full bg-gradient-to-br from-[#f1d28e] to-[#b76532]" />
            </div>
            <div className="flex-1 overflow-y-auto rounded-t-[26px] bg-[#f6f2e8] px-4 pb-24 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <h3 className="font-serif text-2xl font-bold">
                Truffle mushroom pizza
              </h3>
              <p className="mt-2 text-[10px] leading-5 text-[#6d756f]">
                Stone-baked crust, roasted mushrooms, mozzarella and fragrant
                thyme.
              </p>
              <div className="mt-5 flex justify-between text-xs font-bold">
                <span>Choose your size</span>
                <span className="text-[#e66a2c]">REQUIRED</span>
              </div>
              {[
                ["Regular · 10 inch", "₹560", false],
                ["Large · 13 inch", "+ ₹170", true],
              ].map(([label, price, active]) => (
                <div
                  key={String(label)}
                  className="flex items-center gap-3 border-b border-[#ddd8cd] py-3 text-xs"
                >
                  <span
                    className={`grid size-5 place-items-center rounded-full border-2 ${active ? "border-[#174e36]" : "border-[#c9c5bc]"}`}
                  >
                    {active && (
                      <span className="size-2.5 rounded-full bg-[#174e36]" />
                    )}
                  </span>
                  <span>{String(label)}</span>
                  <span className="ml-auto text-[#6d756f]">
                    {String(price)}
                  </span>
                </div>
              ))}
              <div className="mt-5 flex justify-between text-xs font-bold">
                <span>Add something extra</span>
                <span className="text-[#6d756f]">OPTIONAL</span>
              </div>
              {[
                "Extra mushrooms · + ₹60",
                "Chilli oil · + ₹30",
                "Gluten-free crust · + ₹90",
              ].map((label, index) => (
                <div
                  key={label}
                  className="flex items-center gap-3 border-b border-[#ddd8cd] py-3 text-xs"
                >
                  <span
                    className={`size-5 rounded-full border-2 ${index === 0 ? "border-[#174e36] bg-[#174e36] shadow-[inset_0_0_0_4px_white]" : "border-[#c9c5bc]"}`}
                  />
                  {label}
                </div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex gap-2 border-t border-[#ddd8cd] bg-[#fffdf8] p-3">
              <div className="flex items-center gap-3 rounded-xl bg-[#eee9de] px-3 text-xs font-bold">
                <Minus size={12} /> 1 <Plus size={12} />
              </div>
              <button
                type="button"
                onClick={() => setScreen("cart")}
                className="flex-1 rounded-xl bg-[#174e36] py-3 text-xs font-bold text-white"
              >
                Add to order · ₹730
              </button>
            </div>
          </div>
        )}

        {screen === "cart" && (
          <div className="h-full overflow-y-auto px-4 pb-24 pt-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setScreen("menu")}
              className="text-xs font-bold text-[#174e36]"
            >
              ← Menu
            </button>
            <h3 className="mt-2 font-serif text-2xl font-bold">Your order</h3>
            <div className="mt-3 flex justify-between rounded-xl bg-[#e1eee5] px-3 py-2 text-[10px] font-bold text-[#174e36]">
              <span>Table 12 · Dine in</span>
              <span>2 items</span>
            </div>
            {[
              ["Truffle mushroom pizza", "Large · Extra mushrooms", "₹790"],
              ["Garden mezze", "Warm pita · No olives", "₹380"],
            ].map(([name, meta, price], index) => (
              <div
                key={name}
                className="grid grid-cols-[54px_1fr_auto] gap-3 border-b border-[#ddd8cd] py-4"
              >
                <span
                  className={`h-14 rounded-xl bg-gradient-to-br ${index === 0 ? "from-[#edca7e] to-[#c66f31]" : "from-[#dce6bd] to-[#789756]"}`}
                />
                <div>
                  <strong className="block text-xs">{name}</strong>
                  <span className="mt-1 block text-[9px] text-[#6d756f]">
                    {meta}
                    <br />
                    Eat here
                  </span>
                  <button
                    type="button"
                    onClick={() => setScreen("customize")}
                    className="mt-2 text-[9px] font-bold text-[#174e36]"
                  >
                    Edit choices
                  </button>
                </div>
                <div className="text-right">
                  <strong className="text-[10px]">{price}</strong>
                  <div className="mt-5 flex items-center gap-2 text-[10px]">
                    <span className="grid size-6 place-items-center rounded-full bg-[#eee9de]">
                      −
                    </span>
                    1
                    <span className="grid size-6 place-items-center rounded-full bg-[#eee9de]">
                      +
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 rounded-xl border border-dashed border-[#cfc9bd] px-3 py-3 text-[10px] text-[#6d756f]">
              Add coupon or reward{" "}
              <span className="float-right font-bold text-[#174e36]">
                Add →
              </span>
            </div>
            <div className="mt-5 space-y-2 text-[10px]">
              <div className="flex justify-between text-[#6d756f]">
                <span>Subtotal</span>
                <span>₹1,170</span>
              </div>
              <div className="flex justify-between text-[#6d756f]">
                <span>Taxes</span>
                <span>₹58.50</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold">
                <span>Total</span>
                <span>₹1,228.50</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScreen("status")}
              className="absolute inset-x-3 bottom-3 rounded-xl bg-[#174e36] py-4 text-xs font-bold text-white"
            >
              Send order to kitchen →
            </button>
          </div>
        )}

        {screen === "status" && (
          <div className="h-full overflow-y-auto bg-gradient-to-b from-[#174e36] from-[43%] to-[#f6f2e8] to-[43%] px-3 pb-20 pt-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="px-2 text-white">
              <div className="flex justify-between text-[9px] font-bold">
                <span>TABLE 12 · ORDER #1048</span>
                <span className="rounded-full bg-white/15 px-2 py-1">
                  ● LIVE
                </span>
              </div>
              <h3 className="mt-5 font-serif text-2xl font-bold">
                It&apos;s cooking.
              </h3>
              <p className="mt-1 text-[10px] opacity-75">
                Your order is moving through the kitchen.
              </p>
            </div>
            <div className="mt-5 rounded-2xl bg-white p-4 shadow-xl">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[9px] text-[#6d756f]">
                    Estimated ready
                  </span>
                  <strong className="block font-serif text-xl">
                    12–18 min
                  </strong>
                </div>
                <span className="text-[8px] text-[#6d756f]">Updated now</span>
              </div>
              <div className="mt-6 grid grid-cols-4 text-center text-[8px] font-bold">
                <div>
                  <span className="mx-auto mb-2 grid size-6 place-items-center rounded-full bg-[#174e36] text-white">
                    <Check size={11} />
                  </span>
                  Received
                </div>
                <div>
                  <span className="mx-auto mb-2 grid size-6 place-items-center rounded-full bg-[#174e36] text-white">
                    <Check size={11} />
                  </span>
                  Confirmed
                </div>
                <div>
                  <span className="mx-auto mb-2 grid size-6 place-items-center rounded-full bg-[#174e36] text-white">
                    •
                  </span>
                  Cooking
                </div>
                <div className="text-[#8b938d]">
                  <span className="mx-auto mb-2 block size-6 rounded-full bg-[#ddd8cd]" />
                  Ready
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-[#ddd8cd] bg-white p-4">
              <div className="flex justify-between text-[10px] font-bold">
                <span>Current round · 2 items</span>
                <span className="text-[#e66a2c]">PREPARING</span>
              </div>
              <p className="mt-3 text-[9px] leading-5 text-[#6d756f]">
                Truffle mushroom pizza × 1<br />
                Garden mezze × 1
              </p>
            </div>
            <h4 className="mt-5 font-serif text-xl font-bold">
              Need anything?
            </h4>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["Call waiter", "Water", "Request bill"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-xl border border-[#ddd8cd] bg-white px-1 py-4 text-[9px] font-bold"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WaiterDemo = () => {
  const [screen, setScreen] = useState<"home" | "orders" | "new-order">("home");
  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div
        role="tablist"
        aria-label="Waiter demo screens"
        className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-[#e8ece8] p-1"
      >
        {(
          [
            ["home", "Home"],
            ["orders", "Orders"],
            ["new-order", "New order"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={screen === key}
            onClick={() => setScreen(key)}
            className={`rounded-lg py-2 text-[10px] font-bold ${screen === key ? "bg-white text-[#174e36] shadow-sm" : "text-[#657068]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="relative h-[520px] overflow-hidden rounded-[30px] border-[6px] border-[#172019] bg-[#f5f7f5] text-[#172019] shadow-2xl">
        <header className="flex items-center justify-between bg-white px-4 pb-3 pt-8">
          <div>
            <p className="text-[9px] text-[#6d756f]">Olive & Ember</p>
            <strong className="text-sm">Connaught Place</strong>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-[#e5f4ea] text-[10px] font-bold text-[#197341]">
            AK
          </span>
        </header>
        <main className="h-[410px] overflow-y-auto px-3 pb-20 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {screen === "home" && (
            <>
              <div className="rounded-2xl bg-[#174e36] p-4 text-white">
                <p className="text-[9px] opacity-70">DINNER SERVICE</p>
                <h3 className="mt-1 text-xl font-semibold">
                  Good evening, Arjun.
                </h3>
                <p className="mt-1 text-[10px] opacity-75">
                  3 orders are ready to serve.
                </p>
                <button
                  type="button"
                  onClick={() => setScreen("orders")}
                  className="mt-4 rounded-xl bg-white px-3 py-2 text-[10px] font-bold text-[#174e36]"
                >
                  View ready orders
                </button>
              </div>
              <h4 className="mt-5 text-sm font-bold">Needs attention</h4>
              {[
                ["T12", "Ready to serve", "#1048 · 4 items"],
                ["T07", "Water requested", "2 guests"],
                ["T04", "Bill requested", "₹1,840 · 6 guests"],
              ].map(([table, status, meta], index) => (
                <div
                  key={table}
                  className="mt-2 grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl border border-[#d9dfdb] bg-white p-3"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-[#edf3ef] text-xs font-bold">
                    {table}
                  </span>
                  <span>
                    <strong
                      className={`block text-[10px] ${index === 0 ? "text-[#197341]" : index === 2 ? "text-[#b6592e]" : ""}`}
                    >
                      {status}
                    </strong>
                    <span className="text-[8px] text-[#6d756f]">{meta}</span>
                  </span>
                  <button
                    type="button"
                    className="rounded-lg bg-[#e8efe9] px-2 py-1.5 text-[8px] font-bold"
                  >
                    Open
                  </button>
                </div>
              ))}
            </>
          )}
          {screen === "orders" && (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#197341]">
                    Service queue
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">Orders</h3>
                </div>
                <span className="text-[9px] text-[#6d756f]">8 active</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-[#e9eeeb] p-1">
                {["Ready 3", "Active 5", "All"].map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className={`rounded-lg py-2 text-[9px] font-bold ${index === 0 ? "bg-white text-[#197341] shadow-sm" : "text-[#6d756f]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {[
                ["T12", "Ready to serve", "#1048 · 18 min", "Serve"],
                ["T03", "Preparing", "#1046 · 12 min", "View"],
                ["T09", "New order", "#1049 · 3 min", "View"],
                ["TA", "Payment required", "#1041 · ₹920", "Open"],
              ].map(([table, status, meta, action], index) => (
                <div
                  key={table}
                  className="mt-2 grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl border border-[#d9dfdb] bg-white p-3"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-[#edf3ef] text-xs font-bold">
                    {table}
                  </span>
                  <span>
                    <strong
                      className={`block text-[10px] ${index === 0 ? "text-[#197341]" : ""}`}
                    >
                      {status}
                    </strong>
                    <span className="text-[8px] text-[#6d756f]">{meta}</span>
                  </span>
                  <button
                    type="button"
                    className={`rounded-lg px-2 py-1.5 text-[8px] font-bold ${index === 0 ? "bg-[#174e36] text-white" : "bg-[#e8efe9]"}`}
                  >
                    {action}
                  </button>
                </div>
              ))}
            </>
          )}
          {screen === "new-order" && (
            <>
              <div className="flex items-center justify-between rounded-xl bg-[#e5f4ea] p-3">
                <div>
                  <strong className="block text-xs">Table 8</strong>
                  <span className="text-[8px] text-[#6d756f]">
                    3 guests · Dine in
                  </span>
                </div>
                <button
                  type="button"
                  className="text-[9px] font-bold text-[#197341]"
                >
                  Change
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#d9dfdb] bg-white px-3 py-2.5 text-[9px] text-[#6d756f]">
                <Search size={12} /> Search dishes or scan code
              </div>
              <div className="mt-3 flex gap-1.5 overflow-hidden">
                {["Popular", "Starters", "Mains", "Drinks"].map(
                  (label, index) => (
                    <span
                      key={label}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[8px] font-bold ${index === 0 ? "bg-[#174e36] text-white" : "bg-white border border-[#d9dfdb]"}`}
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["Butter Chicken", "₹420", "from-[#edca7e] to-[#c66f31]"],
                  ["Paneer Tikka", "₹310", "from-[#dce6bd] to-[#789756]"],
                  ["Dal Makhani", "₹280", "from-[#d8bddf] to-[#8a5b98]"],
                  ["Garlic Naan", "₹90", "from-[#edd49b] to-[#b66c36]"],
                ].map(([name, price, gradient]) => (
                  <button
                    key={name}
                    type="button"
                    className="overflow-hidden rounded-xl border border-[#d9dfdb] bg-white p-2 text-left"
                  >
                    <span
                      className={`block h-16 rounded-lg bg-gradient-to-br ${gradient}`}
                    />
                    <strong className="mt-2 block text-[9px]">{name}</strong>
                    <span className="mt-1 flex justify-between text-[8px] text-[#6d756f]">
                      <span>{price}</span>
                      <b className="text-[#197341]">+ Add</b>
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="sticky bottom-1 mt-3 flex w-full justify-between rounded-xl bg-[#174e36] px-4 py-3 text-[10px] font-bold text-white"
              >
                <span>3 items · ₹820</span>
                <span>Review order →</span>
              </button>
            </>
          )}
        </main>
        <nav className="absolute inset-x-0 bottom-0 grid grid-cols-3 border-t border-[#d9dfdb] bg-white px-2 pb-3 pt-2">
          {(
            [
              ["home", "Home"],
              ["orders", "Orders"],
              ["new-order", "New order"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setScreen(key)}
              className={`py-1 text-[9px] font-bold ${screen === key ? "text-[#197341]" : "text-[#6d756f]"}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

type TicketStatus = "NEW" | "PREPARING" | "READY";
const initialTickets: Array<{
  id: string;
  table: string;
  time: string;
  status: TicketStatus;
  items: string[];
}> = [
  {
    id: "1048",
    table: "T12",
    time: "04:18",
    status: "NEW",
    items: ["1 × Truffle pizza", "Large · Extra mushroom", "1 × Berry cooler"],
  },
  {
    id: "1047",
    table: "T08",
    time: "08:42",
    status: "PREPARING",
    items: ["2 × Paneer bowl", "No onion", "1 × Garden mezze"],
  },
  {
    id: "1046",
    table: "TAKEAWAY",
    time: "12:07",
    status: "READY",
    items: ["1 × Truffle pizza", "1 × Garden mezze"],
  },
];

const KitchenDemo = () => {
  const [tickets, setTickets] = useState(initialTickets);
  const advance = (id: string) =>
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              status: ticket.status === "NEW" ? "PREPARING" : "READY",
            }
          : ticket,
      ),
    );
  return (
    <div className="overflow-hidden rounded-2xl border-[5px] border-[#101713] bg-[#151d18] text-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9ab0a1]">
            Kitchen display
          </p>
          <strong className="text-sm">Dinner service</strong>
        </div>
        <div className="flex gap-2 text-[9px]">
          <span className="rounded-full bg-white/10 px-2 py-1">
            {tickets.filter((t) => t.status !== "READY").length} active
          </span>
          <button
            type="button"
            onClick={() => setTickets(initialTickets)}
            className="rounded-full bg-white/10 px-2 py-1"
          >
            Reset demo
          </button>
        </div>
      </header>
      <div className="grid min-h-[390px] gap-3 p-3 md:grid-cols-3">
        {tickets.map((ticket) => (
          <article
            key={ticket.id}
            className="self-start overflow-hidden rounded-xl bg-[#fffdf8] text-[#172019]"
          >
            <header
              className={`flex justify-between px-3 py-2 text-[10px] font-black ${ticket.status === "NEW" ? "bg-[#f0b94f]" : ticket.status === "PREPARING" ? "bg-[#e96f35] text-white" : "bg-[#78b991]"}`}
            >
              <span>
                #{ticket.id} · {ticket.table}
              </span>
              <span>{ticket.time}</span>
            </header>
            <div className="p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#6d756f]">
                {ticket.status}
              </p>
              <div className="mt-2 space-y-1 text-[10px] leading-5">
                {ticket.items.map((item, index) => (
                  <p
                    key={`${item}-${index}`}
                    className={index === 1 ? "pl-3 text-[#b6592e]" : ""}
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={ticket.status === "READY"}
              onClick={() => advance(ticket.id)}
              className="mx-3 mb-3 w-[calc(100%-1.5rem)] rounded-lg bg-[#172019] py-2 text-[9px] font-bold text-white disabled:bg-[#d8ded9] disabled:text-[#5d6862]"
            >
              {ticket.status === "NEW"
                ? "Start preparing"
                : ticket.status === "PREPARING"
                  ? "Mark ready"
                  : "Ready for pickup"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};

const WebDemo = () => {
  const [section, setSection] = useState<
    "overview" | "business" | "orders" | "menu"
  >("overview");
  const content = useMemo(
    () =>
      ({
        overview: {
          title: "Today at a glance",
          subtitle: "Connaught Place · Live",
        },
        business: {
          title: "Business structure",
          subtitle: "Olive & Ember Group",
        },
        orders: { title: "Order operations", subtitle: "18 open orders" },
        menu: { title: "Menu management", subtitle: "146 active items" },
      })[section],
    [section],
  );
  return (
    <div className="overflow-hidden rounded-2xl border-[5px] border-[#172019] bg-[#f8faf8] text-[#172019] shadow-2xl">
      <header className="flex items-center justify-between border-b border-[#dfe6e1] px-4 py-3 text-[10px] font-bold">
        <span>servora · Olive & Ember</span>
        <span className="text-[#6e7a72]">All branches</span>
      </header>
      <div className="grid min-h-[390px] grid-cols-[96px_1fr] sm:grid-cols-[130px_1fr]">
        <aside className="border-r border-[#dfe6e1] bg-[#f1f5f2] p-2">
          {(
            [
              ["overview", "Overview"],
              ["business", "Business"],
              ["orders", "Orders"],
              ["menu", "Menu"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`mb-1 w-full rounded-lg px-2 py-2 text-left text-[9px] font-bold ${section === key ? "bg-[#dfeee4] text-[#174e36]" : "text-[#738078]"}`}
            >
              {label}
            </button>
          ))}
        </aside>
        <main className="min-w-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#23724d]">
                Management & POS
              </p>
              <h3 className="mt-1 text-lg font-bold">{content.title}</h3>
            </div>
            <span className="text-[8px] text-[#6e7a72]">
              {content.subtitle}
            </span>
          </div>
          {section === "overview" && (
            <>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Open orders", "18"],
                  ["Ready now", "06"],
                  ["Net sales", "₹42.8k"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#e0e5e1] bg-white p-3"
                  >
                    <span className="block text-[7px] text-[#6e7a72]">
                      {label}
                    </span>
                    <strong className="mt-1 block text-base">{value}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-[#e0e5e1] bg-white p-3">
                <div className="flex justify-between text-[9px] font-bold">
                  <span>Order activity</span>
                  <span className="text-[#23724d]">Updated now</span>
                </div>
                <div className="mt-5 flex h-28 items-end gap-2">
                  {[35, 52, 42, 74, 60, 88, 70, 95, 78, 64].map(
                    (height, index) => (
                      <span
                        key={index}
                        style={{ height: `${height}%` }}
                        className={`flex-1 rounded-t ${index % 3 === 0 ? "bg-[#e96f35]" : "bg-[#b9d9c4]"}`}
                      />
                    ),
                  )}
                </div>
              </div>
            </>
          )}
          {section === "business" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[#dfe6e1] bg-white p-4">
                <div className="flex justify-between">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-[#23724d]">
                      Business
                    </span>
                    <strong className="mt-1 block text-sm">
                      Olive & Ember Group
                    </strong>
                  </div>
                  <button className="text-[9px] font-bold text-[#174e36]">
                    Edit
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button className="rounded-lg bg-[#edf3ef] p-3 text-left text-[9px]">
                    <strong className="block">Delhi Franchise</strong>
                    <span className="text-[#6e7a72]">
                      2 branches · View details
                    </span>
                  </button>
                  <button className="rounded-lg border border-dashed border-[#b9c5bd] p-3 text-left text-[9px] font-bold text-[#174e36]">
                    + Create franchise
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-[#dfe6e1] bg-white p-4 text-[9px]">
                <strong>Branches</strong>
                <div className="mt-2 flex justify-between rounded-lg bg-[#f1f5f2] p-3">
                  <span>Connaught Place</span>
                  <span className="font-bold text-[#23724d]">Open · Edit</span>
                </div>
              </div>
            </div>
          )}
          {section === "orders" && (
            <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe6e1] bg-white">
              {[
                ["#1048", "Table 12", "Preparing", "₹1,228"],
                ["#1047", "Table 08", "Ready", "₹1,640"],
                ["#1046", "Takeaway", "Payment required", "₹920"],
                ["#1045", "Table 03", "Served", "₹2,180"],
              ].map((row, index) => (
                <div
                  key={row[0]}
                  className="grid grid-cols-4 gap-2 border-b border-[#e8ece9] p-3 text-[8px] last:border-0"
                >
                  <strong>{row[0]}</strong>
                  <span>{row[1]}</span>
                  <span
                    className={index === 1 ? "font-bold text-[#23724d]" : ""}
                  >
                    {row[2]}
                  </span>
                  <span className="text-right">{row[3]}</span>
                </div>
              ))}
            </div>
          )}
          {section === "menu" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Truffle mushroom pizza", "Mains · ₹560", "Available"],
                ["Smoky paneer bowl", "Mains · ₹420", "Available"],
                ["Garden mezze", "Starters · ₹380", "Available"],
                ["Berry cooler", "Drinks · ₹220", "Low stock"],
              ].map(([name, meta, status]) => (
                <button
                  key={name}
                  className="rounded-xl border border-[#dfe6e1] bg-white p-3 text-left"
                >
                  <strong className="block text-[9px]">{name}</strong>
                  <span className="mt-1 block text-[7px] text-[#6e7a72]">
                    {meta}
                  </span>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-1 text-[7px] font-bold ${status === "Available" ? "bg-[#e0eee5] text-[#23724d]" : "bg-[#fff0d7] text-[#a25b16]"}`}
                  >
                    {status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export const InteractiveProductDemos = () => {
  const [active, setActive] = useState<DemoKey>("customer");
  const selected = demos.find((demo) => demo.key === active) ?? demos[0]!;

  return (
    <section id="interactive-demos" className="bg-[#f6f2e8] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#23724d]">
              Try the connected product
            </p>
            <h2 className="mt-3 max-w-xl font-serif text-4xl font-bold tracking-[-0.03em] text-[#142219] sm:text-5xl">
              Four experiences. One shared operation.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#657068] sm:text-base">
            Place an order as a guest, manage it as a waiter, progress it
            through the kitchen, then inspect the operational result in the
            management workspace.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-[#dcd8cd] bg-[#fffdf8] shadow-[0_24px_70px_rgba(27,48,34,0.12)]">
          <div
            role="tablist"
            aria-label="Interactive Servora application demos"
            className="grid grid-cols-2 gap-1 border-b border-[#dcd8cd] bg-[#eee9de] p-2 lg:grid-cols-4"
          >
            {demos.map((demo) => (
              <DemoButton
                key={demo.key}
                active={active === demo.key}
                onClick={() => setActive(demo.key)}
              >
                {demo.label}
              </DemoButton>
            ))}
          </div>
          <div className="grid lg:grid-cols-[320px_1fr]">
            <aside className="border-b border-[#dcd8cd] p-7 lg:border-b-0 lg:border-r lg:p-9">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e96f35]">
                {selected.eyebrow}
              </p>
              <h3 className="mt-3 font-serif text-3xl font-bold leading-tight tracking-[-0.025em] text-[#142219]">
                {selected.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-[#657068]">
                {selected.description}
              </p>
              <ul className="mt-7 space-y-3">
                {selected.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-sm font-semibold text-[#26372c]"
                  >
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#174e36] text-white">
                      <Check size={12} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </aside>
            <div className="min-w-0 bg-[#e8eee9] p-4 sm:p-8 lg:p-10">
              {active === "customer" && <CustomerDemo />}
              {active === "waiter" && <WaiterDemo />}
              {active === "kitchen" && <KitchenDemo />}
              {active === "web" && <WebDemo />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
