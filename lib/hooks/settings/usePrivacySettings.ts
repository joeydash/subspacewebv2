import { useQuery } from '@tanstack/react-query';
import { fetchPrivacySettings, PrivacySettings } from '../../api/settings';

export const PRIVACY_SETTINGS_BASE_KEY = 'privacy_settings';

export const usePrivacySettings = (authToken: string | undefined, userId: string | undefined) => {
  return useQuery<PrivacySettings, Error>({
    queryKey: [PRIVACY_SETTINGS_BASE_KEY, userId],
    queryFn: () => fetchPrivacySettings({userId, authToken: authToken!}),
    enabled: !!authToken && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
