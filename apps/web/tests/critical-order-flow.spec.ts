import { expect, test, type Page, type Route } from "@playwright/test";

const tenantId = "tenant-1";
const branchId = "branch-1";

const user = {
  id: "user-1",
  tenantId,
  branchId: null,
  firstName: "Test",
  lastName: "Owner",
  email: "owner@example.com",
  status: "ACTIVE",
  roles: [
    {
      id: "role-owner",
      name: "OWNER",
      description: "Owner",
      permissions: [
        { id: "p-analytics", key: "analytics:read", module: "analytics" },
        { id: "p-orders-read", key: "orders:read", module: "orders" },
        { id: "p-orders-create", key: "orders:create", module: "orders" },
        { id: "p-branch-read", key: "branch:read", module: "branches" },
      ],
    },
  ],
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
};

const membership = {
  membershipId: "membership-1",
  tenant: { id: tenantId, name: "Demo Restaurant" },
  roles: [{ id: "role-owner", name: "OWNER", scope: "TENANT" }],
  branches: [
    {
      id: branchId,
      name: "Main Branch",
      address: "Test Street",
      isActive: true,
      tablesEnabled: true,
    },
  ],
};

const branch = {
  id: branchId,
  tenantId,
  name: "Main Branch",
  code: "MAIN",
  timezone: "Asia/Kolkata",
  currency: "INR",
  address: "Test Street",
  phone: "",
  isActive: true,
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
  onlineEnabled: true,
  tablesEnabled: true,
};

const menuItem = {
  id: "item-1",
  tenantId,
  branchId: null,
  categoryId: "category-1",
  name: "Margherita Pizza",
  description: "Classic tomato and cheese",
  basePrice: 250,
  taxRate: 5,
  isAvailable: true,
  imageUrl: null,
  foodType: "VEG",
  spiceLevel: null,
  sku: "PIZZA-1",
  prepTimeMinutes: 15,
  sortOrder: 1,
  hsnCode: null,
  status: "AVAILABLE",
  availabilityReason: null,
  statusChangedAt: "2026-08-31T00:00:00.000Z",
  enableRecipeDeduction: false,
  isPublished: true,
  publishedAt: "2026-08-31T00:00:00.000Z",
  variants: [],
  modifierGroupLinks: [],
};

function json(route: Route, data: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ data }),
  });
}

async function installApi(page: Page) {
  let orders: Array<Record<string, unknown>> = [];
  let capturedCreateOrder: unknown = null;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (method === "POST" && path === "/api/auth/login") {
      return json(route, {
        accessToken: "access-token",
        expiresIn: 900,
        user,
        memberships: [membership],
      });
    }
    if (method === "POST" && path === "/api/auth/refresh") {
      return json(route, {
        accessToken: "access-token-refreshed",
        expiresIn: 900,
        user,
        memberships: [membership],
      });
    }
    if (method === "GET" && path === "/api/auth/memberships") {
      return json(route, [membership]);
    }
    if (method === "GET" && path === "/api/organizations") {
      return json(route, [
        { id: "org-1", name: "Demo Organization", isActive: true },
      ]);
    }
    if (method === "GET" && path === "/api/branches") {
      return json(route, [branch]);
    }
    if (method === "GET" && path === "/api/tenants") {
      return json(route, [
        {
          tenant: {
            id: tenantId,
            name: "Demo Restaurant",
            plan: "FREE",
            courseSequencingEnabled: false,
            createdAt: "2026-08-31T00:00:00.000Z",
          },
        },
      ]);
    }
    if (method === "GET" && path === "/api/orders") {
      return json(route, orders);
    }
    if (method === "GET" && path === "/api/tables") {
      return json(route, [
        {
          id: "table-1",
          branchId,
          name: "Table 1",
          capacity: 4,
          section: "Main",
          status: "AVAILABLE",
          isActive: true,
          publicQrToken: "qr-table-1",
        },
      ]);
    }
    if (method === "GET" && path === "/api/menu/categories") {
      return json(route, [
        {
          id: "category-1",
          tenantId,
          branchId: null,
          name: "Pizza",
          description: null,
          sortOrder: 1,
          isActive: true,
          menuItems: [menuItem],
        },
      ]);
    }
    if (method === "GET" && path === "/api/menu/menus/active") {
      return json(route, [
        {
          id: "menu-1",
          name: "Main Menu",
          memberships: [{ menuItemId: menuItem.id }],
        },
      ]);
    }
    if (method === "POST" && path === "/api/orders") {
      capturedCreateOrder = request.postDataJSON();
      const created = {
        id: "order-00000001",
        tenantId,
        branchId,
        tableId: "table-1",
        type: "DINE_IN",
        status: "OPEN",
        subtotal: "250.00",
        taxAmount: "12.50",
        totalAmount: "262.50",
        createdAt: "2026-08-31T12:00:00.000Z",
        updatedAt: "2026-08-31T12:00:00.000Z",
        table: { id: "table-1", name: "Table 1" },
        items: [{ id: "order-item-1", menuItemId: menuItem.id, quantity: 1 }],
        kitchenTickets: [],
      };
      orders = [created];
      return json(route, created, 201);
    }

    return json(route, []);
  });

  return {
    getCapturedCreateOrder: () => capturedCreateOrder,
  };
}

test("owner can sign in, select context, and create a dine-in order", async ({
  page,
}) => {
  const api = await installApi(page);

  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/context$/);
  await page.getByRole("button", { name: /Demo Restaurant/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByText("0 total orders")).toBeVisible();

  await page.getByRole("button", { name: "New Order" }).first().click();
  await page.getByLabel("Table (required)").selectOption("table-1");
  await page.getByRole("button", { name: /Margherita Pizza/ }).click();
  await page.getByRole("button", { name: "Place Order" }).click();

  await expect(page.getByText("Order created successfully!")).toBeVisible();
  await expect(page.getByText("1 total orders")).toBeVisible();
  await expect(page.getByText("Table 1")).toBeVisible();

  expect(api.getCapturedCreateOrder()).toEqual({
    type: "DINE_IN",
    tableId: "table-1",
    items: [
      {
        menuItemId: "item-1",
        quantity: 1,
        selectedOptions: [],
      },
    ],
  });
});
