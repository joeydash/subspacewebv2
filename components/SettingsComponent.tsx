import React from 'react';
import PrivacySettingsComponent from './settings/PrivacySettingsComponent';
import SharedSubscriptionSettingsComponent from './settings/SharedSubscriptionSettingsComponent';
import SharedSubscriptionsComponent from './settings/SharedSubscriptionsComponent';
import NotificationSettingsComponent from './settings/NotificationSettingsComponent';
import QuickReplySettingsComponent from './settings/QuickReplySettingsComponent';
import LanguageSettingsComponent from './settings/LanguageSettingsComponent';

const SettingsComponent: React.FC = () => {
	return (
		<div className="p-0.5 sm:p-6 space-y-4">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-white">Settings</h2>
				<p className="text-gray-400 mt-1">Manage your account preferences and privacy</p>
			</div>

			<div className="space-y-4">
				{/* Privacy Settings */}
				<PrivacySettingsComponent />

				{/* Shared Subscription Settings (Groups) */}
				<SharedSubscriptionSettingsComponent />

				{/* Shared Subscriptions (Individual) */}
				<SharedSubscriptionsComponent />

				{/* Notification Settings */}
				<NotificationSettingsComponent />

				{/* Quick Reply */}
				<QuickReplySettingsComponent />

				{/* Language */}
				<LanguageSettingsComponent />
			</div>
		</div>
	);
};

export default SettingsComponent;
