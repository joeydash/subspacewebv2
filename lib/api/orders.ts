import { apiClient } from "@/config/axios-client";

export interface Order {
  id: string;
  coupon: string;
  expiring_at: string;
  updated_at: string;
  allocated_at: string;
  avail_conditions: string;
  action_name: string;
  action: string;
  pin: string;
  amount: number;
  whatsub_plan?: {
    plan_name: string;
    whatsub_service: {
      service_name: string;
    };
  };
  whatsub_service?: {
    service_name: string;
    flexipay_unit: string;
  };
}

interface FetchOrdersParams {
  userId: string;
  authToken: string;
  limit?: number;
  offset?: number;
}

export const fetchOrders = async ({
  userId,
  authToken,
  limit = 10,
  offset = 0,
}: FetchOrdersParams): Promise<Order[]> => {
  const query = `
    query getCoupons($user_id: uuid, $limit: Int, $offset: Int) {
      __typename
      whatsub_coupon_allocation(
        where: { user_id: { _eq: $user_id } }
        order_by: { updated_at: desc_nulls_first }
        limit: $limit
        offset: $offset
      ) {
        __typename
        id
        coupon
        expiring_at
        updated_at
        allocated_at
        avail_conditions
        action_name
        action
        whatsub_plan {
          __typename
          plan_name
          whatsub_service {
            __typename
            service_name
          }
        }
        pin
        amount
        whatsub_service {
          __typename
          service_name
          flexipay_unit
        }
      }
    }
  `;

  const { data } = await apiClient.post(
    "",
    {
      query,
      variables: {
        limit,
        offset,
        user_id: userId,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (data.errors) {
    throw new Error(data.errors.map((e: { message: string }) => e.message).join(", "));
  }

  return data.data?.whatsub_coupon_allocation || [];
};
