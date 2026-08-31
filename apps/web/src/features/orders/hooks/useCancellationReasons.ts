import { useQuery } from "@tanstack/react-query";
import { cancellationReasonsService } from "../services/cancellation-reasons.service";

export const cancellationReasonKeys = {
  all: ["cancellation-reasons"] as const,
  active: ["cancellation-reasons", "active"] as const,
};

export function useCancellationReasons(activeOnly = true) {
  return useQuery({
    queryKey: activeOnly ? cancellationReasonKeys.active : cancellationReasonKeys.all,
    queryFn: () => activeOnly
      ? cancellationReasonsService.list(true)
      : cancellationReasonsService.listAll(),
  });
}
