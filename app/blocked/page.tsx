'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { handleSupportChat } from '@/lib/utils/support-chat';

const BlockedUserPage = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const isBlocked = user?.isBlocked;

	const blockedTitle = user?.blockedTitle || ' Account Blocked 😔';

	const handleNeedHelp = async () => {
		if (!user?.id || !user?.auth_token) return;

		try {
			const roomId = await handleSupportChat(user.id, user.auth_token);
			if (roomId) {
				router.push('/support');
			}
		} catch (error) {
			console.error('Error starting support chat:', error);
		}
	};

	useEffect(() => {
		if (!isBlocked) {
			router.push('/');
		}
	}, [isBlocked, router])

	return (
		<div className="min-h-screen bg-gradient-to-br from-dark-600 via-dark-700 to-dark-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
			</div>

			<div className="relative z-10 text-center max-w-md mx-auto">
				{/* Main Heading */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-white mb-4">
						{blockedTitle}
					</h1>

					<p className="text-gray-300 text-lg mb-8">
						Your account has been temporarily blocked. Please contact support for assistance.
					</p>
				</div>

				{/* Need Help Button */}
				<button
					onClick={handleNeedHelp}
					className="w-full max-w-xs mx-auto py-4 px-8 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mb-12"
				>
					<MessageSquare className="h-5 w-5" />
					Need Help?
				</button>
			</div>
		</div>
	);
};

export default BlockedUserPage;