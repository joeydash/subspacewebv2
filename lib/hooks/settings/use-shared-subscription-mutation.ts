import { useMutation } from '@tanstack/react-query';
import { updateSharedSubscriptionPublicStatus, SharedSubscription } from '@/lib/api/settings';
import { SHARED_SUBSCRIPTIONS_BASE_KEY } from './use-shared-subscriptions';
import { toast } from 'react-hot-toast';

interface UseUpdateSubscriptionPublicStatusParams {
	authToken: string;
	userId: string;
}

export const useSharedSubscriptionMutation = ({ userId, authToken }: UseUpdateSubscriptionPublicStatusParams) => {
	return useMutation({
		mutationFn: ({
			subscriptionId,
			isPublic,
		}: {
			subscriptionId: string;
			isPublic: boolean;
		}) => updateSharedSubscriptionPublicStatus({ subscriptionId, authToken, isPublic }),
		
		onMutate: async (subscription, context) => {
			const previousSubscriptions = context.client.getQueryData<SharedSubscription[]>([SHARED_SUBSCRIPTIONS_BASE_KEY, userId]);
			
			context.client.setQueryData<SharedSubscription[]>([SHARED_SUBSCRIPTIONS_BASE_KEY, userId], (old) => 
				old?.map(sub =>
					sub.id === subscription.subscriptionId
						? { ...sub, is_public: subscription.isPublic }
						: sub
				) || []
			);

			return { previousSubscriptions };
		},
		
		onError: (err, _variables, onMutateResult, context) => {
			toast.error(err.message || 'Failed to update subscription. Please try again.');
				context.client.setQueryData([SHARED_SUBSCRIPTIONS_BASE_KEY, userId], onMutateResult?.previousSubscriptions);
		},
	});
};
