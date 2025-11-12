import { apiClient } from "@/config/axios-client";


export const fetchSearchResults = async ({
	searchQuery,
	user,
	suggestionId,
	suggestionIndex,
	location,
}: {
	searchQuery: string;
	user?: { id?: string; auth_token?: string };
	suggestionId: string;
	suggestionIndex?: string;
	location: { latitude: string; longitude: string };
}) => {
	if (!searchQuery.trim()) return null;

	const response = await apiClient.post(
		"",
		{
			query: `
        query MyQuery(
          $searchString: String = ""
          $user_id: uuid = ""
          $uuid: uuid
          $index: String
          $latitude: String!
          $longitude: String!
          $service_id: uuid!
        ) {
          w_getSearchResultV6(
            request: {
              query: $searchString
              user_id: $user_id
              uuid: $uuid
              index: $index
              latitude: $latitude
              longitude: $longitude
              service_id: $service_id
            }
          ) {
            shows_and_movies
            services
            shared_subscriptions
            shop_products
            subscription_products
          }
        }
      `,
			variables: {
				searchString: searchQuery,
				user_id: user?.id || "",
				uuid: suggestionId,
				index: suggestionIndex || "service",
				service_id: suggestionId,
				latitude: location.latitude,
				longitude: location.longitude,
			},
		},
		{
			headers: {
				Authorization: `Bearer ${user?.auth_token || ""}`,
			},
		}
	);

	if (response.data.errors) {
		throw new Error("Failed to fetch search results");
	}

	return (
		response.data.data?.w_getSearchResultV6 || {
			shows_and_movies: [],
			services: [],
			shared_subscriptions: [],
			shop_products: [],
			subscription_products: [],
		}
	);
};
