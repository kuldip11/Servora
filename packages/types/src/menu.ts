import type { Branch } from './auth';
import { Recipe } from './inventory';

export type FoodType = 'VEG' | 'NON_VEG' | 'EGG';

export type SpiceLevel = 'NONE' | 'MILD' | 'MEDIUM' | 'HOT';

export type ModifierSelectionType = 'SINGLE' | 'MULTIPLE';

export type MenuItemStatus =
  | 'ACTIVE'
  | 'OUT_OF_STOCK'
  | 'HIDDEN'
  | 'SEASONAL'
  | 'DISCONTINUED';

export type MenuItemScheduleType =
  | 'DAILY'
  | 'WEEKLY'
  | 'SPECIFIC_DATE'
  | 'HOLIDAY';

export interface MenuItemSchedule {
  id: string;
  tenantId: string;
  menuItemId: string;
  branchId: string | null;
  scheduleType: MenuItemScheduleType;
  startTime: string | null;
  endTime: string | null;
  dayOfWeek: number | null;
  startDate: string | null;
  endDate: string | null;
  holidayName: string | null;
  statusDuringPeriod: MenuItemStatus;
  isActive: boolean;
}

export interface Holiday {
  id: string;
  tenantId: string;
  name: string;
  holidayDate: string;
  region: string | null;
}

export interface EffectiveStatus {
  status: MenuItemStatus;
  reason: string;
  nextChange?: string | null;
}

export interface MenuItemBranchOverride {
  id: string;
  tenantId: string;
  menuItemId: string;
  branchId: string;
  price: number | null;
  taxRate: number | null;
  prepTimeMinutes: number | null;
  status: MenuItemStatus | null;
  isHidden: boolean;
  availabilityReason: string | null;
  branch?: Branch;
}

export interface EffectiveMenuItem extends MenuItem {
  effectivePrice: number;
  effectiveTaxRate: number;
  effectivePrepTimeMinutes: number | null;
  effectiveStatus: MenuItemStatus;
  isHidden: boolean;
  overrideApplied: boolean;
}

export interface MenuCategory {
  id: string;
  tenantId: string;
  branchId: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  tenantId: string;
  branchId: string | null;
  categoryId: string;
  name: string;
  description: string | null;
  basePrice: number;
  taxRate: number;
  isAvailable: boolean;
  imageUrl: string | null;
  foodType: FoodType;
  spiceLevel: SpiceLevel | null;
  sku: string | null;
  prepTimeMinutes: number | null;
  sortOrder: number;
  hsnCode: string | null;
  status: MenuItemStatus;
  availabilityReason: string | null;
  statusChangedAt: string;
  enableRecipeDeduction: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  variants: MenuItemVariant[];
  images?: MenuItemImage[];
  modifierGroupLinks?: Array<{
    modifierGroupId: string;
    sortOrder: number;
    group: ModifierGroup;
  }>;
  tagLinks?: Array<{
    tagId: string;
    tag: MenuTag;
  }>;
  allergenLinks?: Array<{
    allergenId: string;
    allergen: MenuAllergen;
  }>;
  recipeLinks?: Recipe[];
  schedules?: MenuItemSchedule[];
}

export interface MenuItemVariant {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
}

export interface MenuItemImage {
  id: string;
  menuItemId: string;
  url: string;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  tenantId: string;
  branchId: string | null;
  name: string;
  selectionType: ModifierSelectionType;
  minSelections: number;
  maxSelections: number | null;
  sortOrder: number;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  modifierGroupId: string;
  name: string;
  additionalPrice: number;
  isAvailable: boolean;
  maxQuantity: number;
  sortOrder: number;
}

export interface MenuTag {
  id: string;
  tenantId: string;
  name: string;
  color: string | null;
}

export interface MenuAllergen {
  id: string;
  name: string;
}