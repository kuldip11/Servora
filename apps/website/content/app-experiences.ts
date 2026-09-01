export type AppExperience = {
  slug: string;
  name: string;
  audience: string;
  headline: string;
  description: string;
  features: { title: string; text: string }[];
  moments: string[];
  outcomes: string[];
};

export const appExperiences: AppExperience[] = [
  {
    slug: "management",
    name: "Management & POS",
    audience: "Owners, managers and front-of-house teams",
    headline: "Control the restaurant without stitching together separate systems.",
    description: "Manage orders, tables, menus, inventory, people, billing and performance from one branch-aware workspace.",
    features: [
      { title: "Orders and tables", text: "Run dine-in, takeaway and delivery orders, table transfers, split bills, merged tabs and additional rounds." },
      { title: "Advanced menu control", text: "Manage variants, modifiers, combos, allergens, schedules, happy hours, holidays and branch or channel overrides." },
      { title: "Recipe-aware inventory", text: "Connect recipes and sub-recipes to stock, waste logs, availability signals and cost impact." },
      { title: "Menu engineering", text: "Review item performance, costs and margins alongside live sales and operational reporting." },
      { title: "People and permissions", text: "Assign role-aware access, branch context and manager approvals with a searchable audit trail." },
      { title: "Multi-branch operations", text: "Keep central visibility while allowing branch-level menus, staff, tables and operating choices." },
    ],
    moments: ["Open the shift dashboard", "Manage the live floor", "Review exceptions and approvals", "Close with operational insight"],
    outcomes: ["One operational source of truth", "Faster exception handling", "Better cost and margin visibility"],
  },
  {
    slug: "kitchen",
    name: "Kitchen Display",
    audience: "Kitchen teams and expediter stations",
    headline: "A live kitchen queue that keeps the important details visible.",
    description: "Route tickets to the right station, track preparation and keep the front of house informed without paper handoffs.",
    features: [
      { title: "Station routing", text: "Show all, unassigned or station-specific tickets so each team sees the work meant for them." },
      { title: "Clear ticket detail", text: "Keep variants, modifiers, chef notes, quantities and table context attached to every item." },
      { title: "Timers and urgency", text: "See elapsed time, urgent-ticket emphasis and live counts for active, urgent and ready orders." },
      { title: "Preparation stages", text: "Advance tickets through received, preparing, ready and served states with one focused action." },
      { title: "Void protection", text: "Warn kitchen staff when an item is voided, including urgent stop-preparation alerts." },
      { title: "Resilient live operation", text: "Use realtime updates with a visible connection state and polling fallback when needed." },
    ],
    moments: ["Ticket reaches its station", "Cook sees every customization", "Timer flags attention", "Waiter sees the order is ready"],
    outcomes: ["Fewer missed modifications", "Cleaner station queues", "Faster handoff to service"],
  },
  {
    slug: "waiter",
    name: "Waiter App",
    audience: "Waiters and floor teams",
    headline: "Give every waiter the next best action, right in their hand.",
    description: "Take orders, manage active tables, respond to guests and coordinate with the kitchen from a mobile-first workspace.",
    features: [
      { title: "Fast mobile ordering", text: "Search the menu and configure variants, modifiers, combos, customer groups and buffet covers." },
      { title: "Ready-item alerts", text: "See when kitchen rounds are ready for pickup without repeatedly checking the kitchen." },
      { title: "Guest requests", text: "Respond to calls for a waiter, water, cutlery or the bill from the same home screen." },
      { title: "Table operations", text: "Transfer tables, merge tabs, split bills and keep availability visible while serving." },
      { title: "Customer context", text: "Find loyalty customers by name or phone and apply the appropriate customer-group context." },
      { title: "Controlled exceptions", text: "Handle cancellations, voids, comps and adjustments through role-aware manager approval." },
    ],
    moments: ["Select a table and guest", "Customize and send the order", "React to ready food or guest requests", "Prepare the table for settlement"],
    outcomes: ["Quicker table response", "Fewer trips to check status", "More confident service recovery"],
  },
  {
    slug: "customer",
    name: "Customer Ordering",
    audience: "Dine-in guests and takeaway customers",
    headline: "Let guests order, follow progress and ask for service—without downloading an app.",
    description: "Turn a table QR or takeaway link into a guided ordering experience that remains connected to the restaurant team.",
    features: [
      { title: "Easy menu discovery", text: "Browse categories, search dishes, see popular choices and review item imagery and descriptions." },
      { title: "Rich customization", text: "Choose variants, modifier quantities, combos and whether individual items are for the table or takeaway." },
      { title: "Offers and loyalty", text: "Submit coupon codes and a loyalty phone number for restaurant-validated pricing at checkout." },
      { title: "Live order progress", text: "Follow received, preparing, ready and served states, including multiple kitchen rounds." },
      { title: "Service on demand", text: "Call a waiter or request water, cutlery and the bill directly from the order screen." },
      { title: "Flexible settlement", text: "Keep dine-in tabs open for additional rounds or complete required online payment for takeaway." },
    ],
    moments: ["Scan or open the ordering link", "Browse and customize", "Send directly to the kitchen", "Track, order more or request help"],
    outcomes: ["Shorter ordering queues", "Greater order accuracy", "More control for every guest"],
  },
];

export const appExperienceBySlug = Object.fromEntries(appExperiences.map((app) => [app.slug, app]));
