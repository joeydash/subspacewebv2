import { useQuery } from "@tanstack/react-query";
import {fetchCartData} from '../../api/cart';

export const CART_BASE_KEY = "cart";

export const useCart = (user?: { id: string; auth_token: string }) => {
  return useQuery({
    queryKey: [CART_BASE_KEY, user?.id],
    queryFn: () => fetchCartData(user?.id, user?.auth_token),
    enabled: !!user?.id && !!user?.auth_token,
  });
};
