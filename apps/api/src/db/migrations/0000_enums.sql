-- Clean baseline: PostgreSQL enums used by the application schema.
CREATE TYPE "role_scope" AS ENUM ('GLOBAL', 'TENANT', 'BRANCH');
CREATE TYPE "membership_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "table_status" AS ENUM ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'RESERVED');
CREATE TYPE "food_type" AS ENUM ('VEG', 'NON_VEG', 'EGG');
CREATE TYPE "spice_level" AS ENUM ('NONE', 'MILD', 'MEDIUM', 'HOT');
CREATE TYPE "modifier_selection_type" AS ENUM ('SINGLE', 'MULTIPLE');
CREATE TYPE "menu_item_status" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'HIDDEN', 'SEASONAL', 'DISCONTINUED');
CREATE TYPE "menu_item_schedule_type" AS ENUM ('DAILY', 'WEEKLY', 'SPECIFIC_DATE', 'HOLIDAY');
CREATE TYPE "inventory_unit" AS ENUM ('KG', 'GRAMS', 'LITERS', 'ML', 'PIECES', 'PACKETS');
CREATE TYPE "inventory_transaction_type" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'WASTE');
CREATE TYPE "order_status" AS ENUM ('OPEN', 'BILL_REQUESTED', 'PAID', 'CLOSED', 'CANCELLED');
CREATE TYPE "order_type" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE');
CREATE TYPE "kitchen_ticket_status" AS ENUM ('FIRED', 'PREPARING', 'READY', 'SERVED');
CREATE TYPE "payment_method" AS ENUM ('CASH', 'CARD', 'UPI', 'RAZORPAY', 'STRIPE');
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
