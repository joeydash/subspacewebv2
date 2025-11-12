import { useQuery } from "@tanstack/react-query";
import { fetchAllSavings } from "../../api/savings";

interface UseSavingsParams {
  userId: string;
  authToken: string;
}

export const useSavings = ({ userId, authToken }: UseSavingsParams) => {
  return useQuery({
    queryKey: ["savings", userId],
    queryFn: () => fetchAllSavings({ userId, authToken }),
    enabled: !!userId && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
