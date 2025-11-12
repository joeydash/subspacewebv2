import { useQuery } from '@tanstack/react-query';
import { fetchSupportData, SupportSection } from '../../api/support';

export const useSupport = (
  authToken: string | undefined,
  userId: string | undefined,
  query: string = 'help'
) => {
  return useQuery<SupportSection[], Error>({
    queryKey: ['support', userId, query],
    queryFn: () => fetchSupportData(authToken!, userId!, query),
    enabled: !!authToken && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
