// hooks/useAddresses.ts
import { useQuery } from "@tanstack/react-query";
import { fetchAddresses } from "@/lib/api/address";

interface UseAddressesParams {
  userId: string;
  authToken: string;
}


export const ADDRESSES_BASE_KEY = "addresses";

export const useAddresses = ({ userId, authToken }: UseAddressesParams) => {
  return useQuery({
    queryKey: [ADDRESSES_BASE_KEY, userId],
    queryFn: () => fetchAddresses(authToken),
    enabled: !!authToken, // only fetch if token exists
  });
};
