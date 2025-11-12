import { useState } from 'react';
import { LockKeyhole, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePrivacySettings } from '../../hooks/settings/usePrivacySettings';
import { useUpdatePrivacySettings } from '../../hooks/settings/useUpdatePrivacySettings';
import Skeleton from 'react-loading-skeleton';

const PrivacySettingsComponent = () => {
	const { user } = useAuthStore();
	const [isExpanded, setIsExpanded] = useState(false);


	const { data: privacySettings, isLoading: isLoadingPrivacySettings, error: privacySettingsError, refetch } = usePrivacySettings(user?.auth_token, user?.id);
	const updateMutation = useUpdatePrivacySettings({ userId: user?.id || '', authToken: user?.auth_token || '' });

	const hidePhoneNumber = privacySettings?.hide_phone_number || false;
	const hideEmailId = privacySettings?.hide_email_id || false;

	const handlePhoneNumberToggle = () => {
		if (!user?.id || !user?.auth_token) return;

		const newValue = !hidePhoneNumber;
		updateMutation.mutate({
			hidePhoneNumber: newValue,
			hideEmailId: hideEmailId,
		});
	};

	const handleEmailToggle = () => {
		if (!user?.id || !user?.auth_token) return;

		const newValue = !hideEmailId;
		updateMutation.mutate({
			hidePhoneNumber: hidePhoneNumber,
			hideEmailId: newValue,
		});
	};

	return (
		<>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-3 sm:p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
			>
				<div className="flex items-center gap-2 sm:gap-3">
					<LockKeyhole className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
					<span className="text-sm sm:text-base font-medium">Privacy Settings</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				) : (
					<ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				)}
			</button>
			{isExpanded && (
				privacySettingsError ? (
					<div className="text-center py-6 sm:py-8 px-2">
						<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4 mb-4">
							<p className="text-red-400 mb-3 sm:mb-4 text-xs sm:text-sm">{privacySettingsError.message || 'Failed to load privacy settings'}</p>
							<button
								onClick={() => refetch()}
								className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
							>
								Try Again
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-3 sm:space-y-4 px-2 sm:px-3 mt-3 sm:mt-4">
						<p className="text-xs sm:text-sm text-gray-400">
							Control what information is visible to other users
						</p>

						{/* Hide Phone Number */}
						<div className="flex items-center justify-between gap-3">
							<div className="flex-1 min-w-0">
								<h4 className="text-sm sm:text-base font-medium text-white">Hide Phone Number</h4>
								<p className="text-xs sm:text-sm text-gray-400 mt-0.5">Your phone number won't be visible to others</p>
							</div>
							{isLoadingPrivacySettings ? (
								<Skeleton height={24} width={44} borderRadius={12} />
							) : (
								<button
									onClick={handlePhoneNumberToggle}
									className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${
										hidePhoneNumber ? 'bg-indigo-600' : 'bg-gray-600'
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											hidePhoneNumber ? 'translate-x-6' : 'translate-x-1'
										}`}
									/>
								</button>
							)}
						</div>

						{/* Hide Email Id */}
						<div className="flex items-center justify-between gap-3">
							<div className="flex-1 min-w-0">
								<h4 className="text-sm sm:text-base font-medium text-white">Hide Email Address</h4>
								<p className="text-xs sm:text-sm text-gray-400 mt-0.5">Your email won't be visible to others</p>
							</div>
							{isLoadingPrivacySettings ? (
								<Skeleton height={24} width={44} borderRadius={12} />
							) : (
								<button
									onClick={handleEmailToggle}
									className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${
										hideEmailId ? 'bg-indigo-600' : 'bg-gray-600'
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											hideEmailId ? 'translate-x-6' : 'translate-x-1'
										}`}
									/>
								</button>
							)}
						</div>
					</div>
				)
			)}
		</>
	);
};

export default PrivacySettingsComponent;
