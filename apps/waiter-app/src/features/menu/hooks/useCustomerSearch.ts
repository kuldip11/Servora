import { useQuery } from "@tanstack/react-query";
import { searchCustomers } from "@/features/menu/api/customers";

export const useCustomerSearch = (query: string) => {
  return useQuery({
    queryKey: ["customer-search", query],
    queryFn: () => searchCustomers(query),
    enabled: query.length >= 2,
  });
};
