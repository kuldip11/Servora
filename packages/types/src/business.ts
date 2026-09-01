export type OrganizationBusinessType =
  | "RESTAURANT_GROUP"
  | "INDEPENDENT_RESTAURANT"
  | "HOSPITALITY_GROUP"
  | "CLOUD_KITCHEN_GROUP"
  | "CAFE_GROUP"
  | "QSR_GROUP"
  | "FOOD_SERVICE_COMPANY"
  | "OTHER";

export type FranchiseBusinessModel =
  | "RESTAURANT"
  | "CAFE"
  | "CLOUD_KITCHEN"
  | "QSR"
  | "FINE_DINING"
  | "FOOD_COURT"
  | "BAKERY"
  | "BAR_PUB"
  | "OTHER";

export type BusinessEntityStatus = "ACTIVE" | "INACTIVE";
export type NegativeStockPolicy = "BLOCK" | "ALLOW" | "WARN";
