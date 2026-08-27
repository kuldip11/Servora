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
