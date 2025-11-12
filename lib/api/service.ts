import { apiClient } from "@/config/axios-client";

interface FetchServiceDetailsParams {
  serviceId: string;
  user?: { id: string; auth_token?: string };
}

export const fetchServiceDetails = async ({
  serviceId,
  user,
}: FetchServiceDetailsParams) => {
  const isLoggedIn = !!user?.id;

  const query = isLoggedIn
    ? `
      query getServiceDetails($service_id: uuid!, $user_id: uuid!) {
        whatsub_services(where: {id: {_eq: $service_id}}) {
          image_url
          blurhash
          backdrop_url
          backdrop_blurhash
          about
          url
          service_name
          playstore_rating
          package_name
          playstore_number_of_ratings
          flexipay
          flexipay_discount
          flexipay_min
          flexipay_max
          flexipay_vendor
          show_powered_by
          flexipay_vendor_image
          flexipay_vendor_conditions
          flexipay_vendor_instructions
          whatsub_class { name }
          whatsub_plans(
            where: {whatsub_coupon_availability: {count: {_gt: "0"}}}
            order_by: {discounted_price: asc}
          ) {
            id
            plan_name
            display_data
            price
            plan_details
            discounted_price
            duration
            duration_type
            status
            is_plan
            whatsub_order_items(
              where: {
                whatsub_order: {
                  status: {_eq: "cart"},
                  user_id: {_eq: $user_id}
                }
              }
            ) {
              id
              quantity
            }
          }
        }
        whatsub_orders(
          where: {status: {_eq: "cart"}, user_id: {_eq: $user_id}}
        ) {
          status
          whatsub_order_items_aggregate {
            aggregate {
              sum { quantity }
            }
          }
        }
      }
    `
    : `
      query getServiceDetails($service_id: uuid!) {
        whatsub_services(where: {id: {_eq: $service_id}}) {
          image_url
          blurhash
          backdrop_url
          backdrop_blurhash
          about
          url
          service_name
          playstore_rating
          package_name
          playstore_number_of_ratings
          flexipay
          flexipay_discount
          flexipay_min
          flexipay_max
          flexipay_vendor
          show_powered_by
          flexipay_vendor_image
          flexipay_vendor_conditions
          flexipay_vendor_instructions
          whatsub_class { name }
          whatsub_plans(
            where: {whatsub_coupon_availability: {count: {_gt: "0"}}}
            order_by: {discounted_price: asc}
          ) {
            id
            plan_name
            display_data
            price
            plan_details
            discounted_price
            duration
            duration_type
            status
            is_plan
          }
        }
      }
    `;

  const variables = isLoggedIn
    ? { service_id: serviceId, user_id: user?.id }
    : { service_id: serviceId };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (user?.auth_token) headers["Authorization"] = `Bearer ${user.auth_token}`;

  const { data } = await apiClient.post("", { query, variables }, { headers });

  if (data.errors) {
    throw new Error(data.errors.map((e: any) => e.message).join(", "));
  }

  return {
    service: data.data.whatsub_services?.[0],
    orders: data.data.whatsub_orders || [],
  };
};
