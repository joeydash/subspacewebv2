import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSubscriptionPublicStatus } from '../../api/settings';
import { SHARED_SUBSCRIPTIONS_BASE_KEY } from './useSharedSubscriptions';
import { toast } from 'react-hot-toast';

interface UseUpdateSubscriptionPublicStatusParams {
	authToken: string;
	userId: string;
}

interface SharedSubscription {
	subscription_id: string;
	is_public: boolean;
	subscription: {
		name: string;
		brand: {
			logo: string;
		};
	};
}

export const useUpdateSubscriptionPublicStatus = ({ userId, authToken }: UseUpdateSubscriptionPublicStatusParams) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			subscriptionId,
			isPublic,
		}: {
			subscriptionId: string;
			isPublic: boolean;
		}) => updateSubscriptionPublicStatus({ subscriptionId, userId, authToken, isPublic }),
		
		onMutate: async ({ subscriptionId, isPublic }) => {
			const previousSubscriptions = queryClient.getQueryData<SharedSubscription[]>([SHARED_SUBSCRIPTIONS_BASE_KEY, userId]);
			
			queryClient.setQueryData<SharedSubscription[]>([SHARED_SUBSCRIPTIONS_BASE_KEY, userId], (old) => 
				old?.map(sub =>
					sub.subscription_id === subscriptionId
						? { ...sub, is_public: isPublic }
						: sub
				) || []
			);

			return { previousSubscriptions };
		},
		
		onError: (err, _variables, context) => {
			toast.error(err.message || 'Failed to update subscription. Please try again.');
			if (context?.previousSubscriptions) {
				queryClient.setQueryData([SHARED_SUBSCRIPTIONS_BASE_KEY, userId], context.previousSubscriptions);
			}
		},
	});
};
