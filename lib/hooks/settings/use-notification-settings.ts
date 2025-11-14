import {useQuery} from '@tanstack/react-query';
import {fetchNotificationSettings} from '@/lib/api/settings';

interface UseNotificationSettingsParams {
  userId: string;
  authToken: string;
}


export const NOTIFICATION_SETTINGS_BASE_KEY = 'notification-settings';

export default function useNotificationSettings({ userId, authToken }: UseNotificationSettingsParams) {
	return useQuery({
		queryKey: [NOTIFICATION_SETTINGS_BASE_KEY, userId],
		queryFn: async ({signal}) => fetchNotificationSettings({ userId, authToken, signal }),
		enabled: !!userId && !!authToken,
	})
}