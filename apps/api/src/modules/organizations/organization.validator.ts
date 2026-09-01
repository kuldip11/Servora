import { t } from "elysia";

const optionalString = (maxLength: number) =>
  t.Optional(t.Union([t.String({ maxLength }), t.Null()]));

export const createOrganizationBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  businessType: optionalString(50),
  country: optionalString(2),
  timezone: optionalString(64),
  currency: optionalString(3),
  primaryContactName: optionalString(150),
  businessEmail: optionalString(255),
  businessPhone: optionalString(30),
  addressLine1: optionalString(300),
  addressLine2: optionalString(300),
  city: optionalString(120),
  stateProvince: optionalString(120),
  postalCode: optionalString(24),
  legalName: optionalString(200),
  website: optionalString(500),
  taxRegistrationNumber: optionalString(100),
  gstin: optionalString(15),
  pan: optionalString(10),
  companyRegistrationNumber: optionalString(100),
  logoUrl: optionalString(1000),
});

export const updateOrganizationBody = t.Partial(createOrganizationBody);

export const organizationIdParams = t.Object({ id: t.String() });

export const organizationMenuIdParams = t.Object({
  organizationId: t.String(),
  menuId: t.String(),
});
export const organizationIdOnlyParams = t.Object({
  organizationId: t.String(),
});
export const loyaltyTierParams = t.Object({
  organizationId: t.String(),
  tierId: t.String(),
});

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
