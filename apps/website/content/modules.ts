export type Module = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  capabilities: string[];
  workflow: string[];
  roles: string[];
  related: string[];
  outcomes?: string[];
};

export const modules: Module[] = [
  {
    slug: "pos-and-orders",
    name: "POS & Orders",
    eyebrow: "Front of house",
    description:
      "Keep orders moving from the counter or table to the right operational team.",
    capabilities: [
      "Dine-in, takeaway and delivery orders",
      "Tables, transfers, split bills and merged tabs",
      "Voids, comps and manager-controlled adjustments",
    ],
    workflow: [
      "Capture the order",
      "Keep table and order context together",
      "Move the order into the operational workflow",
    ],
    roles: ["Cashiers", "Managers", "Front-of-house teams"],
    outcomes: ["Fewer handoffs", "Clearer table context", "Faster service recovery"],
    related: ["qr-ordering", "kitchen-display", "billing-and-payments"],
  },
  {
    slug: "menu-management",
    name: "Menu Management",
    eyebrow: "Catalog",
    description:
      "Manage categories, items, modifiers, variants and availability from one place.",
    capabilities: [
      "Categories, variants, modifiers, combos and allergens",
      "Branch, channel, schedule and holiday controls",
      "Bulk editing, templates, import and export",
    ],
    workflow: [
      "Organize the catalog",
      "Configure item choices",
      "Control availability across operations",
    ],
    roles: ["Managers", "Menu operators", "Branch teams"],
    outcomes: ["One source of menu truth", "Faster updates", "Consistent branch execution"],
    related: ["qr-ordering", "inventory", "multi-branch"],
  },
  {
    slug: "qr-ordering",
    name: "QR Ordering",
    eyebrow: "Customer experience",
    description:
      "Let guests browse the menu and place orders from their own devices.",
    capabilities: [
      "QR table sessions and takeaway ordering",
      "Combos, variants, modifiers, coupons and loyalty",
      "Live status, order-more and service requests",
    ],
    workflow: [
      "Guest opens the QR experience",
      "Browses and customizes items",
      "Places and follows the order",
    ],
    roles: ["Guests", "Restaurant teams", "Managers"],
    outcomes: ["Shorter ordering queues", "More guest control", "Less routine waiter traffic"],
    related: ["pos-and-orders", "kitchen-display", "menu-management"],
  },
  {
    slug: "kitchen-display",
    name: "Kitchen Display",
    eyebrow: "Kitchen",
    description:
      "Give kitchen teams a focused view of tickets and order progress.",
    capabilities: [
      "Station-routed tickets with modifiers and chef notes",
      "Timers, urgency, audible alerts and void warnings",
      "Live updates with resilient polling fallback",
    ],
    workflow: [
      "Receive the ticket",
      "Work the kitchen queue",
      "Advance order status",
    ],
    roles: ["Kitchen staff", "Kitchen leads", "Managers"],
    outcomes: ["Cleaner kitchen queues", "Fewer missed changes", "Faster pickup coordination"],
    related: ["pos-and-orders", "qr-ordering", "analytics"],
  },
  {
    slug: "billing-and-payments",
    name: "Billing & Payments",
    eyebrow: "Checkout",
    description:
      "Support restaurant billing workflows and the payment methods exposed by the product.",
    capabilities: [
      "Line-item and per-cover billing",
      "Cash, supported digital payment and table settlement flows",
      "Refunds, rounding and controlled adjustments",
    ],
    workflow: [
      "Prepare the bill",
      "Record the supported payment flow",
      "Handle refund workflows when needed",
    ],
    roles: ["Cashiers", "Managers", "Finance teams"],
    outcomes: ["Transparent totals", "Controlled exceptions", "Cleaner reconciliation"],
    related: ["pos-and-orders", "analytics", "multi-branch"],
  },
  {
    slug: "staff-and-roles",
    name: "Staff & Roles",
    eyebrow: "Team",
    description:
      "Organize staff access around restaurant roles and permissions.",
    capabilities: [
      "Staff management",
      "Role and permission-based access",
      "Organization, tenant and branch context",
    ],
    workflow: [
      "Manage team members",
      "Assign role-aware access",
      "Keep branch context aligned",
    ],
    roles: ["Owners", "Managers", "Staff administrators"],
    outcomes: ["Right access by role", "Safer delegation", "Simpler multi-branch staffing"],
    related: ["multi-branch", "security", "pos-and-orders"],
  },
  {
    slug: "inventory",
    name: "Inventory",
    eyebrow: "Operations",
    description:
      "Connect restaurant operations to inventory and recipe-aware workflows.",
    capabilities: [
      "Stock, transactions and waste logging",
      "Recipes, sub-recipes and ingredient impact",
      "Availability signals tied to operations",
    ],
    workflow: [
      "Maintain stock information",
      "Connect recipes to operations",
      "Use availability signals in workflows",
    ],
    roles: ["Managers", "Operations teams", "Kitchen teams"],
    outcomes: ["Better cost visibility", "Less preventable waste", "More reliable availability"],
    related: ["menu-management", "analytics", "multi-branch"],
  },
  {
    slug: "analytics",
    name: "Analytics",
    eyebrow: "Insights",
    description: "Turn operational data into useful restaurant-level insights.",
    capabilities: [
      "Live operational dashboard",
      "Sales, order and branch insights",
      "Menu engineering and cost-margin reporting",
    ],
    workflow: [
      "Collect operational activity",
      "Review restaurant-level signals",
      "Use insights to guide decisions",
    ],
    roles: ["Owners", "Managers", "Operations teams"],
    outcomes: ["Faster daily decisions", "Clearer item profitability", "Comparable branch performance"],
    related: ["pos-and-orders", "inventory", "multi-branch"],
  },
  {
    slug: "multi-branch",
    name: "Multi-Branch",
    eyebrow: "Scale",
    description:
      "Support restaurant organizations operating across branches and shared tenant context.",
    capabilities: [
      "Branch configuration and operational controls",
      "Shared organization and tenant context",
      "Branch-aware menus, staff and reporting",
    ],
    workflow: [
      "Organize branches",
      "Keep tenant and branch context clear",
      "Apply role-aware access across the organization",
    ],
    roles: ["Owners", "Regional managers", "Multi-location operators"],
    outcomes: ["Consistent operations", "Local flexibility", "Central visibility"],
    related: ["staff-and-roles", "analytics", "menu-management"],
  },
  {
    slug: "security",
    name: "Security & Reliability",
    eyebrow: "Trust",
    description:
      "A trust layer built around authentication, authorization and responsible product claims.",
    capabilities: [
      "Authentication and session controls",
      "Permission-based authorization and approvals",
      "Tenant isolation architecture and audit trails",
    ],
    workflow: [
      "Authenticate users",
      "Authorize actions by role",
      "Keep tenant context isolated",
    ],
    roles: ["Owners", "Managers", "Administrators"],
    outcomes: ["Reduced access risk", "Accountable changes", "Clear operational boundaries"],
    related: ["staff-and-roles", "multi-branch"],
  },
];

export const moduleBySlug = Object.fromEntries(
  modules.map((module) => [module.slug, module]),
);
