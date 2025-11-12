import { useQuery } from '@tanstack/react-query';
import { fetchHelpWidgetDetails, HelpWidgetData } from '../../api/mailbox';

export const useMailbox = (authToken: string | undefined, key: string = 'mailbox') => {
  return useQuery<HelpWidgetData, Error>({
    queryKey: ['mailbox', key],
    queryFn: () => fetchHelpWidgetDetails(authToken!, key),
    enabled: !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
