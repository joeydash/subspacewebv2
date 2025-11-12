import { apiClient } from "@/config/axios-client"; 

interface PublicGroup {
  whatsub_plans: any;
  group_limit: number;
  hide_limit: number;
  share_limit: number;
  number_of_users: number;
  name: string;
  room_dp: string;
  blurhash: string;
  count: number;
  auth_fullname2: string;
}

export const fetchPublicGroups = async (authToken?: string): Promise<PublicGroup[]> => {
  const query = `
    query getPublicGroupsShort {
      w_getPublicGroupsShort {
        whatsub_plans
        group_limit
        hide_limit
        share_limit
        number_of_users
        name
        room_dp
        blurhash
        count
        auth_fullname2
      }
    }
  `;

  const response = await apiClient.post(
    "",
    { query },
    {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    }
  );

  return response.data?.data?.w_getPublicGroupsShort || [];
};


export const fetchGroups = async ({
  planId,
  authToken,
}: {
  planId: string;
  authToken?: string;
}) => {
  if (!planId) return [];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const { data } = await apiClient.post(
    '', // baseURL is already set in Axios instance
    {
      query: `
        query Query($plan_id: uuid) {
          __typename
          whatsub_distinct_user_subscription_mv(
            where: { plan_id: { _eq: $plan_id } }
            distinct_on: user_id
            order_by: { user_id: asc, room_created_at: asc }
          ) {
            __typename
            share_limit
            number_of_users
            room_id
            room_created_at
            room_dp
            blurhash
            user_id
            fullname
            dp
            last_active
            user_blurhash
            average_rating
            number_of_ratings
            group_limit
            hide_limit
            price
            expiring_at
            premium
          }
        }
      `,
      variables: { plan_id: planId },
    },
    { headers }
  );

  if (data.errors) throw new Error('Failed to fetch groups');

  console.log('data ', data);

  const groups = data.data?.whatsub_distinct_user_subscription_mv || [];
  return groups.filter((group) => group.number_of_users < group.group_limit);
};
