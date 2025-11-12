import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { removeItemFromCart } from "../../api/cart";
import {CART_BASE_KEY} from './use-cart';

interface UseAddToCartMutationParams {
  user_id: string;
  auth_token: string;
}


export const useRemoveFromCartMutation = ({ user_id, auth_token }: UseAddToCartMutationParams) => {
  return useMutation({
    mutationFn: (item) =>
      removeItemFromCart({ item_id: item.id, user_id, auth_token }),

    onMutate: (removedItem, context) => {
      const cartData = context.client.getQueryData([CART_BASE_KEY, user_id]);
      const cartItems = cartData.items;

      const prevItemQuantityMap = cartData.itemQuantityMap
        ? new Map(cartData.itemQuantityMap)
        : undefined;

      const newItems = cartItems.filter((item) => item.id !== removedItem.id);
      cartData.items = newItems;

      const itemQuantityMap = new Map(cartData.itemQuantityMap ?? []);
      const key = removedItem.plan_id;
      const currentQty = itemQuantityMap.get(key);

      if (currentQty !== undefined) {
        if (currentQty > 1) {
          itemQuantityMap.set(key, currentQty - 1);
        } else {
          itemQuantityMap.delete(key);
        }
      }

      cartData.itemQuantityMap = itemQuantityMap;
      context.client.setQueryData([CART_BASE_KEY, user_id], cartData);

      return { cartItems, prevItemQuantityMap };
    },

    onError: (error, removedItem, onMutateResult, context) => {
      toast.error("Failed to remove item from cart");

      const cartData = context.client.getQueryData([CART_BASE_KEY, user_id]);
      cartData.items = onMutateResult.cartItems;

      if (onMutateResult?.prevItemQuantityMap instanceof Map) {
        cartData.itemQuantityMap = onMutateResult.prevItemQuantityMap;
      }

      context.client.setQueryData([CART_BASE_KEY, user_id], cartData);
    },
  });
};
