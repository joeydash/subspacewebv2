import { useQuery } from '@tanstack/react-query';
import { fetchQuickReplies, QuickReply } from '@/lib/api/settings';

export const QUICK_REPLIES_BASE_KEY = 'quick_replies';

interface UseQuickRepliesParams {
	authToken: string;
	userId: string;
}

export const useQuickReplies = ({ authToken, userId }: UseQuickRepliesParams) => {
	return useQuery<QuickReply[], Error>({
		queryKey: [QUICK_REPLIES_BASE_KEY, userId],
		queryFn: () => fetchQuickReplies({ authToken: authToken!, userId: userId! }),
		enabled: !!authToken && !!userId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};