import React from 'react';
import PrivacySettings from './privacy-settings';
import SharedSubscriptionSettings from './shared-subscription-setting';
import SharedSubscriptions from './shared-subscriptions';
import NotificationSettings from './notification-settings';
import QuickReplySettings from './quick-reply-settings';
import LanguageSettings from './language-settings';

const SettingsComponent: React.FC = () => {
	return (
		<div className="p-0.5 sm:p-6 space-y-4">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-white">Settings</h2>
				<p className="text-gray-400 mt-1">Manage your account preferences and privacy</p>
			</div>

			<div className="space-y-4">
				<PrivacySettings />
				<SharedSubscriptionSettings />
				<SharedSubscriptions />
				<NotificationSettings />
				<QuickReplySettings />
				<LanguageSettings />
			</div>
		</div>
	);
};

export default SettingsComponent;
