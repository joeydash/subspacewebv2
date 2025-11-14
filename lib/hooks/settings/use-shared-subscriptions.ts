import { useQuery } from '@tanstack/react-query';
import { fetchSharedSubscriptions, SharedSubscription } from '@/lib/api/settings';

export const SHARED_SUBSCRIPTIONS_BASE_KEY = 'shared_subscriptions';


interface UseSharedSubscriptionsParams {
	authToken: string | undefined;
	userId: string | undefined;
}

export const useSharedSubscriptions = ({ authToken, userId }: UseSharedSubscriptionsParams) => {
	return useQuery<SharedSubscription[], Error>({
		queryKey: [SHARED_SUBSCRIPTIONS_BASE_KEY, userId],
		queryFn: () => fetchSharedSubscriptions({ authToken: authToken!, userId: userId!}),
		enabled: !!authToken && !!userId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};
