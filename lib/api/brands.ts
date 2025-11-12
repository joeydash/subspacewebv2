import { apiClient } from "@/config/axios-client";


export interface Brand {
  id: string;
  service_name: string;
  image_url?: string;
  poster2_url?: string;
  poster2_blurhash?: string;
  backdrop_url?: string;
  backdrop_blurhash?: string;
  blurhash?: string;
  flexipay?: boolean;
  flexipay_discount?: number;
  flexipay_min?: number;
  whatsub_class?: {
    name: string;
    icon?: string;
    rank?: number;
  };
  whatsub_plans?: {
    price: number;
    discounted_price: number;
  }[];
}

export const fetchBrands = async ({authToken}: {authToken: string}) => {
  const response = await apiClient.post(
    '', 
    {
      query: `
        query GetProducts {
          __typename
          getProducts: whatsub_services(
            where: {
              _or: [
                {flexipay: {_eq: true}},
                {whatsub_plans: {whatsub_coupon_availability: {count: {_gt: "0"}}}}
              ]
            },
            order_by: {playstore_number_of_ratings: desc_nulls_last}
          ) {
            __typename
            id
            service_name
            whatsub_class {
              __typename
              name
              icon
              rank
            }
            image_url
            poster2_url
            poster2_blurhash
            backdrop_url
            backdrop_blurhash
            blurhash
            flexipay
            flexipay_discount
            flexipay_min
            whatsub_plans(
              where: {whatsub_coupon_availability: {count: {_gt: "0"}}},
              order_by: {discounted_price: asc},
              limit: 1
            ) {
              __typename
              price
              discounted_price
            }
          }
        }
      `
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  const fetchedBrands: Brand[] = response.data?.data?.getProducts || [];

  // Extract unique categories
  const uniqueCategories = new Set(['All']);
  fetchedBrands.forEach((brand) => {
    if (brand.whatsub_class?.name) {
      uniqueCategories.add(brand.whatsub_class.name);
    }
  });

  return { brands: fetchedBrands, categories: Array.from(uniqueCategories) };
};


interface FavouriteBrand {
  brand_id?: string;
  whatsub_service?: {
    image_url?: string;
    blurhash?: string;
    discount_text?: string;
  };
}

interface FetchFavouriteBrandsParams {
  isAuthenticated: boolean;
  user?: {
    id?: string;
    auth_token?: string;
  };
}

export const fetchFavouriteBrands = async ({
  isAuthenticated,
  user,
}: FetchFavouriteBrandsParams): Promise<FavouriteBrand[]> => {
  let query: string;
  let variables: Record<string, any> = {};

  if (isAuthenticated) {
    query = `
      query getFavouriteBrands($user_id: uuid!) {
        w_getFavouriteBrands(request: {user_id: $user_id}) {
          whatsub_favourite_brands
        }
      }
    `;
    variables = { user_id: user?.id };
  } else {
    query = `
      query getFavouriteBrands {
        whatsub_favourite_brands(order_by: {rank: asc}, limit: 100) {
          brand_id
          whatsub_service {
            image_url
            blurhash
            discount_text
          }
        }
      }
    `;
  }

  const response = await apiClient.post(
    "https://db.subspace.money/v1/graphql",
    {
      query,
      variables,
    },
    {
      headers: {
        Authorization: user?.auth_token ? `Bearer ${user.auth_token}` : "",
      },
    }
  );

  const data = response.data?.data;

  return isAuthenticated
    ? data?.w_getFavouriteBrands?.whatsub_favourite_brands || []
    : data?.whatsub_favourite_brands || [];
};


interface BrandCategory {
  name: string;
  poster: string;
  service_count: number;
  service_images: string[];
}

export const fetchBrandCategories = async (authToken?: string): Promise<BrandCategory[]> => {
  const query = `
    query getBrandCategories {
      whatsub_class(where: {service_count: {_neq: 0}}, order_by: {rank: asc}) {
        name
        poster
        service_count
        service_images
      }
    }
  `;

  const response = await apiClient.post(
    "https://db.subspace.money/v1/graphql",
    { query },
    {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    }
  );

  return response.data?.data?.whatsub_class || [];
};

