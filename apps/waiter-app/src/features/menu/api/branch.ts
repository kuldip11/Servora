import { apiClient } from "../../../shared/lib/api-client";

// Waiters are locked to their own branch, so this always resolves to
// exactly that one branch — used to filter the order-type toggle and
// hide the table picker for branches that don't take dine-in.
// This endpoint returns the branch detail shape used by menu/order flows.
export async function fetchMyBranch(): Promise<any> {
  const res = await apiClient.get("/branches");
  return res.data.data[0];
}
