import {
  BarChart3,
  ChefHat,
  QrCode,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { appUrls } from "@/lib/app-urls";

export interface ServoraAppLink {
  key: "web" | "kitchen" | "waiter" | "customer";
  name: string;
  shortName: string;
  description: string;
  href: string;
  detailHref: string;
  icon: LucideIcon;
}

export const servoraApps: ServoraAppLink[] = [
  {
    key: "web",
    name: "Management & POS",
    shortName: "Web App",
    description:
      "Manage branches, orders, payments, inventory, staff and analytics.",
    href: appUrls.web,
    detailHref: "/apps/management",
    icon: BarChart3,
  },
  {
    key: "kitchen",
    name: "Kitchen Display",
    shortName: "Kitchen",
    description:
      "Run the live kitchen queue and move tickets through preparation.",
    href: appUrls.kitchen,
    detailHref: "/apps/kitchen",
    icon: ChefHat,
  },
  {
    key: "waiter",
    name: "Waiter App",
    shortName: "Waiter",
    description: "Take orders, follow table activity and react to ready items.",
    href: appUrls.waiter,
    detailHref: "/apps/waiter",
    icon: UtensilsCrossed,
  },
  {
    key: "customer",
    name: "Customer Ordering",
    shortName: "Customer",
    description:
      "Let guests browse the menu, customize items and place QR orders.",
    href: appUrls.customer,
    detailHref: "/apps/customer",
    icon: QrCode,
  },
];
