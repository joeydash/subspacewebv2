import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { addItemToCart } from "../../api/cart";
import {CART_BASE_KEY} from "./use-cart";

interface UseAddToCartMutationParams {
  user_id: string;
  auth_token: string;
}


export const useAddToCartMutation = ({ user_id, auth_token }: UseAddToCartMutationParams) => {

  return useMutation({
    mutationFn: (item) =>
      addItemToCart({ plan_id: item.id, user_id, auth_token }),

    onMutate: (newItem, context) => {
      const cartData = context.client.getQueryData([CART_BASE_KEY, user_id]);
      const cartItems = cartData.items;

      const prevItemQuantityMap = cartData.itemQuantityMap
        ?
          new Map(cartData.itemQuantityMap)
        : undefined;

      let hasItem = false;

      const newItems = cartItems.map((item) => {
        if (item.id === newItem.id) {
          hasItem = true;
          return {
            ...item,
            quantity: item.quantity + 1,
          };
        }
        return item;
      });

      if (!hasItem) {
        newItems.push({
          ...newItem,
          quantity: 1,
        });
      }

      const itemQuantityMap = new Map(cartData.itemQuantityMap ?? []);
      const key = newItem.id;
      const currentQty = itemQuantityMap.get(key) ?? 0;
      itemQuantityMap.set(key, currentQty + 1);

      cartData.itemQuantityMap = itemQuantityMap;

      cartData.items = newItems;
      context.client.setQueryData([CART_BASE_KEY, user_id], cartData);

      return { cartItems, prevItemQuantityMap };
    },

    onError: (err, variables, onMutateResult, context) => {
      toast.error(err.message || "Failed to add item to cart");

      const previousData = context.client.getQueryData([CART_BASE_KEY, user_id]);
      previousData.items = onMutateResult.cartItems;

      if (onMutateResult?.prevItemQuantityMap instanceof Map) {
        previousData.itemQuantityMap = onMutateResult.prevItemQuantityMap;
      }

      context.client.setQueryData([CART_BASE_KEY, user_id], previousData);
    },

    onSettled: (newItem, error, variables, onMutateResult, context) => {
       if (!error || !onMutateResult.hasItem) {
        context.client.invalidateQueries([CART_BASE_KEY]);
       }
    },
  });
};
