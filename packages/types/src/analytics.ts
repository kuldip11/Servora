export interface DashboardStats {
  totalOrdersToday: number;
  revenueToday: number;
  activeOrders: number;
  lowStockAlerts: number;
  paidOrdersToday: number;
  cancelledOrdersToday: number;
  averageOrderValue: number;
  topItems: {
    name: string;
    count: number;
    revenue: number;
  }[];
  revenueByHour: {
    hour: number;
    revenue: number;
  }[];
}

export interface CostMarginRow {
  menuItemId: string;
  menuItemName: string;
  categoryId: string;
  categoryName: string;
  variantId: string | null;
  variantName: string | null;
  price: number;
  cost: number;
  margin: number;
  marginPercent: number;
}

export type MenuEngineeringQuadrant = "STAR" | "PUZZLE" | "PLOWHORSE" | "DOG";
export interface MenuEngineeringRow extends CostMarginRow {
  salesVolume: number;
  quadrant: MenuEngineeringQuadrant;
  recommendation: string;
}
