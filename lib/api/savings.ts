import { apiClient } from "@/config/axios-client";

export interface UserData {
  dp: string;
  blurhash: string;
  fullname: string;
  whatsub_referral: {
    refer_link: string;
  }[];
}

export interface SavingsData {
  buy_debit: number;
  group_join_credit: number;
  group_join_debit: number;
  paid_via_subspace: number;
  savings: number;
}

export interface TopSaver {
  savings: number;
  auth_fullname: {
    fullname: string;
    dp: string;
  };
}

export interface FriendSaving {
  savings: number;
  auth_fullname: {
    fullname: string;
    dp: string;
  };
}

export interface AllSavingsData {
  userData: UserData | null;
  savingsData: SavingsData | null;
  topSavers: TopSaver[];
  friends: FriendSaving[];
}

interface FetchAllSavingsParams {
  userId: string;
  authToken: string;
}

export const fetchAllSavings = async ({
  userId,
  authToken,
}: FetchAllSavingsParams): Promise<AllSavingsData> => {
  const query = `
    query savings($user_id: uuid!) {
      __typename
    
      auth(where: { id: { _eq: $user_id } }) {
        __typename
        dp
        blurhash
        fullname
        whatsub_referral {
          __typename
          refer_link
        }
      }
    
      savings: whatsub_savings_total(where: { user_id: { _eq: $user_id } }) {
        __typename
        buy_debit
        group_join_credit
        group_join_debit
        paid_via_subspace
        savings
      }
    
      whatsub_savings_total(order_by: { savings: desc_nulls_last }, limit: 5) {
        __typename
        savings
        auth_fullname {
          __typename
          fullname
          dp
        }
      }
    
      w_getFriendsSavings(request: { user_id: $user_id }) {
        __typename
        savings
        auth_fullname
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

  return {
    userData: data.data?.auth?.[0] || null,
    savingsData: data.data?.savings?.[0] || null,
    topSavers: data.data?.whatsub_savings_total || [],
    friends: data.data?.w_getFriendsSavings || [],
  };
};
