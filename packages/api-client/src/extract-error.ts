import axios from "axios";

export const extractApiError = (error: unknown): string => {
  if (axios.isAxiosError(error))
    return error.response?.data?.message ?? error.message ?? "Request failed";
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
};
