import { apiClient } from '@/config/axios-client';

interface Plan {
	id: string;
	plan_name: string;
	price: number;
	discounted_price: number;
	duration: number;
	duration_type: string;
	display_data: any;
	is_plan: boolean;
	service_id: string;
	status: string;
	whatsub_service: {
		service_name: string;
	};
}

interface GetLowestDiscountPlanResponse {
	whatsub_plans: Plan[];
}

export const fetchLowestDiscountPlans = async (): Promise<Plan[]> => {
	const query = `
    query GetLowestDiscountPlan {
      whatsub_plans(
        where: {
          is_plan: { _eq: true }
          status: { _eq: "active" }
          discounted_price: { _neq: 0 }
          duration: { _is_null: false }
          whatsub_coupon_availability: { count: { _gt: 0 } }
        }
        order_by: { discounted_price: asc }
      ) {
        id
        plan_name
        price
        discounted_price
        duration
        duration_type
        display_data
        is_plan
        service_id
        status
        whatsub_service {
          service_name
        }
      }
    }
  `;

	const response = await apiClient.post<GetLowestDiscountPlanResponse>('', {
		query,
	});

	return response.data.data.whatsub_plans;
};



export const fetchPlanDetails = async ({
  planId,
  authToken,
}: {
  planId: string;
  authToken?: string;
}) => {
  if (!planId) return null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const { data } = await apiClient.post(
    '',
    {
      query: `
        query GetPlanDetails($plan_id: uuid) {
          __typename
          whatsub_plans(where: {id: {_eq: $plan_id}}) {
            __typename
            plan_name
            whatsub_service {
              __typename
              service_name
              image_url
            }
          }
        }
      `,
      variables: { plan_id: planId },
    },
    { headers }
  );

  if (data.errors) throw new Error('Failed to fetch plan details');

  const plan = data.data?.whatsub_plans?.[0];
  if (!plan) return null;

  return {
    plan_name: plan.plan_name,
    service_name: plan.whatsub_service.service_name,
    service_image_url: plan.whatsub_service.image_url,
  };
};
