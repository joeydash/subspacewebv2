import {useQuery} from '@tanstack/react-query';
import { fetchSubscriptionBrands, Address } from '../../api/rent';

export const useRentProductBrands = ({
  authToken,
  userId,
  address
}: {
  authToken: string;
  userId: string;
  address: Address | null
}) => {
  const hasValidAddress = !!address?.latitude && !!address?.longitude;

  return useQuery({
    queryKey: ['subscription_brands', address?.latitude, address?.longitude, userId],
    queryFn: () =>
      fetchSubscriptionBrands({
        authToken,
        userId,
        address: address as Address,
      }),
    enabled: hasValidAddress,
    staleTime: 5 * 60 * 1000,
  });
};
