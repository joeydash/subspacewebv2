import { useQuery } from "@tanstack/react-query";
import { fetchServiceDetails } from "../../api/service";

interface UseServiceParams {
  serviceId: string;
  user?: { id: string; auth_token?: string };
}

export const SERVICE_DETAILS_BASE_KEY = "serviceDetails";

export const useServiceDetails = ({ serviceId, user }: UseServiceParams) => {
  return useQuery({
    queryKey: [SERVICE_DETAILS_BASE_KEY, serviceId, user?.id],
    queryFn: () => fetchServiceDetails({ serviceId, user }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!serviceId,
  });
};

