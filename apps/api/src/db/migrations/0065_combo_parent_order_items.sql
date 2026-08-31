-- C9/D2 correction: a combo purchase is represented by one parent order_item
-- plus normal component child order_items. The parent has combo_id/group_id but
-- no menu item of its own, so menu_item_id must be nullable.
ALTER TABLE "order_items" ALTER COLUMN "menu_item_id" DROP NOT NULL;
