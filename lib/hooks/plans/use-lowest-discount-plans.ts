import { useQuery } from '@tanstack/react-query';
import { fetchLowestDiscountPlans } from '../../api/plans';

export const useLowestDiscountPlans = () => {
	return useQuery({
		queryKey: ['lowest_discount_plans'],
		queryFn: fetchLowestDiscountPlans,
		staleTime: 5 * 60 * 1000,
	});
};
