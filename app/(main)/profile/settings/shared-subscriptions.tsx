'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Share2, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSharedSubscriptions } from '@/lib/hooks/settings/use-shared-subscriptions';
import { useSharedSubscriptionMutation } from '@/lib/hooks/settings/use-shared-subscription-mutation';
import SharedSubscriptionsSkeleton from './shared-subscriptions-skeleton';

const SharedSubscriptionsComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [isExpanded, setIsExpanded] = useState(false);

	const {
		data: subscriptions = [],
		isLoading: isLoadingSubscriptions,
		error: subscriptionsError
	} = useSharedSubscriptions({
		authToken: user?.auth_token,
		userId: user?.id
	});

	const updateSubscriptionMutation = useSharedSubscriptionMutation({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	const handleSubscriptionToggle = (subscriptionId: string, currentIsPublic: boolean) => {
		updateSubscriptionMutation.mutate({
			subscriptionId,
			isPublic: !currentIsPublic
		});
	};

	return (
		<>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-3 sm:p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
			>
				<div className="flex items-center gap-2 sm:gap-3">
					<Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
					<span className="text-sm sm:text-base font-medium">Shared Subscriptions</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				) : (
					<ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				)}
			</button>
			{isExpanded && (
				isLoadingSubscriptions ? (
					<SharedSubscriptionsSkeleton count={4} />
				) : subscriptionsError ? (
					<div className="text-center py-6 sm:py-8 px-2">
						<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
							<p className="text-red-400 text-xs sm:text-sm">{subscriptionsError.message || 'Failed to load subscriptions'}</p>
						</div>
					</div>
				) : subscriptions.length === 0 ? (
					<div className="text-center py-6 sm:py-8 px-2">
						<Share2 className="h-8 w-8 text-gray-500 mx-auto mb-2" />
						<p className="text-gray-400 text-xs sm:text-sm">No active subscriptions found</p>
					</div>
				) : (
					<div className="space-y-3 sm:space-y-4 px-2 sm:px-3 mt-3 sm:mt-4 max-h-80 overflow-y-auto hide-scrollbar">
						<p className="text-xs sm:text-sm text-gray-400">
							Subscriptions with toggle 'ON' are public and will be shown in the marketplace. Private subscriptions are only visible to you.
						</p>
						{subscriptions.map((subscription) => (
							<div key={subscription.id} className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white p-1 shrink-0 relative">
										<Image
											src={subscription.service_image_url}
											alt={subscription.service_name}
											fill
											className="object-contain"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<h5 className="text-sm sm:text-base font-medium text-white truncate">
											{subscription.service_name}
										</h5>
										<p className="text-xs sm:text-sm text-gray-400 truncate mt-0.5">{subscription.plan}</p>
									</div>
								</div>
								<button
									onClick={() => handleSubscriptionToggle(subscription.id, subscription.is_public)}
									className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${
										subscription.is_public ? 'bg-indigo-600' : 'bg-gray-600'
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											subscription.is_public ? 'translate-x-6' : 'translate-x-1'
										}`}
									/>
								</button>
							</div>
						))}
					</div>
				)
			)}
		</>
	);
};

export default SharedSubscriptionsComponent;
