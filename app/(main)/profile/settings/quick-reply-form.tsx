'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCreateQuickReplyMutation } from '@/lib/hooks/settings/use-create-quick-reply-mutation';
import { toast } from 'react-hot-toast';

const QuickReplyForm: React.FC = () => {
	const { user } = useAuthStore();

	const createQuickReplyMutation = useCreateQuickReplyMutation({
		authToken: user?.auth_token || '',
		userId: user?.id || ''
	});

	const [quickReplyData, setQuickReplyData] = useState({
		shortcut: '',
		message: ''
	});

	const handleQuickReplyInputChange = (field: 'shortcut' | 'message', value: string) => {
		setQuickReplyData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleSaveQuickReply = () => {
		if (!quickReplyData.shortcut.trim()) {
			toast.error('Shortcut is required');
			return;
		}

		if (!quickReplyData.message.trim()) {
			toast.error('Reply message is required');
			return;
		}


		createQuickReplyMutation.mutate({
			shortcut: quickReplyData.shortcut.trim(),
			message: quickReplyData.message.trim()
		});

		setQuickReplyData({
			shortcut: '',
			message: ''
		});
	};


	return (
		<div className="rounded-lg p-2 sm:p-3">
			<div className="space-y-3 sm:space-y-4">
				<div>
					<label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">Shortcut</label>
					<input
						type="text"
						value={quickReplyData.shortcut}
						onChange={(e) => handleQuickReplyInputChange('shortcut', e.target.value)}
						placeholder="A word that will quickly retrieve this reply"
						className="w-full bg-dark-500 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>

				<div>
					<label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">Reply Message</label>
					<textarea
						value={quickReplyData.message}
						onChange={(e) => handleQuickReplyInputChange('message', e.target.value)}
						placeholder="Enter text"
						rows={3}
						className="w-full bg-dark-500 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
					/>
				</div>

				<div className="flex justify-end">
					<button
						onClick={handleSaveQuickReply}
						disabled={!quickReplyData.shortcut.trim() || !quickReplyData.message.trim()}
						className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};

export default QuickReplyForm;
