import { t } from "elysia";

export const createOrganizationBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
});

export const updateOrganizationBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
});

export const organizationIdParams = t.Object({ id: t.String() });

export const organizationLoyaltyTierParams = t.Object({
  id: t.String({ format: "uuid" }),
  tierId: t.String({ format: "uuid" }),
});

export const organizationMenuParams = t.Object({
  id: t.String({ format: "uuid" }),
  menuId: t.String({ format: "uuid" }),
});
const organizationMenuItem = t.Object({
  itemSku: t.String({ minLength: 1, maxLength: 50 }),
  categoryName: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
  sortOrder: t.Optional(t.Integer()),
});
export const createOrganizationMenuBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.Union([t.String(), t.Null()])),
  status: t.Optional(t.Union([t.Literal("DRAFT"), t.Literal("PUBLISHED")])),
  isDefault: t.Optional(t.Boolean()),
  availableChannels: t.Optional(
    t.Union([
      t.Array(t.Union([t.Literal("STAFF"), t.Literal("CUSTOMER_QR")])),
      t.Null(),
    ]),
  ),
  availableFulfillmentTypes: t.Optional(
    t.Union([
      t.Array(
        t.Union([
          t.Literal("DINE_IN"),
          t.Literal("TAKEAWAY"),
          t.Literal("DELIVERY"),
          t.Literal("ONLINE"),
        ]),
      ),
      t.Null(),
    ]),
  ),
  effectiveFrom: t.Optional(t.Union([t.String(), t.Null()])),
  items: t.Array(organizationMenuItem),
});
export const updateOrganizationMenuBody = t.Partial(createOrganizationMenuBody);
