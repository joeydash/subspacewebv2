import { useQuery } from "@tanstack/react-query";
import { fetchPublicGroups } from "../../api/groups";

interface UsePublicGroupsParams {
  userId?: string;
  authToken?: string;  
}

export const usePublicGroups = ({userId, authToken}: UsePublicGroupsParams) => {
  return useQuery({
    queryKey: ["public_groups", userId],
    queryFn: () => fetchPublicGroups(authToken),
    staleTime: 5 * 60 * 1000
  });
};
