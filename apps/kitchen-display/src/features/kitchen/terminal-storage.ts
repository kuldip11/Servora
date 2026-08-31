const STATION_KEY = "servora.kds.station-id";
const VOID_ALERT_KEY = "servora.kds.void-alerts";

export function getTerminalStationId(): string | undefined {
  return localStorage.getItem(STATION_KEY) || undefined;
}
export function setTerminalStationId(value?: string) {
  if (value) localStorage.setItem(STATION_KEY, value); else localStorage.removeItem(STATION_KEY);
}
export function getVoidAlertsEnabled(): boolean { return localStorage.getItem(VOID_ALERT_KEY) !== "false"; }
export function setVoidAlertsEnabled(value: boolean) { localStorage.setItem(VOID_ALERT_KEY, String(value)); }
