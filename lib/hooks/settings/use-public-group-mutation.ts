import { useMutation } from '@tanstack/react-query';
import { updatePublicGroupSettings } from '@/lib/api/settings';
import { SUBSCRIPTION_ROOMS_BASE_KEY } from './use-subscription-rooms';
import { toast } from 'react-hot-toast';
import { PUBLIC_GROUP_SETTINGS_BASE_KEY } from './use-public-group-settings';

interface UsePublicGroupMutationParams {
	userId: string;
	authToken: string;
}

export const usePublicGroupMutation = ({
	userId,
	authToken
}: UsePublicGroupMutationParams) => {
	return useMutation({
		mutationFn: async ({
			isPublic
		}: {
			isPublic: boolean
		}) => updatePublicGroupSettings({ userId, authToken, isPublic }),
		onMutate: async (variables, context) => {
			const previous = context.client.getQueryData([PUBLIC_GROUP_SETTINGS_BASE_KEY, userId]);
			context.client.setQueryData([PUBLIC_GROUP_SETTINGS_BASE_KEY, userId], { is_public: variables.isPublic });

			return { previous };
		},
		onError: (err, _variables, onMutateResult, context) => {
			toast.error(err?.message || 'Failed to update public groups');
			context.client.setQueryData([PUBLIC_GROUP_SETTINGS_BASE_KEY, userId], onMutateResult?.previous);
		},
		onSuccess(_data, _variables, _onMutateResult, context) {
			context.client.invalidateQueries({queryKey: [SUBSCRIPTION_ROOMS_BASE_KEY, userId]});
		},
	});
};

export default usePublicGroupMutation;
