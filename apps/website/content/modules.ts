export type Module = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  capabilities: string[];
  workflow: string[];
  roles: string[];
  related: string[];
};

export const modules: Module[] = [
  {
    slug: "pos-and-orders",
    name: "POS & Orders",
    eyebrow: "Front of house",
    description:
      "Keep orders moving from the counter or table to the right operational team.",
    capabilities: [
      "Order creation and management",
      "Tables and order context",
      "Order status workflows",
    ],
    workflow: [
      "Capture the order",
      "Keep table and order context together",
      "Move the order into the operational workflow",
    ],
    roles: ["Cashiers", "Managers", "Front-of-house teams"],
    related: ["qr-ordering", "kitchen-display", "billing-and-payments"],
  },
  {
    slug: "menu-management",
    name: "Menu Management",
    eyebrow: "Catalog",
    description:
      "Manage categories, items, modifiers, variants and availability from one place.",
    capabilities: [
      "Categories and menu items",
      "Modifiers and variants",
      "Availability and scheduling",
    ],
    workflow: [
      "Organize the catalog",
      "Configure item choices",
      "Control availability across operations",
    ],
    roles: ["Managers", "Menu operators", "Branch teams"],
    related: ["qr-ordering", "inventory", "multi-branch"],
  },
  {
    slug: "qr-ordering",
    name: "QR Ordering",
    eyebrow: "Customer experience",
    description:
      "Let guests browse the menu and place orders from their own devices.",
    capabilities: [
      "QR customer sessions",
      "Menu browsing and search",
      "Cart and order status",
    ],
    workflow: [
      "Guest opens the QR experience",
      "Browses and customizes items",
      "Places and follows the order",
    ],
    roles: ["Guests", "Restaurant teams", "Managers"],
    related: ["pos-and-orders", "kitchen-display", "menu-management"],
  },
  {
    slug: "kitchen-display",
    name: "Kitchen Display",
    eyebrow: "Kitchen",
    description:
      "Give kitchen teams a focused view of tickets and order progress.",
    capabilities: ["Kitchen tickets", "Operational status", "Realtime updates"],
    workflow: [
      "Receive the ticket",
      "Work the kitchen queue",
      "Advance order status",
    ],
    roles: ["Kitchen staff", "Kitchen leads", "Managers"],
    related: ["pos-and-orders", "qr-ordering", "analytics"],
  },
  {
    slug: "billing-and-payments",
    name: "Billing & Payments",
    eyebrow: "Checkout",
    description:
      "Support restaurant billing workflows and the payment methods exposed by the product.",
    capabilities: [
      "Billing workflows",
      "Payment method support",
      "Refund workflows",
    ],
    workflow: [
      "Prepare the bill",
      "Record the supported payment flow",
      "Handle refund workflows when needed",
    ],
    roles: ["Cashiers", "Managers", "Finance teams"],
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
      "Role-based access",
      "Tenant and branch context",
    ],
    workflow: [
      "Manage team members",
      "Assign role-aware access",
      "Keep branch context aligned",
    ],
    roles: ["Owners", "Managers", "Staff administrators"],
    related: ["multi-branch", "security", "pos-and-orders"],
  },
  {
    slug: "inventory",
    name: "Inventory",
    eyebrow: "Operations",
    description:
      "Connect restaurant operations to inventory and recipe-aware workflows.",
    capabilities: ["Inventory management", "Recipes", "Availability workflows"],
    workflow: [
      "Maintain stock information",
      "Connect recipes to operations",
      "Use availability signals in workflows",
    ],
    roles: ["Managers", "Operations teams", "Kitchen teams"],
    related: ["menu-management", "analytics", "multi-branch"],
  },
  {
    slug: "analytics",
    name: "Analytics",
    eyebrow: "Insights",
    description: "Turn operational data into useful restaurant-level insights.",
    capabilities: [
      "Operational reporting",
      "Dashboard analytics",
      "Order and sales insights",
    ],
    workflow: [
      "Collect operational activity",
      "Review restaurant-level signals",
      "Use insights to guide decisions",
    ],
    roles: ["Owners", "Managers", "Operations teams"],
    related: ["pos-and-orders", "inventory", "multi-branch"],
  },
  {
    slug: "multi-branch",
    name: "Multi-Branch",
    eyebrow: "Scale",
    description:
      "Support restaurant organizations operating across branches and shared tenant context.",
    capabilities: ["Branch management", "Tenant context", "Role-aware access"],
    workflow: [
      "Organize branches",
      "Keep tenant and branch context clear",
      "Apply role-aware access across the organization",
    ],
    roles: ["Owners", "Regional managers", "Multi-location operators"],
    related: ["staff-and-roles", "analytics", "menu-management"],
  },
  {
    slug: "security",
    name: "Security & Reliability",
    eyebrow: "Trust",
    description:
      "A trust layer built around authentication, authorization and responsible product claims.",
    capabilities: ["Authentication", "RBAC", "Tenant isolation architecture"],
    workflow: [
      "Authenticate users",
      "Authorize actions by role",
      "Keep tenant context isolated",
    ],
    roles: ["Owners", "Managers", "Administrators"],
    related: ["staff-and-roles", "multi-branch"],
  },
];

export const moduleBySlug = Object.fromEntries(
  modules.map((module) => [module.slug, module]),
);
