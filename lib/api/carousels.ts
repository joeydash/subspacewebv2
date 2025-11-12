import { apiClient } from "@/config/axios-client"; // adjust import path as needed

interface User {
  id: string;
  auth_token: string;
}

interface FetchCarouselsParams {
  isAuthenticated: boolean;
  user: User;
}

export const fetchCarousels = async ({ isAuthenticated, user }: FetchCarouselsParams) => {
  let query;
  let variables = {};

  if (isAuthenticated) {
    query = `
      query GetCarousals($user_id: uuid = "") {
        whatsubGetCarousals(request: { user_id: $user_id }) {
          type
          blurhash
          image_url
          data
        }
      }
    `;
    variables = { user_id: user?.id || "" };
  } else {
    query = `
      query GetPublicCarousals {
        whatsub_carousals(where: { status: { _eq: true } }) {
          blurhash
          type
          image_url
          data
        }
      }
    `;
  }

  const { data } = await apiClient.post(
    "",
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${user?.auth_token || ""}`,
      },
    }
  );

  return isAuthenticated
    ? data?.data?.whatsubGetCarousals || []
    : data?.data?.whatsub_carousals || [];
};


export const fetchProfileCarousels = async ({ userId, authToken }: { userId: string; authToken: string }) => {
	const query = `
    query GetProfileCarousal($user_id: uuid = "") {
      whatsubGetProfileCarousals(request: { user_id: $user_id }) {
        type
        blurhash
        image_url
        data
      }
    }
  `;

	const variables = { user_id: userId };

	const { data } = await apiClient.post(
		"",
		{ query, variables },
		{
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		}
	);

	return data?.data?.whatsubGetProfileCarousals || [];
};
