import { useQuery } from '@tanstack/react-query';
import { fetchRentProductClasses, RentProductClass } from '../../api/rent';

export const useRentProductClasses = ({authToken, userId, address}: {authToken: string, userId: string, address: Record<string, any>}) => {
  const hasValidAddress = !!address?.latitude && !!address?.longitude;


  return useQuery<RentProductClass[]>({
    queryKey: ['rent_product_classes', address?.latitude, address?.longitude], 
    queryFn: () => fetchRentProductClasses({authToken, userId, address}),
    enabled: hasValidAddress,
    staleTime: 5 * 60 * 1000
  });
};
