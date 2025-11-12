import { useQuery } from "@tanstack/react-query";
import { fetchBrandCategories } from "../../api/brands";

interface UseBrandCategoriesParams {
  userId: string;
  authToken: string;
}
export const useBrandCategories = ({userId, authToken}: useBrandCategoriesParams) => {
  return useQuery({
    queryKey: ["brand_categories", userId],
    queryFn: () => fetchBrandCategories(authToken),
  });
};
