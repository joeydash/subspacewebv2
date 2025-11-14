import { updateNotificationSettings } from '@/lib/api/settings';
import { useMutation } from '@tanstack/react-query';
import type { NotificationSettings } from '@/lib/api/settings';
import { NOTIFICATION_SETTINGS_BASE_KEY } from '@/lib/hooks/settings/use-notification-settings';
import { toast } from 'react-hot-toast';


interface UseNotificationSettingsMutationParams {
	userId: string;
	authToken: string;
}

export default function useNotificationSettingsMutation(
	{ userId, authToken }: UseNotificationSettingsMutationParams
) {
	return useMutation({
		// mutationKey: [NOTIFICATION_SETTINGS_BASE_KEY, userId],
		mutationFn: (settings: NotificationSettings) => updateNotificationSettings({ userId, authToken, settings }),
		onMutate: async (newSettings, context) => {
			await context?.client.cancelQueries({ queryKey: [NOTIFICATION_SETTINGS_BASE_KEY, userId] });
			const previousSettings = context?.client.getQueryData<NotificationSettings>([NOTIFICATION_SETTINGS_BASE_KEY, userId]);

			context?.client.setQueryData<NotificationSettings>(
				[NOTIFICATION_SETTINGS_BASE_KEY, userId],
				newSettings
			);


			return { previousSettings };
		},
		onError: (err, _variables, onMutateResult, context) => {
			context?.client.setQueryData<NotificationSettings>(
				[NOTIFICATION_SETTINGS_BASE_KEY, userId],
				onMutateResult?.previousSettings
			);

			toast.error(err.message || 'Failed to update notification settings');
		}
	})
}