import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptionRooms, SubscriptionRoom } from '@/lib/api/settings';

export const SUBSCRIPTION_ROOMS_BASE_KEY = 'subscription_rooms';

interface UseSubscriptionRoomsParams {
	userId: string | undefined;
	authToken: string | undefined;
	limit?: number;
	offset?: number;
}

export const useSubscriptionRooms = ({ userId, authToken}: UseSubscriptionRoomsParams) => {
	return useQuery<SubscriptionRoom[], Error>({
		queryKey: [SUBSCRIPTION_ROOMS_BASE_KEY, userId],
		queryFn: () => fetchSubscriptionRooms({ userId: userId!, authToken: authToken!}),
		enabled: !!userId && !!authToken,
	});
};
