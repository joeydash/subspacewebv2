import { useQuery } from "@tanstack/react-query";
import { fetchFavouriteBrands } from "../../api/brands";

interface UseFavouriteBrandsProps {
  isAuthenticated: boolean;
  user?: {
    id?: string;
    auth_token?: string;
  };
}

export const useFavouriteBrands = ({
  isAuthenticated,
  user,
}: UseFavouriteBrandsProps) => {
  return useQuery({
    queryKey: ["favourite_brands", user?.id, isAuthenticated],
    queryFn: () => fetchFavouriteBrands({ isAuthenticated, user }),
  });
};
