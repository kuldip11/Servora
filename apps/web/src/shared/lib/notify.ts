import { toast } from "@pos/ui";
import { getErrorMessage } from "./errors";

export const notifyError = (error: unknown, fallback?: string): void => {
  toast({ title: getErrorMessage(error, fallback), tone: "danger" });
};

export const notifySuccess = (message: string): void => {
  toast({ title: message, tone: "success" });
};
