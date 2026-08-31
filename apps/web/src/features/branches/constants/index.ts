import { Bike, Globe, ShoppingBag, UtensilsCrossed } from "lucide-react";

export const BRANCH_CAPABILITY_BADGES = [
  { key: "dineInEnabled" as const, label: "Dine In", icon: UtensilsCrossed },
  { key: "takeawayEnabled" as const, label: "Takeaway", icon: ShoppingBag },
  { key: "deliveryEnabled" as const, label: "Delivery", icon: Bike },
  { key: "onlineEnabled" as const, label: "Online", icon: Globe },
] as const;
