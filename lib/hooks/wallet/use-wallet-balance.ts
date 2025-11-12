import { useQuery } from "@tanstack/react-query";
import { fetchWalletBalance } from "../../api/wallet";

interface UseWalletBalanceParams {
  userId: string;
  authToken: string;
}

export const WALLET_BALANCE_BASE_KEY = "wallet_balance";


export const useWalletBalance = ({ userId, authToken }: UseWalletBalanceParams) => {
  return useQuery({
    queryKey: [WALLET_BALANCE_BASE_KEY, userId],
    queryFn: () => fetchWalletBalance({ userId, authToken }),
    enabled: !!userId && !!authToken, // only fetch if user exists
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
