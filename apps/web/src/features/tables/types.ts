import type { TableStatus } from "@pos/types";

export interface RestaurantTable {
  id: string;
  branchId: string;
  name: string;
  capacity: number;
  section: string | null;
  status: TableStatus;
  isActive: boolean;
  publicQrToken: string;
  branch?: { id: string; name: string };
}

export interface TableFormInput {
  name: string;
  capacity?: number;
  section?: string;
  branchId?: string;
}
