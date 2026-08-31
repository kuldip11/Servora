import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input } from "@pos/ui";
import { ShieldCheck } from "lucide-react";
import { createApprovalsApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const approvalsApi = createApprovalsApi(apiClient);
import { notifyError, notifySuccess } from "../../../shared/lib/notify";

type ApprovalAction = "VOID" | "COMP";
type ThresholdRow = {
  id: string;
  actionType: ApprovalAction;
  thresholdAmount: string | number;
  requiresRole: string;
};

type ThresholdDraft = { thresholdAmount: string; requiresRole: string };

const DEFAULTS: Record<ApprovalAction, ThresholdDraft> = {
  VOID: { thresholdAmount: "500", requiresRole: "Manager" },
  COMP: { thresholdAmount: "500", requiresRole: "Manager" },
};

export function ApprovalThresholdSettingsCard() {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["approval-thresholds"] as const, []);
  const [drafts, setDrafts] = useState<Record<ApprovalAction, ThresholdDraft>>(DEFAULTS);
  // Tracks which rows the person has started editing so a late-arriving
  // fetch (or a post-save refetch) never clobbers an in-progress edit.
  const touchedRef = useRef<Record<ApprovalAction, boolean>>({ VOID: false, COMP: false });

  const { data: thresholds } = useQuery<ThresholdRow[]>({
    queryKey,
    queryFn: () => approvalsApi.listThresholds<ThresholdRow>(),
  });

  useEffect(() => {
    if (!thresholds) return;

    setDrafts((current) => {
      const next = { ...current };
      for (const row of thresholds) {
        if (touchedRef.current[row.actionType]) continue;
        next[row.actionType] = {
          thresholdAmount: String(row.thresholdAmount),
          requiresRole: row.requiresRole || "Manager",
        };
      }
      return next;
    });
  }, [thresholds]);

  const save = useMutation({
    mutationFn: async ({ actionType, draft }: { actionType: ApprovalAction; draft: ThresholdDraft }) => {
      const thresholdAmount = Number(draft.thresholdAmount);
      if (!Number.isFinite(thresholdAmount) || thresholdAmount < 0) throw new Error("Threshold must be zero or greater");
      if (!draft.requiresRole.trim()) throw new Error("Approval role is required");
      return approvalsApi.setThreshold<ThresholdRow>(actionType, {
        thresholdAmount,
        requiresRole: draft.requiresRole.trim(),
      });
    },
    onSuccess: (_response, variables) => {
      touchedRef.current[variables.actionType] = false;
      void queryClient.invalidateQueries({ queryKey });
      notifySuccess(`${variables.actionType === "VOID" ? "Void" : "Comp"} approval threshold updated`);
    },
    onError: (error) => notifyError(error, "Failed to update manager approval threshold"),
  });

  function update(actionType: ApprovalAction, patch: Partial<ThresholdDraft>) {
    touchedRef.current[actionType] = true;
    setDrafts((current) => ({ ...current, [actionType]: { ...current[actionType], ...patch } }));
  }

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50"><ShieldCheck className="h-5 w-5 text-amber-700" /></div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Void & comp approvals</h2>
          <p className="text-xs text-text-secondary">Require step-up manager approval only when the full affected value exceeds a configured threshold.</p>
        </div>
      </div>
      <div className="space-y-5">
        {(["VOID", "COMP"] as const).map((actionType) => {
          const draft = drafts[actionType];
          return (
            <div key={actionType} className="rounded-lg border border-border p-3">
              <h3 className="text-sm font-semibold text-text-primary">{actionType === "VOID" ? "Void" : "Comp"}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Input label="Approval threshold" type="number" min="0" step="0.01" value={draft.thresholdAmount} onChange={(event) => update(actionType, { thresholdAmount: event.target.value })} />
                <Input label="Required role" value={draft.requiresRole} onChange={(event) => update(actionType, { requiresRole: event.target.value })} placeholder="Manager" />
                <Button loading={save.isPending && save.variables?.actionType === actionType} disabled={!draft.requiresRole.trim() || Number(draft.thresholdAmount) < 0} onClick={() => save.mutate({ actionType, draft })}>Save</Button>
              </div>
              <p className="mt-2 text-xs text-text-secondary">At or below the threshold, the normal void/comp permission is sufficient. Above it, the POS/waiter action asks for an authorized {draft.requiresRole || "manager"} credential.</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
