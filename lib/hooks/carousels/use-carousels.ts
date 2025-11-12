import { useQuery } from "@tanstack/react-query";
import { fetchCarousels } from "../../api/carousels";

interface UseCarouselsProps {
  isAuthenticated: boolean;
  user?: {
    id?: string;
    auth_token?: string;
  };
}

export const useCarousels = ({ isAuthenticated, user }: UseCarouselsProps) => {
  return useQuery({
    queryKey: ["carousels", isAuthenticated, user?.id],
    queryFn: () => fetchCarousels({ isAuthenticated, user }),
  });
};
