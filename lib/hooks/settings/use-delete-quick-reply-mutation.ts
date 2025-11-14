import { useMutation } from '@tanstack/react-query';
import { deleteQuickReply, QuickReply } from '@/lib/api/settings';
import { toast } from 'react-hot-toast';

export const QUICK_REPLIES_BASE_KEY = 'quick_replies';

interface UseDeleteQuickReplyMutationParams {
	authToken: string;
	userId: string;
}

export const useDeleteQuickReplyMutation = ({ authToken, userId }: UseDeleteQuickReplyMutationParams) => {
	return useMutation({
		mutationFn: (quickReplyId: string) => deleteQuickReply({ authToken, userId, quickReplyId }),
		onMutate: async (quickReplyId: string, context) => {
			const previousQuickReplies = context?.client.getQueryData<QuickReply[]>([QUICK_REPLIES_BASE_KEY, userId]);

			const newQuickReplies = previousQuickReplies?.filter(qr => qr.id !== quickReplyId) || [];
			context?.client.setQueryData<QuickReply[]>([QUICK_REPLIES_BASE_KEY, userId], newQuickReplies);

			return { previousQuickReplies };
		},
		onError: (err, quickReplyId, onMutateResult, context) => {
			context.client.setQueryData<QuickReply[]>(
				[QUICK_REPLIES_BASE_KEY, userId],
				onMutateResult?.previousQuickReplies
			);

			toast.error(err.message || 'Failed to delete quick reply');
		},
		onSuccess: (_data, _quickReplyId, _onMutateResult, context) => {
			context.client.invalidateQueries({queryKey: [QUICK_REPLIES_BASE_KEY, userId]});
		}
	});
};