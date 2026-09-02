import { useCallback, useEffect, useState } from "react";
import {
  ChefHat,
  RefreshCw,
  Wifi,
  WifiOff,
  LogOut,
  CheckCircle2,
  Palette,
  Volume2,
} from "lucide-react";
import type { KitchenTicketStatus } from "@pos/types";
import {
  Grid,
  IconButton,
  Spinner,
  EmptyState,
  Popover,
  ThemeSwitcher,
} from "@pos/ui";
import {
  useKitchenStations,
  useKitchenTickets,
} from "@/features/kitchen/hooks/useKitchenTickets";
import { useUpdateTicketStatus } from "@/features/kitchen/hooks/useUpdateTicketStatus";
import { useKitchenRealtime } from "@/features/kitchen/hooks/useKitchenRealtime";
import {
  groupTicketsByStatus,
  isUrgent,
} from "@/features/kitchen/utils/ticket";
import { BOARD_COLUMNS } from "@/features/kitchen/constants";
import { TicketCard } from "@/features/kitchen/components/TicketCard";
import { useKitchenAttention } from "@/features/kitchen/hooks/useKitchenAttention";
import {
  getTerminalStationId,
  getVoidAlertsEnabled,
  setTerminalStationId,
  setVoidAlertsEnabled,
} from "@/features/kitchen/terminal-storage";

interface Props {
  onLogout: () => void;
}

export const KitchenBoard = ({ onLogout }: Props) => {
  const [stationId, setStationId] = useState<string | undefined>(
    () =>
      new URLSearchParams(window.location.search).get("stationId") ??
      getTerminalStationId(),
  );
  const [voidAlerts, setVoidAlerts] = useState(() => getVoidAlertsEnabled());
  const { data: stations } = useKitchenStations();
  const {
    data: tickets,
    isLoading,
    refetch,
    isFetching,
  } = useKitchenTickets(stationId);
  const updateMutation = useUpdateTicketStatus();
  const { connected } = useKitchenRealtime(stationId);
  useKitchenAttention(stationId);

  useEffect(() => {
    setTerminalStationId(stationId);
  }, [stationId]);

  const isTicketUpdating = useCallback(
    (ticketId: string) =>
      updateMutation.isPending && updateMutation.variables?.id === ticketId,
    [updateMutation.isPending, updateMutation.variables],
  );

  const handleUpdateStatus = useCallback(
    (id: string, status: KitchenTicketStatus) =>
      updateMutation.mutate({ id, status }),
    [updateMutation],
  );

  const urgentCount = (tickets ?? []).filter((ticket) =>
    isUrgent(ticket.firedAt),
  ).length;
  const readyCount = (tickets ?? []).filter(
    (ticket) => ticket.status === "READY",
  ).length;
  const queueOverflow = (tickets?.length ?? 0) > 200;

  const columns = BOARD_COLUMNS.map((col) => ({
    ...col,
    tickets: groupTicketsByStatus(tickets, col.status),
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">
              Kitchen Display
            </h1>
            <p className="text-xs text-text-secondary">
              {tickets?.length ?? 0} active tickets
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Station
            <select
              aria-label="KDS station"
              className="rounded-md border border-border bg-surface-secondary px-2 py-1 text-text-primary"
              value={stationId ?? ""}
              onChange={(event) =>
                setStationId(event.target.value || undefined)
              }
            >
              <option value="">All / unassigned</option>
              {(stations ?? []).map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={voidAlerts}
              onChange={(event) => {
                setVoidAlerts(event.target.checked);
                setVoidAlertsEnabled(event.target.checked);
              }}
            />{" "}
            Void alerts
          </label>
          {}
          <IconButton
            icon={RefreshCw}
            aria-label="Refresh tickets"
            onClick={() => refetch()}
            className={isFetching ? "animate-spin" : ""}
          />
          {}
          <Popover
            align="end"
            trigger={<IconButton icon={Palette} aria-label="Change theme" />}
          >
            <div className="w-48">
              <ThemeSwitcher label="Theme" />
            </div>
          </Popover>
          {}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-text-secondary"}`}
          >
            {connected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            {connected ? "Live" : "Polling"}
          </div>
          <IconButton
            icon={LogOut}
            aria-label="Log out"
            onClick={onLogout}
            className="hover:text-danger"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 text-xs">
        <span className="rounded-full bg-info-surface px-2.5 py-1 font-semibold text-info">
          {tickets?.length ?? 0} active
        </span>
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${urgentCount ? "bg-danger-surface text-danger" : "bg-surface-secondary text-text-secondary"}`}
        >
          {urgentCount} urgent
        </span>
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${readyCount ? "bg-success-surface text-success" : "bg-surface-secondary text-text-secondary"}`}
        >
          {readyCount} ready
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-text-secondary">
          <Volume2 className="h-3.5 w-3.5" /> New-ticket alerts enabled
        </span>
      </div>

      {queueOverflow && (
        <div
          role="alert"
          className="border-b border-danger/30 bg-danger-surface px-4 py-2.5 text-sm font-semibold text-danger"
        >
          High kitchen load: {tickets?.length ?? 0} active tickets. No tickets
          are hidden; select a station to reduce the visible workload.
        </div>
      )}

      {}
      <Grid
        columns={{ base: 1, sm: 2, lg: 4 }}
        gap="none"
        className="flex-1 gap-px bg-border overflow-hidden"
      >
        {columns.map((col) => (
          <div
            key={col.title}
            className="bg-background flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className={`font-semibold text-sm ${col.color}`}>
                {col.title}
              </h2>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full bg-surface-secondary ${col.color}`}
              >
                {col.tickets.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : col.tickets.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No tickets" size="sm" />
              ) : (
                col.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    style={{
                      contentVisibility: "auto",
                      containIntrinsicSize: "320px",
                    }}
                  >
                    <TicketCard
                      ticket={ticket}
                      onUpdateStatus={handleUpdateStatus}
                      isUpdating={isTicketUpdating(ticket.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </Grid>
    </div>
  );
};
