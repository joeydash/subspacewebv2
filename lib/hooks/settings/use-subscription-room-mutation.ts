import { useMutation } from '@tanstack/react-query';
import { updateRoomPublicStatus } from '@/lib/api/settings';
import { toast } from 'react-hot-toast';
import { SUBSCRIPTION_ROOMS_BASE_KEY } from './use-subscription-rooms';
import { SubscriptionRoom } from '@/lib/api/settings';

interface UseSubscriptionRoomMutationParams {
	authToken: string;
	userId: string;
}

export const useSubscriptionRoomMutation = ({
	userId,
	authToken
}: UseSubscriptionRoomMutationParams) => {
	return useMutation({
		mutationFn: async ({
			roomId, isPublic
		}: { roomId: string; isPublic: boolean }
		) => updateRoomPublicStatus({ roomId, authToken, isPublic }),
		onMutate: async (room, context) => {
			const previousRooms = context.client.getQueryData<SubscriptionRoom[]>([SUBSCRIPTION_ROOMS_BASE_KEY, userId]);

			const newRooms = previousRooms?.map((r: SubscriptionRoom) => {
				if (r.id === room.roomId) {
					return { ...r, is_public: room.isPublic };
				}

				return r;
			});
			context.client.setQueryData([SUBSCRIPTION_ROOMS_BASE_KEY, userId], 	newRooms);

			return { previousRooms };
		},

		onError: (err, _variables, onMutateResult, context) => {
			toast.error(err.message || 'Failed to update group');
			context.client.setQueryData([SUBSCRIPTION_ROOMS_BASE_KEY, userId], onMutateResult?.previousRooms);
		}
	});
};
