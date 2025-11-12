import { apiClient } from "@/config/axios-client";

interface WalletBalanceResponse {
  total_amount: number;
  locked_amount: number;
  unlocked_amount: number;
}

interface FetchWalletBalanceParams {
  userId: string;
  authToken: string;
}

export const fetchWalletBalance = async ({ userId, authToken }: FetchWalletBalanceParams): Promise<WalletBalanceResponse> => {
  const query = `
    query getTransaction($user_id: uuid!) {
      whatsub_user_wallet(where: {user_id: {_eq: $user_id}}) {
        total_amount
      }
      whatsub_user_wallet_locked_unlocked_internal_mv(where: {user_id: {_eq: $user_id}}) {
        locked_amount
        unlocked_amount
      }
      whatsub_bank_account_details(where: {user_id: {_eq: $user_id}}) {
        account_name
        bank_account_number
        ifsc
        upi_id
        payout_type
      }
    }
  `;

  const variables = { user_id: userId };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const { data } = await apiClient.post("", { query, variables }, { headers });

  if (data.errors) {
    throw new Error(data.errors.map((e: any) => e.message).join(", "));
  }

  const total = data.data.whatsub_user_wallet[0]?.total_amount || 0;
  const { locked_amount = 0, unlocked_amount = 0 } =
    data.data.whatsub_user_wallet_locked_unlocked_internal_mv[0] || {};

  return { total_amount: total, locked_amount, unlocked_amount };
};


interface FetchTransactionsParams {
  userId: string;
  authToken: string;
  pageParam: number;
}

const TRANSACTIONS_PER_PAGE = 10;

export const fetchTransactions = async ({
  userId,
  authToken,
  pageParam,
}: {
  userId: string;
  authToken: string;
  pageParam?: number;
}) => {
  if (!userId || !authToken) return { transactions: [], hasMore: false };

  try {
    const { data } = await apiClient.post(
      "",
      {
        query: `
          query getTransaction($user_id: uuid!, $limit: Int!, $offset: Int!) {
            whatsub_wallet(
              where: { user_id: { _eq: $user_id } }
              order_by: { created_at: desc }
              limit: $limit
              offset: $offset
            ) {
              id
              amount
              purpose
              created_at
            }
          }
        `,
        variables: {
          user_id: userId,
          limit: TRANSACTIONS_PER_PAGE,
          offset: pageParam * TRANSACTIONS_PER_PAGE,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const transactions = data.data?.whatsub_wallet ?? [];
    const hasMore = transactions.length === TRANSACTIONS_PER_PAGE;    

    return {transactions, hasMore};
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return { transactions: [], hasMore: false };
  }
};
