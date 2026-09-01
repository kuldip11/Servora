import { useState } from "react";
import type { CancellationReason } from "@pos/types";
import { Button, Input, Modal } from "@pos/ui";

export const ReasonDialog = ({
  open,
  title,
  reasons,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  reasons: CancellationReason[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (reason: {
    cancellationReasonId?: string;
    reason?: string;
  }) => void;
}) => {
  const [reasonId, setReasonId] = useState("");
  const [other, setOther] = useState("");
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <label className="block text-sm font-medium">
          Reason
          <select
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            value={reasonId}
            onChange={(event) => setReasonId(event.target.value)}
          >
            <option value="">Other</option>
            {reasons.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        {!reasonId && (
          <Input
            label="Other reason"
            value={other}
            onChange={(event) => setOther(event.target.value)}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!reasonId && !other.trim()}
            loading={Boolean(loading)}
            onClick={() =>
              onSubmit({
                ...(reasonId ? { cancellationReasonId: reasonId } : {}),
                ...(other.trim() ? { reason: other.trim() } : {}),
              })
            }
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
