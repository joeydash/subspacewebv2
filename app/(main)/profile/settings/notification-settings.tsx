'use client';

import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { Bell, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import useNotificationSettings from '@/lib/hooks/settings/use-notification-settings';
import useNotificationSettingsMutation from '@/lib/hooks/settings/use-notification-settings-mutation';



const NotificationSettingsComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [isExpanded, setIsExpanded] = useState(false);
	const { data: notificationSettings, isLoading } = useNotificationSettings({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	const notificationSettingsMutation = useNotificationSettingsMutation({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});


	const toggleNotificationSettings = (key: 'message' | 'subscription_expiry' | 'coupon_expiry' | 'promotional') => {
		if (!notificationSettings) return;	

		const newNotificationSettings = {
			...notificationSettings,
			[key]: !notificationSettings[key]
		};

		notificationSettingsMutation.mutate(newNotificationSettings);
	}
	
	return (
		<>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-3 sm:p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
			>
				<div className="flex items-center gap-2 sm:gap-3">
					<Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
					<span className="text-sm sm:text-base font-medium">Notification Settings</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				) : (
					<ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				)}
			</button>
			{isExpanded && (
				<div className="space-y-3 sm:space-y-4 px-2 sm:px-3 mt-3 sm:mt-4">
					<div className="flex items-center justify-between gap-3">
						<div className="flex-1 min-w-0">
							<h4 className="text-sm sm:text-base font-medium text-white">Message Notifications</h4>
							<p className="text-xs sm:text-sm text-gray-400 mt-0.5">Receive notifications for new messages</p>
						</div>
						{isLoading ? (
							<Skeleton height={24} width={44} borderRadius={12} />
						) : (
							<button
								onClick={() => toggleNotificationSettings('message')}
								className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings?.message ? 'bg-indigo-600' : 'bg-gray-600'}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings?.message ? 'translate-x-6' : 'translate-x-1'}`}
								/>
							</button>
						)}
					</div>

					<div className="flex items-center justify-between gap-3">
						<div className="flex-1 min-w-0">
							<h4 className="text-sm sm:text-base font-medium text-white">Subscription Expiry</h4>
							<p className="text-xs sm:text-sm text-gray-400 mt-0.5">Get notified before subscriptions expire</p>
						</div>
						{isLoading ? (
							<Skeleton height={24} width={44} borderRadius={12} />
						) : (
							<button
								onClick={() => toggleNotificationSettings('subscription_expiry')}
								className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings?.subscription_expiry ? 'bg-indigo-600' : 'bg-gray-600'}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings?.subscription_expiry ? 'translate-x-6' : 'translate-x-1'}`}
								/>
							</button>
						)}
					</div>

					<div className="flex items-center justify-between gap-3">
						<div className="flex-1 min-w-0">
							<h4 className="text-sm sm:text-base font-medium text-white">Coupon Expiry</h4>
							<p className="text-xs sm:text-sm text-gray-400 mt-0.5">Get notified before coupons expire</p>
						</div>
						{isLoading ? (
							<Skeleton height={24} width={44} borderRadius={12} />
						) : (
							<button
								onClick={() => toggleNotificationSettings('coupon_expiry')}
								className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings?.coupon_expiry ? 'bg-indigo-600' : 'bg-gray-600'}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings?.coupon_expiry ? 'translate-x-6' : 'translate-x-1'}`}
								/>
							</button>
						)}
					</div>

					<div className="flex items-center justify-between gap-3">
						<div className="flex-1 min-w-0">
							<h4 className="text-sm sm:text-base font-medium text-white">Promotional</h4>
							<p className="text-xs sm:text-sm text-gray-400 mt-0.5">Receive promotional offers and updates</p>
						</div>
						{isLoading ? (
							<Skeleton height={24} width={44} borderRadius={12} />
						) : (
							<button
								onClick={() => toggleNotificationSettings('promotional')}
								className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings?.promotional ? 'bg-indigo-600' : 'bg-gray-600'}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings?.promotional ? 'translate-x-6' : 'translate-x-1'}`}
								/>
							</button>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default NotificationSettingsComponent;
