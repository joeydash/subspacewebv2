import { useQuery } from '@tanstack/react-query';
import { fetchBrands } from '../../api/brands';

export const useBrands = ({userId, authToken}: {userId: string, authToken: string}) => {
  return useQuery({
    queryKey: ['brands', userId],
    queryFn: () => fetchBrands({authToken}),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
};
