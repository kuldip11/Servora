import { toast } from "@pos/ui";
import { getErrorMessage } from "./errors";

export function notifyError(error: unknown, fallback?: string): void {
  toast({ title: getErrorMessage(error, fallback), tone: "danger" });
}

export function notifySuccess(message: string): void {
  toast({ title: message, tone: "success" });
}
