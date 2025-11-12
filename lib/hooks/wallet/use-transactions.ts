import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchTransactions } from "../../api/wallet";

interface UseTransactionsParams {
	userId: string;
	authToken: string;
}

export const TRANSACTIONS_BASE_KEY = "transactions";


export const useTransactions = ({ userId, authToken }: UseTransactionsParams) => {
	return useInfiniteQuery({
		queryKey: [TRANSACTIONS_BASE_KEY, userId],
		queryFn: ({ pageParam }) => fetchTransactions({ userId, authToken, pageParam }),
		enabled: !!userId && !!authToken,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			if (!lastPage.hasMore) {
				return undefined
			}
			return lastPageParam + 1
		},
	})
};
