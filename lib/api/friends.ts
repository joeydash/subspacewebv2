import { apiClient } from "@/config/axios-client";

export interface Friend {
  dp: string;
  fullname: string;
  id: string;
  phone: string;
  whatsub_users_subscriptions: Array<{
    service_name: string;
    service_image_url: string;
    plan: string;
    status: string;
  }>;
}

interface FetchFriendsParams {
  userId: string;
  authToken: string;
}

export const fetchFriends = async ({ userId, authToken }: FetchFriendsParams): Promise<Friend[]> => {
  const query = `
    query getContacts($user_id: uuid!) {
      __typename
      w_getContacts(request: {user_id: $user_id}) {
        __typename
        dp
        fullname
        id
        phone
        whatsub_users_subscriptions
      }
    }
  `;

  const { data } = await apiClient.post(
    "",
    {
      query,
      variables: {
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

  return data.data?.w_getContacts || [];
};
