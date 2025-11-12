import { useMutation } from '@tanstack/react-query';
import { updatePrivacySettings } from '../../api/settings';
import { PRIVACY_SETTINGS_BASE_KEY } from './usePrivacySettings';
import { toast } from 'react-hot-toast';

interface UseUpdatePrivacySettingsParams {
	authToken: string;
	userId: string;
}


export const useUpdatePrivacySettings = ({ userId, authToken }: UseUpdatePrivacySettingsParams) => {
	return useMutation({
		mutationFn: ({
			hidePhoneNumber,
			hideEmailId,
		}: {
			hidePhoneNumber: boolean;
			hideEmailId: boolean;
		}) => updatePrivacySettings(authToken, userId, hidePhoneNumber, hideEmailId),
		onMutate: async (newSettings, context) => {
			const previousSettings = context.client.getQueryData<{ hide_phone_number: boolean; hide_email_id: boolean }>([PRIVACY_SETTINGS_BASE_KEY, userId]);
			context.client.setQueryData([PRIVACY_SETTINGS_BASE_KEY, userId], {
				hide_phone_number: newSettings.hidePhoneNumber,
				hide_email_id: newSettings.hideEmailId,
			});


			return { previousSettings };
		},
		onError: (err, _newSettings, onMutateResult, context) => {
			toast.error(err.message || 'Failed to update privacy settings. Please try again.');
			if (context && onMutateResult?.previousSettings) {
				context.client.setQueryData([PRIVACY_SETTINGS_BASE_KEY, userId], onMutateResult.previousSettings);
			}
		}
	});
};