import { useQuery } from "@tanstack/react-query";
import { fetchBankDetails } from "../../api/payment";

export const BANK_DETAILS_BASE_KEY = "bank_details";

export const useBankDetails = (userId?: string, authToken?: string) => {
  return useQuery({
    queryKey: [BANK_DETAILS_BASE_KEY, userId],
    queryFn: () => fetchBankDetails({ userId: userId!, authToken: authToken! }),
    enabled: !!userId && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
