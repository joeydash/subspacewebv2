import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, Share2, Plus, Minus } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';

interface ShareSubscriptionModalProps {
	isOpen: boolean;
	onClose: () => void;
	subscription: {
		id: string;
		service_name: string;
		service_image_url: string;
		plan: string;
		price: number;
		share_limit: number;
	};
}

const ShareSubscriptionModal: React.FC<ShareSubscriptionModalProps> = ({
	isOpen,
	onClose,
	subscription
}) => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const router = useRouter();
	const [shareCount, setShareCount] = useState(subscription.share_limit - 1);
	const [isCreatingGroup, setIsCreatingGroup] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const earningsPerUser = Math.floor((subscription.price / subscription.share_limit) * shareCount);

	const handleShareCountChange = (increment: boolean) => {
		if (increment && shareCount < subscription.share_limit - 1) {
			setShareCount(prev => prev + 1);
		} else if (!increment && shareCount > 0) {
			setShareCount(prev => prev - 1);
		}
	};

	const handleCreateGroup = async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsCreatingGroup(true);
		setError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($user_id: uuid = "", $user_subscription_id: uuid = "", $limit: Int) {
              __typename
              createSubscriptionGroup(request: {user_id: $user_id, user_subscription_id: $user_subscription_id, limit: $limit}) {
                __typename
                user_map_id
                room_id
                group_name
                admin_id
              }
            }
          `,
					variables: {
						user_id: user.id,
						user_subscription_id: subscription.id,
						limit: shareCount
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || 'Failed to create sharing group');
				return;
			}

			if (data.data?.createSubscriptionGroup?.room_id) {
				// Successfully created group
				const roomId = data.data.createSubscriptionGroup.room_id;
				onClose();
				// Navigate to chat with the created group
				router.push(`/chat?groupId=${roomId}`);
			} else {
				setError('Failed to create sharing group');
			}
		} catch (error) {
			console.error('Error creating sharing group:', error);
			setError('Network error. Please try again.');
		} finally {
			setIsCreatingGroup(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-dark-500 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
				{/* Header */}
				<div className="p-6 border-b border-gray-700">
					<div className="flex items-center justify-between">
						<h3 className="text-xl font-bold text-white">Share Subscription</h3>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6 text-center">
					{/* Service Logo */}
					<div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden bg-indigo-500 p-1">
						<div className="w-full h-full rounded-full overflow-hidden bg-white p-2 relative">
							<Image
								src={subscription.service_image_url}
								alt={subscription.service_name}
								fill
								className="object-contain"
							/>
						</div>
					</div>

					{/* Main Message */}
					<h2 className="text-xl font-bold text-white mb-2">
						We will create group of paying users for you
					</h2>

					{/* Earnings Display */}
					<div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
						<p className="text-green-400 font-medium">
							You will earn Rs. {earningsPerUser} by sharing this subscription
						</p>
					</div>

					{/* Share Count Selector */}
					<div className="flex items-center justify-center gap-4 mb-8">
						<span className="text-gray-300">Sharing {subscription.service_name} with</span>
						<div className="flex items-center gap-3 bg-dark-400 rounded-lg p-2">
							<button
								onClick={() => handleShareCountChange(false)}
								disabled={shareCount <= 1}
								className="w-8 h-8 bg-dark-300 hover:bg-dark-200 disabled:bg-dark-500 disabled:cursor-not-allowed text-white rounded flex items-center justify-center transition-colors"
							>
								<Minus className="h-4 w-4" />
							</button>
							<span className="w-8 text-center font-bold text-white text-lg">{shareCount}</span>
							<button
								onClick={() => handleShareCountChange(true)}
								disabled={shareCount >= subscription.share_limit - 1}
								className="w-8 h-8 bg-dark-300 hover:bg-dark-200 disabled:bg-dark-500 disabled:cursor-not-allowed text-white rounded flex items-center justify-center transition-colors"
							>
								<Plus className="h-4 w-4" />
							</button>
						</div>
						<span className="text-gray-300">users</span>
					</div>

					{/* Share Button */}
					<button
						onClick={handleCreateGroup}
						disabled={isCreatingGroup}
						className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
					>
						{isCreatingGroup ? (
							<>
								<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
								Creating Group...
							</>
						) : (
							<>
								<Share2 color='blue' className="h-5 w-5" />
								Share
							</>
						)}
					</button>

					{/* Error Display */}
					{error && (
						<div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
							{error}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ShareSubscriptionModal;