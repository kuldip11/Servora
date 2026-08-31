-- Canonical pre-v1 enum baseline.

CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
--> statement-breakpoint
CREATE TYPE "tax_mode" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');
--> statement-breakpoint
CREATE TYPE "rounding_policy" AS ENUM ('NONE', 'NEAREST_1', 'NEAREST_5', 'NEAREST_10');
--> statement-breakpoint
CREATE TYPE "role_scope" AS ENUM ('GLOBAL', 'TENANT', 'BRANCH');
--> statement-breakpoint
CREATE TYPE "membership_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
--> statement-breakpoint
CREATE TYPE "table_status" AS ENUM ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'RESERVED');
--> statement-breakpoint
CREATE TYPE "customer_session_mode" AS ENUM ('DINE_IN', 'TAKEAWAY');
--> statement-breakpoint
CREATE TYPE "menu_item_status" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'HIDDEN', 'SEASONAL', 'DISCONTINUED');
--> statement-breakpoint
CREATE TYPE "food_type" AS ENUM ('VEG', 'NON_VEG', 'EGG');
--> statement-breakpoint
CREATE TYPE "menu_item_display_mode" AS ENUM ('STANDARD', 'GUIDED_BUILDER');
--> statement-breakpoint
CREATE TYPE "spice_level" AS ENUM ('NONE', 'MILD', 'MEDIUM', 'HOT');
--> statement-breakpoint
CREATE TYPE "modifier_selection_type" AS ENUM ('SINGLE', 'MULTIPLE');
--> statement-breakpoint
CREATE TYPE "modifier_group_type" AS ENUM ('ADDON', 'SUBSTITUTION');
--> statement-breakpoint
CREATE TYPE "combo_price_policy" AS ENUM ('FIXED', 'PERCENT_OFF_SUM');
--> statement-breakpoint
CREATE TYPE "zone_pricing_rule" AS ENUM ('AVERAGE', 'HIGHER', 'SUM_HALF');
--> statement-breakpoint
CREATE TYPE "pricing_mode" AS ENUM ('FIXED', 'WEIGHT_BASED', 'OPEN');
--> statement-breakpoint
CREATE TYPE "weight_unit" AS ENUM ('G', 'KG', 'LB', 'OZ');
--> statement-breakpoint
CREATE TYPE "menu_status" AS ENUM ('DRAFT', 'PUBLISHED');
--> statement-breakpoint
CREATE TYPE "menu_change_entity_type" AS ENUM ('MENU_ITEM', 'VARIANT', 'MODIFIER_GROUP', 'MODIFIER_OPTION', 'CATEGORY', 'MENU', 'MENU_MEMBERSHIP', 'PRICE_RULE', 'PROMOTION', 'RECIPE', 'SUB_RECIPE', 'TEMPLATE', 'AVAILABILITY', 'TAG');
--> statement-breakpoint
CREATE TYPE "menu_change_type" AS ENUM ('CREATED', 'UPDATED', 'PUBLISHED', 'ARCHIVED', 'DELETED');
--> statement-breakpoint
CREATE TYPE "menu_item_schedule_type" AS ENUM ('DAILY', 'WEEKLY', 'SPECIFIC_DATE', 'HOLIDAY');
--> statement-breakpoint
CREATE TYPE "order_source" AS ENUM ('STAFF', 'CUSTOMER_QR');
--> statement-breakpoint
CREATE TYPE "order_type" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE');
--> statement-breakpoint
CREATE TYPE "cover_tier" AS ENUM ('ADULT', 'CHILD');
--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM ('OPEN', 'BILL_REQUESTED', 'PAID', 'CLOSED', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "billing_mode" AS ENUM ('LINE_ITEMS', 'PER_COVER');
--> statement-breakpoint
CREATE TYPE "kitchen_ticket_status" AS ENUM ('PENDING_PAYMENT', 'HELD', 'FIRED', 'PREPARING', 'READY', 'SERVED');
--> statement-breakpoint
CREATE TYPE "order_item_fulfillment_type" AS ENUM ('DINE_IN', 'TAKEAWAY');
--> statement-breakpoint
CREATE TYPE "order_item_status" AS ENUM ('ACTIVE', 'VOIDED', 'COMPED', 'REFIRED');
--> statement-breakpoint
CREATE TYPE "refire_type" AS ENUM ('REFIRE', 'REFILL');
--> statement-breakpoint
CREATE TYPE "inventory_unit" AS ENUM ('KG', 'GRAMS', 'LITERS', 'ML', 'PIECES', 'PACKETS');
--> statement-breakpoint
CREATE TYPE "inventory_transaction_type" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'WASTE');
--> statement-breakpoint
CREATE TYPE "promotion_rule_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BOGO');
--> statement-breakpoint
CREATE TYPE "promotion_scope" AS ENUM ('ORDER', 'CATEGORY', 'ITEM');
--> statement-breakpoint
CREATE TYPE "void_comp_action" AS ENUM ('VOID', 'COMP');
--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM ('CASH', 'CARD', 'UPI', 'RAZORPAY', 'STRIPE');
--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
--> statement-breakpoint
CREATE TYPE "customer_request_type" AS ENUM ('CALL_WAITER', 'WATER', 'CUTLERY', 'BILL', 'ASSISTANCE');
--> statement-breakpoint
CREATE TYPE "customer_request_status" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');
--> statement-breakpoint
