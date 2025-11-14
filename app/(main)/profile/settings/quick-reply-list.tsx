'use client';


import React from 'react';
import { MessageSquare, Trash2} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import QuickRepliesSkeleton from './quick-replies-skeleton';
import { useQuickReplies } from '@/lib/hooks/settings/use-quick-replies';
import { useDeleteQuickReplyMutation } from '@/lib/hooks/settings/use-delete-quick-reply-mutation';
import { QuickReply } from '@/lib/api/settings';

interface QuickReplyItemProps {
	reply: QuickReply;
	onDelete: (id: string) => void;
}

const QuickReplyItem: React.FC<QuickReplyItemProps> = ({ reply, onDelete }) => (
	<div className="flex items-start justify-between py-3 sm:py-4 px-2 sm:px-3 border-b border-dark-300 last:border-b-0 hover:bg-dark-500/10 transition-colors group">
		<div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
			<div>
				<code className="text-xs sm:text-sm font-mono text-emerald-400 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/20">
					{reply.shortcut}
				</code>
			</div>
			<div>
				<p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
					{reply.message}
				</p>
			</div>
		</div>
		<button
			onClick={() => onDelete(reply.id)}
			className="ml-2 sm:ml-3 p-1.5 sm:p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
			title="Delete quick reply"
		>
			<Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
		</button>
	</div>
);

const QuickReplyList: React.FC = () => {
	const { user } = useAuthStore();
	const { data: quickReplies, isLoading: isLoadingQuickReplies } = useQuickReplies({
		authToken: user?.auth_token || '',
		userId: user?.id || ''
	});

	const deleteQuickReplyMutation = useDeleteQuickReplyMutation({
		authToken: user?.auth_token || '',
		userId: user?.id || ''
	});

			return (
				<div className="rounded-lg p-0">
					<div>
						{isLoadingQuickReplies ? (
							<QuickRepliesSkeleton count={4} />
						) : (quickReplies || []).length === 0 ? (
							<div className="text-center py-6 sm:py-8 px-2 text-gray-400">
								<MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
								<p className="text-xs sm:text-sm">No quick replies yet. Click + to add your first one!</p>
							</div>
						) : (
							<div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
							{quickReplies?.map(reply => (
								<QuickReplyItem
									key={reply.id}
									reply={reply}
									onDelete={deleteQuickReplyMutation.mutate}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		);
};

export default QuickReplyList;
