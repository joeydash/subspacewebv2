import { useQuery } from "@tanstack/react-query";
import { fetchProfileCarousels } from "../../api/carousels";

export const useProfileCarousels = (userId?: string, authToken?: string) => {
  return useQuery({
    queryKey: ["profile_carousels", userId],
    queryFn: () => fetchProfileCarousels({ userId: userId!, authToken: authToken! }),
    enabled: !!userId && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
