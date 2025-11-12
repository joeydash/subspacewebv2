import { useQuery } from "@tanstack/react-query";
import { fetchRentPrice } from "../../api/rent";

interface UseRentPriceParams {
  user_id: string;
  product_location_id: string;
  start_time: string;
  end_time: string;
  auth_token?: string;
}

export const useRentPrice = (params: UseRentPriceParams) => {
  return useQuery({
    queryKey: ["rent_price", params.user_id, params.product_loation_id, params.start_time, params.end_time],
    queryFn: () => fetchRentPrice(params),
    enabled: !!params.product_location_id && !!params.start_time && !!params.end_time,
    staleTime: 5 * 60 * 1000,
  });
};
