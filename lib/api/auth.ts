import { apiClient } from '@/config/axios-client';

interface UpdateUserLastActiveParams {
	userId: string;
	authToken: string;
}

export const updateUserLastActive = async ({
	userId,
	authToken
}: UpdateUserLastActiveParams): Promise<boolean> => {
	const query = `
    mutation UpdateLastActive($user_id: uuid!, $time: timestamptz!) {
      update_auth(where: { id: { _eq: $user_id } }, _set: { last_active: $time }) {
        affected_rows
      }
    }
  `;

	const variables = { user_id: userId, time: new Date().toISOString() };

	const { data } = await apiClient.post(
		"",
		{ query, variables },
		{
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		}
	);

	if (data.errors) {
		throw new Error('Failed to update last active');
	}

	return data.data?.update_auth?.affected_rows > 0;
};

export default updateUserLastActive;
