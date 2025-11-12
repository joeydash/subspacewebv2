import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "../../api/orders";

interface UseOrdersParams {
  userId: string;
  authToken: string;
  limit?: number;
  offset?: number;
}

export const useOrders = ({ userId, authToken, limit = 10, offset = 0 }: UseOrdersParams) => {
  return useQuery({
    queryKey: ["orders", userId, limit, offset],
    queryFn: () => fetchOrders({ userId, authToken, limit, offset }),
    enabled: !!userId && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
