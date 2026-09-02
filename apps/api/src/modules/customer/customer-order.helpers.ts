export const resolveCustomerRoundFulfillment = (
  sessionMode: "DINE_IN" | "TAKEAWAY",
  requested?: "DINE_IN" | "TAKEAWAY",
) => (sessionMode === "TAKEAWAY" ? "TAKEAWAY" : (requested ?? "DINE_IN"));
