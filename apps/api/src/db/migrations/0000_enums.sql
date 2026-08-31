

CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

CREATE TYPE "tax_mode" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');

CREATE TYPE "rounding_policy" AS ENUM ('NONE', 'NEAREST_1', 'NEAREST_5', 'NEAREST_10');

CREATE TYPE "role_scope" AS ENUM ('GLOBAL', 'TENANT', 'BRANCH');

CREATE TYPE "membership_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

CREATE TYPE "table_status" AS ENUM ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'RESERVED');

CREATE TYPE "customer_session_mode" AS ENUM ('DINE_IN', 'TAKEAWAY');

CREATE TYPE "menu_item_status" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'HIDDEN', 'SEASONAL', 'DISCONTINUED');

CREATE TYPE "food_type" AS ENUM ('VEG', 'NON_VEG', 'EGG');

CREATE TYPE "menu_item_display_mode" AS ENUM ('STANDARD', 'GUIDED_BUILDER');

CREATE TYPE "spice_level" AS ENUM ('NONE', 'MILD', 'MEDIUM', 'HOT');

CREATE TYPE "modifier_selection_type" AS ENUM ('SINGLE', 'MULTIPLE');

CREATE TYPE "modifier_group_type" AS ENUM ('ADDON', 'SUBSTITUTION');

CREATE TYPE "combo_price_policy" AS ENUM ('FIXED', 'PERCENT_OFF_SUM');

CREATE TYPE "zone_pricing_rule" AS ENUM ('AVERAGE', 'HIGHER', 'SUM_HALF');

CREATE TYPE "pricing_mode" AS ENUM ('FIXED', 'WEIGHT_BASED', 'OPEN');

CREATE TYPE "weight_unit" AS ENUM ('G', 'KG', 'LB', 'OZ');

CREATE TYPE "menu_status" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE "menu_change_entity_type" AS ENUM ('MENU_ITEM', 'VARIANT', 'MODIFIER_GROUP', 'MODIFIER_OPTION', 'CATEGORY', 'MENU', 'MENU_MEMBERSHIP', 'PRICE_RULE', 'PROMOTION', 'RECIPE', 'SUB_RECIPE', 'TEMPLATE', 'AVAILABILITY', 'TAG');

CREATE TYPE "menu_change_type" AS ENUM ('CREATED', 'UPDATED', 'PUBLISHED', 'ARCHIVED', 'DELETED');

CREATE TYPE "menu_item_schedule_type" AS ENUM ('DAILY', 'WEEKLY', 'SPECIFIC_DATE', 'HOLIDAY');

CREATE TYPE "order_source" AS ENUM ('STAFF', 'CUSTOMER_QR');

CREATE TYPE "order_type" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE');

CREATE TYPE "cover_tier" AS ENUM ('ADULT', 'CHILD');

CREATE TYPE "order_status" AS ENUM ('OPEN', 'BILL_REQUESTED', 'PAID', 'CLOSED', 'CANCELLED');

CREATE TYPE "billing_mode" AS ENUM ('LINE_ITEMS', 'PER_COVER');

CREATE TYPE "kitchen_ticket_status" AS ENUM ('PENDING_PAYMENT', 'HELD', 'FIRED', 'PREPARING', 'READY', 'SERVED');

CREATE TYPE "order_item_fulfillment_type" AS ENUM ('DINE_IN', 'TAKEAWAY');

CREATE TYPE "order_item_status" AS ENUM ('ACTIVE', 'VOIDED', 'COMPED', 'REFIRED');

CREATE TYPE "refire_type" AS ENUM ('REFIRE', 'REFILL');

CREATE TYPE "inventory_unit" AS ENUM ('KG', 'GRAMS', 'LITERS', 'ML', 'PIECES', 'PACKETS');

CREATE TYPE "inventory_transaction_type" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'WASTE');

CREATE TYPE "promotion_rule_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BOGO');

CREATE TYPE "promotion_scope" AS ENUM ('ORDER', 'CATEGORY', 'ITEM');

CREATE TYPE "void_comp_action" AS ENUM ('VOID', 'COMP');

CREATE TYPE "payment_method" AS ENUM ('CASH', 'CARD', 'UPI', 'RAZORPAY', 'STRIPE');

CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

CREATE TYPE "customer_request_type" AS ENUM ('CALL_WAITER', 'WATER', 'CUTLERY', 'BILL', 'ASSISTANCE');

CREATE TYPE "customer_request_status" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');

