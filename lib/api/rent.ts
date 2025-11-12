import { apiClient } from "@/config/axios-client";

interface FetchRentPriceParams {
	user_id: string;
	product_location_id: string;
	start_time: string;
	end_time: string;
	auth_token?: string;
}

export const fetchRentPrice = async (params: FetchRentPriceParams) => {
	const { user_id, product_location_id, start_time, end_time, auth_token } = params;

	const mutation = `
    mutation GetSubscriptionPrice(
      $user_id: uuid!,
      $product_location_id: String!,
      $start_time: timestamptz!,
      $end_time: timestamptz!
    ) {
      getSubscriptionPrice(
        request: {
          user_id: $user_id,
          product_location_id: $product_location_id,
          start_time: $start_time,
          end_time: $end_time
        }
      ) {
        data
      }
    }
  `;

	const variables = { user_id, product_location_id, start_time, end_time };

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (auth_token) headers["Authorization"] = `Bearer ${auth_token}`;

	const { data } = await apiClient.post("", { query: mutation, variables }, { headers });

	if (data.errors) {
		throw new Error(data.errors.map((e: any) => e.message).join(", "));
	}

	return data.data.getSubscriptionPrice.data;
};


export const fetchRentProducts = async ({ serviceId, user, address }) => {
	if (!serviceId) return [];

	const { latitude, longitude } = address;
	if (!latitude || !longitude) return [];

	const query = `
    mutation GetSubscriptionProducts(
      $latitude: String!,
      $longitude: String!,
      $user_id: uuid,
      $service_id: uuid!
    ) {
      getSubscriptionProducts(
        request: {
          latitude: $latitude,
          longitude: $longitude,
          user_id: $user_id,
          service_id: $service_id
        }
      ) {
        whatsub_subscription_products
      }
    }
  `;

	const variables = {
		latitude,
		longitude,
		user_id: user?.id || "",
		service_id: serviceId,
	};

	const { data } = await apiClient.post(
		"",
		{ query, variables },
		{
			headers: {
				Authorization: `Bearer ${user?.auth_token || ""}`,
			},
		}
	);

	return data?.data?.getSubscriptionProducts?.whatsub_subscription_products || [];
};

interface RentProductParams {
	address_id: string;
	user_id: string;
	product_id: string;
	product_location_id: string;
	start_time: string;
	end_time: string;
	auth_token?: string;
}

interface RentProductResponse {
	message: string;
	affected_rows: number;
	details: any;
	data: any;
}

export const rentProduct = async (params: RentProductParams): Promise<RentProductResponse> => {
	const { address_id, user_id, product_id, product_location_id, start_time, end_time, auth_token } = params;

	const mutation = `
    mutation RentProduct(
      $address_id: uuid!,
      $user_id: uuid!,
      $product_id: uuid!,
      $product_location_id: uuid!,
      $start_time: timestamptz!,
      $end_time: timestamptz!
    ) {
      rentProduct(request: {
        address_id: $address_id,
        user_id: $user_id,
        product_id: $product_id,
        product_location_id: $product_location_id,
        start_time: $start_time,
        end_time: $end_time
      }) {
        message
        affected_rows
        details
        data
      }
    }
  `;

	const variables = { address_id, user_id, product_id,product_location_id, start_time, end_time };

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (auth_token) headers["Authorization"] = `Bearer ${auth_token}`;

	const { data } = await apiClient.post("", { query: mutation, variables }, { headers });

	if (data.errors) {
		throw new Error(data.errors.map((e: any) => e.message).join(", "));
	}


	return data.data.rentProduct;
};

interface RentalHistoryParams {
	user_id: string;
	auth_token?: string;
}

export interface RentalHistoryItem {
	id: string;
	start_time: string;
	end_time: string;
	quantity: number;
	total_price: number;
	whatsub_addresses: {
		name: string;
		full_address: string;
		contact_number: string;
		type: string;
		fhb_name: string;
		nearby_landmark: string;
		floor: string;
	};
	whatsub_subscription_product_location: {
		whatsub_subscription_product: {
			product_name: string;
			product_description: string;
			product_photos: string[];
		};
	};
}

export const fetchRentalHistory = async (params: RentalHistoryParams): Promise<RentalHistoryItem[]> => {
	const { userId, authToken } = params;

	const query = `
    query GetUserSubscriptionMappings($userId: uuid!) {
      whatsub_subscription_product_location_user_mapping(
        where: { user_id: { _eq: $userId } }
      ) {
        id
        start_time
        end_time
        quantity
        total_price
        created_at
        whatsub_addresses {
          name
          full_address
          contact_number
          type
          fhb_name
          nearby_landmark
          floor
        }

        whatsub_subscription_product_location {
          whatsub_subscription_product {
            product_name
            product_description
            product_photos
          }
        }
      }
    }
  `;

	const variables = { userId: userId };

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

	const { data } = await apiClient.post("", { query, variables }, { headers });

	if (data.errors) {
		throw new Error(data.errors.map((e: any) => e.message).join(", "));
	}

	return data.data.whatsub_subscription_product_location_user_mapping;
};


export interface RentProductClass {
	class_id: string;
	class_name: string;
	poster: string;
	services_preview: any[];
	total_services_count: number;
}

interface FetchRentProductClassesParams {
	authToken: string;
	userId: string;
	address: { latitude: string; longitude: string };
}

export const fetchRentProductClasses = async ({
	authToken,
	userId,
	address,
}: FetchRentProductClassesParams): Promise<RentProductClass[]> => {
	if (!address?.latitude || !address?.longitude) return [];

	const response = await apiClient.post(
		'',
		{
			query: `
        mutation GetSubscriptionProductClasses(
          $latitude: String!,
          $longitude: String!,
          $user_id: uuid!
        ) {
          getSubscriptionProductClasses(
            request: {
              latitude: $latitude,
              longitude: $longitude,
              user_id: $user_id
            }
          ) {
            whatsub_subscription_product_classes
          }
        }
      `,
			variables: {
				latitude: address.latitude,
				longitude: address.longitude,
				user_id: userId || ""
			}
		},
		{
			headers: { Authorization: `Bearer ${authToken || ""}` }
		}
	);

	const rawClasses =
		response.data?.data?.getSubscriptionProductClasses?.whatsub_subscription_product_classes || [];

	return rawClasses.map((item: any) => ({
		class_id: item.class_id,
		class_name: item.class_name,
		poster: item.poster || '',
		services_preview: item.services_preview || [],
		total_services_count: item.total_services_count || 0
	}));
};


export interface Address {
	latitude: string;
	longitude: string;
}

export interface RentBrand {
	id: string;
	service_name: string;
	image_url?: string;
	poster2_url?: string;
	poster2_blurhash?: string;
	backdrop_url?: string;
	backdrop_blurhash?: string;
	blurhash?: string;
	flexipay?: string;
	flexipay_discount?: string;
	flexipay_min?: string;
	class?: string;
	class_id?: string;
}

export interface FetchSubscriptionBrandsParams {
	authToken: string;
	userId: string;
	address: Address;
}

export const fetchSubscriptionBrands = async ({
	authToken,
	userId,
	address,
}: FetchSubscriptionBrandsParams): Promise<{ brands: RentBrand[]; categories: string[] }> => {
	if (!address?.latitude || !address?.longitude) {
		return { brands: [], categories: ['All'] };
	}

	const response = await apiClient.post(
		'',
		{
			query: `
				query GetSubscriptionBrands(
					$latitude: String!,
					$longitude: String!,
					$user_id: uuid
				) {
					getSubscriptionBrands(
						request: {
							latitude: $latitude,
							longitude: $longitude,
							user_id: $user_id
						}
					) {
						whatsub_subscription_brands
					}
				}
			`,
			variables: {
				latitude: address.latitude,
				longitude: address.longitude,
				user_id: userId || "",
			},
		},
		{
			headers: {
				Authorization: `Bearer ${authToken || ""}`,
			},
		}
	);

	const fetchedBrands: RentBrand[] = 
		response.data?.data?.getSubscriptionBrands?.whatsub_subscription_brands || [];

	// Extract unique categories
	const uniqueCategories = new Set(['All']);
	fetchedBrands.forEach((brand) => {
		if (brand.class) {
			uniqueCategories.add(brand.class);
		}
	});

	return { brands: fetchedBrands, categories: Array.from(uniqueCategories) };
};

export interface FetchRentProductBrandsParams {
	authToken: string;
	userId: string;
	classId: string;
	address: Address;
}

export const fetchRentProductBrands = async ({
	authToken,
	userId,
	classId,
	address,
}: FetchRentProductBrandsParams): Promise<any[]> => {
	if (!classId || !address?.latitude || !address?.longitude) return [];

	const response = await apiClient.post(
		'',
		{
			query: `
       mutation GetSubscriptionProductServices(
              $latitude: String!,
              $longitude: String!,
              $user_id: uuid,
              $class_id: uuid!
            ) {
              getSubscriptionProductServices(
                request: {
                  latitude: $latitude,
                  longitude: $longitude,
                  user_id: $user_id,
                  class_id: $class_id
                }
              ) {
                whatsub_subscription_product_services
              }
            }
      `,
			variables: {
				latitude: address.latitude,
				longitude: address.longitude,
				user_id: userId || "",
				class_id: classId,
			},
		},
		{
			headers: {
				Authorization: `Bearer ${authToken || ""}`,
			},
		}
	);

	return (
		response.data?.data?.getSubscriptionProductServices?.whatsub_subscription_product_services || []
	);
};
