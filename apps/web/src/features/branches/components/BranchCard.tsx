import {
  Building2,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Globe,
  Table2,
  Clock3,
  CircleDollarSign,
} from "lucide-react";
import { Card, IconButton } from "@pos/ui";
import type { Branch } from "@pos/types";

const CAPABILITY_BADGES = [
  { key: "dineInEnabled" as const, label: "Dine In", icon: UtensilsCrossed },
  { key: "takeawayEnabled" as const, label: "Takeaway", icon: ShoppingBag },
  { key: "deliveryEnabled" as const, label: "Delivery", icon: Bike },
  { key: "onlineEnabled" as const, label: "Online", icon: Globe },
];

export function BranchCard({
  branch,
  onEdit,
  onDeactivate,
}: {
  branch: Branch;
  onEdit: (branch: Branch) => void;
  onDeactivate: (branch: Branch) => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-surface flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">{branch.name}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-disabled">{branch.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton
            icon={Edit2}
            size="sm"
            aria-label="Edit branch"
            title="Edit branch"
            onClick={() => onEdit(branch)}
          />
          <IconButton
            icon={Trash2}
            size="sm"
            aria-label="Deactivate branch"
            title="Deactivate branch"
            onClick={() => onDeactivate(branch)}
          />
        </div>
      </div>
      {branch.address && (
        <p className="text-xs text-text-secondary flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{" "}
          {branch.address}
        </p>
      )}
      {branch.phone && (
        <p className="text-xs text-text-secondary flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {branch.phone}
        </p>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{branch.timezone}</span>
        <span className="flex items-center gap-1.5"><CircleDollarSign className="h-3.5 w-3.5" />{branch.currency}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-divider">
        {CAPABILITY_BADGES.map(({ key, label, icon: Icon }) => (
          <span
            key={key}
            title={branch[key] ? label : `${label} disabled`}
            className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${branch[key] ? "bg-primary-surface text-primary" : "bg-surface-secondary text-text-disabled line-through"}`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </span>
        ))}
        <span
          title={branch.tablesEnabled ? "Tables" : "Tables disabled"}
          className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${branch.tablesEnabled ? "bg-primary-surface text-primary" : "bg-surface-secondary text-text-disabled line-through"}`}
        >
          <Table2 className="w-3 h-3" />
          Tables
        </span>
      </div>
    </Card>
  );
}
