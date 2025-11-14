import { useMutation } from '@tanstack/react-query';
import { createQuickReply, QuickReply } from '@/lib/api/settings';
import { toast } from 'react-hot-toast';
import { QUICK_REPLIES_BASE_KEY } from './use-quick-replies';


interface UseCreateQuickReplyMutationParams {
	authToken: string;
	userId: string;
}

export const useCreateQuickReplyMutation = ({ authToken, userId }: UseCreateQuickReplyMutationParams) => {
	return useMutation({
		mutationFn: ({
			shortcut,
			message
		}: { shortcut: string; message: string }
		) => createQuickReply({
			authToken,
			userId,
			shortcut,
			message
		}),
		onMutate: (newQuickReply, context) => {
			const previousQuickReplies = context?.client.getQueryData<QuickReply[]>([QUICK_REPLIES_BASE_KEY, userId]);

			const newQuickReplies = [
				...previousQuickReplies!,
				{
					id: 'temp-id-' + Math.random().toString(36).slice(2, 9),
					shortcut: newQuickReply.shortcut,
					message: newQuickReply.message
				}
			];
			context?.client.setQueryData<QuickReply[]>([QUICK_REPLIES_BASE_KEY, userId], newQuickReplies);
		},
		onError: (err) => {
			toast.error(err.message || 'Failed to save quick reply');
		},
		onSettled: (_data, _err, _variables, _onMutateResult, context) => {
			context?.client.invalidateQueries({ queryKey: [QUICK_REPLIES_BASE_KEY, userId] });
		}
	});
};