import { useQuery } from "@tanstack/react-query";
import { fetchRentalHistory } from "../../api/rent";


export const RENTAL_HISTORY_BASE_KEY = "rental_history";

export const useRentalHistory = ({userId, authToken}) => {
  return useQuery({
    queryKey: [RENTAL_HISTORY_BASE_KEY, userId],
    queryFn: () => {
      return fetchRentalHistory({
        userId: userId,
        authToken: authToken,
      });
    },
    enabled: !!userId,
  });
};
