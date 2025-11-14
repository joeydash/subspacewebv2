import { useQuery } from '@tanstack/react-query';
import { fetchPublicGroupSettings, PublicGroupSettings } from '@/lib/api/settings';

export const PUBLIC_GROUP_SETTINGS_BASE_KEY = 'public_group_settings';

interface UsePublicGroupSettingsParams {
	userId: string | undefined;
	authToken: string | undefined;
}

export const usePublicGroupSettings = ({ userId, authToken }: UsePublicGroupSettingsParams) => {
	return useQuery<PublicGroupSettings, Error>({
		queryKey: [PUBLIC_GROUP_SETTINGS_BASE_KEY, userId],
		queryFn: () => fetchPublicGroupSettings({ userId: userId!, authToken: authToken! }),
		enabled: !!userId && !!authToken,
	});
};
