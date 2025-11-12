import { useQuery } from '@tanstack/react-query';
import {fetchPlanDetails} from '../../api/plans';


export const usePlanDetails = ({planId, authToken}: {planId?: string, authToken?: string}) => {
  return useQuery({
    queryKey: ['planDetails', planId],
    queryFn: () => fetchPlanDetails({ planId: planId, authToken }),
    enabled: !!planId,
  });
};
