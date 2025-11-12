import { apiClient } from "@/config/axios-client"; 

export const fetchCartData = async (userId: string, authToken: string) => {
  const response = await apiClient.post(
    "",
    {
      query: `
        query MyQuery($user_id: uuid = "") {
          __typename
          whatsubGetCart(request: { user_id: $user_id }) {
            __typename
            id
            items
            message
          }
        }
      `,
      variables: { user_id: userId },
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  const data = response.data;

  if (data.errors) {
    throw new Error(data.errors?.[0]?.message || "Failed to fetch cart");
  }


  const cart = data.data?.whatsubGetCart; 
  const itemQuantityMap = new Map<string, number>();

  if (Array.isArray(cart?.items)) {
    for (const item of cart.items) {
        itemQuantityMap.set(item.plan_id, item.quantity ?? 1);
    }
  }

  return {
    ...cart,
    itemQuantityMap
  };
};


export const addItemToCart = async ({
  plan_id,
  user_id,
  auth_token,
}: {
  plan_id: string;
  user_id: string;
  auth_token: string;
}) => {
  const response = await apiClient.post(
    "",
    {
      query: `
        mutation AddItemToCartMutation($plan_id: uuid = "", $user_id: uuid = "") {
          whatsubAddItemToCart(request: { user_id: $user_id, plan_id: $plan_id }) {
            affected_rows
          }
        }
      `,
      variables: { plan_id, user_id },
    },
    {
      headers: { Authorization: `Bearer ${auth_token}` },
    }
  );

  const data = response.data;

  if (data?.errors?.length) {
    throw new Error(data.errors[0].message);
  }

  return data.data?.whatsubAddItemToCart;
};

export const removeItemFromCart = async ({
  item_id,
  user_id,
  auth_token,
}: {
  item_id: string;
  user_id: string;
  auth_token: string;
}) => {
  const response = await apiClient.post(
    "",
    {
      query: `
        mutation RemoveItemFromCartMutation($item_id: uuid = "", $user_id: uuid = "") {
          whatsubRemoveFromCart(request: { id: $item_id, user_id: $user_id }) {
            affected_rows
          }
        }
      `,
      variables: { item_id, user_id },
    },
    {
      headers: { Authorization: `Bearer ${auth_token}` },
    }
  );

  const data = response.data;

  if (data?.errors?.length) {
    throw new Error(data.errors[0].message);
  }

  return data.data?.whatsubRemoveFromCart;
};
