import { StatusBadge as SharedStatusBadge, type StatusTone } from "@pos/ui";
import { STATUS_CONFIG } from "@/features/orders/constants";

const STATUS_TONE: Record<string, StatusTone> = {
  OPEN: "info",
  BILL_REQUESTED: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const tone = STATUS_TONE[status];

  if (cfg && tone) {
    return <SharedStatusBadge label={cfg.label} tone={tone} />;
  }

  if (status === "PAID") {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-surface text-primary">
        {cfg?.label ?? "Paid"}
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-secondary text-text-secondary">
      {cfg?.label ?? status}
    </span>
  );
}
