import { useQuery } from "@tanstack/react-query";
import { fetchRentProducts } from "../../api/rent";

export const useRentProducts = ({serviceId, user, address}) => {
  return useQuery({
    queryKey: ["rent_products", serviceId, address?.latitude, address?.longitude],
    queryFn: () => fetchRentProducts({serviceId, user, address}),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
};
