import {
  KDS_STATION_STORAGE_KEY,
  KDS_VOID_ALERT_STORAGE_KEY,
} from "./constants";

export const getTerminalStationId = (): string | undefined => {
  return localStorage.getItem(KDS_STATION_STORAGE_KEY) || undefined;
};
export const setTerminalStationId = (value?: string) => {
  if (value) localStorage.setItem(KDS_STATION_STORAGE_KEY, value);
  else localStorage.removeItem(KDS_STATION_STORAGE_KEY);
};
export const getVoidAlertsEnabled = (): boolean => {
  return localStorage.getItem(KDS_VOID_ALERT_STORAGE_KEY) !== "false";
};
export const setVoidAlertsEnabled = (value: boolean) => {
  localStorage.setItem(KDS_VOID_ALERT_STORAGE_KEY, String(value));
};
