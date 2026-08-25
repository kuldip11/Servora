import { useQuery } from "@tanstack/react-query";
import { searchCustomers } from "../api/customers";

export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: ["customer-search", query],
    queryFn: () => searchCustomers(query),
    enabled: query.length >= 2,
  });
}
