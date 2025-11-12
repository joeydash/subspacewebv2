import { useQuery } from '@tanstack/react-query';
import {fetchGroups} from "../../api/groups";


export const useGroups = ({planId, authToken}: {planId: string, authToken: string | undefined}) => {
  return useQuery({
    queryKey: ['groups', planId],
    queryFn: () => fetchGroups({planId, authToken}),
    enabled: !!planId, // only fetch if planId exists
  });
};
