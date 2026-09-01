import { useQuery } from "@tanstack/react-query";
import { cancellationReasonsService } from "@/features/orders/services/cancellation-reasons.service";

export const cancellationReasonKeys = {
  all: ["cancellation-reasons"] as const,
  active: ["cancellation-reasons", "active"] as const,
};

export const useCancellationReasons = (activeOnly = true, enabled = true) => {
  return useQuery({
    queryKey: activeOnly
      ? cancellationReasonKeys.active
      : cancellationReasonKeys.all,
    enabled,
    queryFn: () =>
      activeOnly
        ? cancellationReasonsService.list(true)
        : cancellationReasonsService.listAll(),
  });
};
