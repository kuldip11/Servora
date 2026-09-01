import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Page, PageHeader, Spinner } from "@pos/ui";
import { createAvailabilityApi } from "@pos/api-client";
import { apiClient, extractApiError } from "@/shared/lib/api-client";

const availabilityApi = createAvailabilityApi(apiClient);
import { useRealtimeEvent } from "@/shared/lib/realtime";

type AvailabilityRow = {
  entityType: "ITEM" | "VARIANT" | "MODIFIER_OPTION";
  entityId: string;
  menuItemId: string;
  name: string;
  status: string;
  reason: string;
  cause: string;
  branchId: string;
  branchName?: string;
  channel: string;
  fulfillmentType: string;
};

type DashboardResponse = {
  rows: AvailabilityRow[];
};

import {
  AVAILABILITY_CAUSES,
  AVAILABILITY_SELECT_CLASS,
} from "@/features/availability/constants";

export const AvailabilityDashboardPage = () => {
  const [channel, setChannel] = useState("UNSCOPED");
  const [fulfillmentType, setFulfillmentType] = useState("UNSCOPED");
  const [cause, setCause] = useState("");
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await availabilityApi.dashboard<DashboardResponse>({
        channel,
        fulfillmentType,
        ...(cause ? { cause } : {}),
      });
      setRows(response.rows);
    } catch (reason) {
      setError(extractApiError(reason));
    } finally {
      setLoading(false);
    }
  }, [cause, channel, fulfillmentType]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeEvent("menu.availability.updated", () => {
    void load();
  });

  const grouped = useMemo(() => {
    const groups = new Map<string, AvailabilityRow[]>();
    for (const row of rows) {
      const values = groups.get(row.cause) ?? [];
      values.push(row);
      groups.set(row.cause, values);
    }
    return [...groups.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [rows]);

  return (
    <Page>
      <PageHeader
        title="Live availability"
        description="Authoritative unavailable items, variants, and modifiers across branches, channels, and fulfillment types."
        actions={
          <Badge variant={rows.length ? "warning" : "success"}>
            {rows.length} unavailable scopes
          </Badge>
        }
      />

      <Card>
        <div className="grid gap-3 md:grid-cols-4 md:items-end">
          <label className="text-sm font-medium text-text-primary">
            Channel
            <select
              className={`mt-1 w-full ${AVAILABILITY_SELECT_CLASS}`}
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
            >
              <option value="UNSCOPED">All channels</option>
              <option value="STAFF">Staff</option>
              <option value="CUSTOMER_QR">Customer QR</option>
            </select>
          </label>
          <label className="text-sm font-medium text-text-primary">
            Fulfillment
            <select
              className={`mt-1 w-full ${AVAILABILITY_SELECT_CLASS}`}
              value={fulfillmentType}
              onChange={(event) => setFulfillmentType(event.target.value)}
            >
              <option value="UNSCOPED">All fulfillment types</option>
              <option value="DINE_IN">Dine in</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="DELIVERY">Delivery</option>
              <option value="ONLINE">Online</option>
            </select>
          </label>
          <label className="text-sm font-medium text-text-primary">
            Cause
            <select
              className={`mt-1 w-full ${AVAILABILITY_SELECT_CLASS}`}
              value={cause}
              onChange={(event) => setCause(event.target.value)}
            >
              <option value="">All causes</option>
              {AVAILABILITY_CAUSES.map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="secondary"
            onClick={() => void load()}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="border-danger/30 bg-danger-surface">
          <p className="text-sm font-semibold text-danger">
            Availability dashboard unavailable
          </p>
          <p className="mt-1 text-sm text-text-secondary">{error}</p>
        </Card>
      ) : loading && rows.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm font-medium text-success">
            Everything in the selected scope is currently available.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([groupCause, groupRows]) => (
            <Card key={groupCause}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-semibold text-text-primary">
                  {groupCause.replace(/_/g, " ")}
                </h2>
                <Badge variant="warning">{groupRows.length}</Badge>
              </div>
              <div className="divide-y divide-divider">
                {groupRows.map((row) => (
                  <div
                    key={`${row.entityType}:${row.entityId}:${row.branchId}:${row.channel}:${row.fulfillmentType}`}
                    className="grid gap-2 py-3 text-sm md:grid-cols-[2fr_1fr_1fr_2fr]"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {row.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {row.entityType.replace(/_/g, " ")} · {row.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-text-disabled">Branch</span>
                      <p className="text-text-secondary">
                        {row.branchName ?? row.branchId}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-text-disabled">Scope</span>
                      <p className="text-text-secondary">
                        {row.channel} · {row.fulfillmentType}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-text-disabled">Why</span>
                      <p className="text-text-secondary">{row.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
};

export default AvailabilityDashboardPage;
