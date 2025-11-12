import { apiClient } from "@/config/axios-client";

export interface PrivacySettings {
	hide_phone_number: boolean;
	hide_email_id: boolean;
}

interface FetchPrivacySettingsParams {
	authToken: string;
	userId: string;
}

export const fetchPrivacySettings = async ({ authToken, userId }: FetchPrivacySettingsParams): Promise<PrivacySettings> => {
	const query = `
		query Query($user_id: uuid) {
		whatsub_privacy_settings(where: {user_id: {_eq: $user_id}}) {
			hide_phone_number
			hide_email_id
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
			}
		}
	);

	if (data.errors) {
		throw new Error('Failed to load privacy settings. Please try again.');
	}

	if (data.data?.whatsub_privacy_settings?.[0]) {
		return data.data.whatsub_privacy_settings[0];
	}

	// Return default values if no settings found
	return {
		hide_phone_number: false,
		hide_email_id: false
	};
};

export const updatePrivacySettings = async (
	authToken: string,
	userId: string,
	hidePhoneNumber: boolean,
	hideEmailId: boolean
): Promise<boolean> => {
	const query = `
    mutation UpdatePrivacySettings($user_id: uuid!, $hide_phone_number: Boolean, $hide_email_id: Boolean) {
      insert_whatsub_privacy_settings(
        objects: {
          user_id: $user_id, 
          hide_phone_number: $hide_phone_number, 
          hide_email_id: $hide_email_id
        },
        on_conflict: {
          constraint: whatsub_privacy_settings_user_id_key,
          update_columns: [hide_phone_number, hide_email_id]
        }
      ) {
        affected_rows
      }
    }
  `;

	const variables = {
		user_id: userId,
		hide_phone_number: hidePhoneNumber,
		hide_email_id: hideEmailId
	};

	const { data } = await apiClient.post(
		"",
		{ query, variables },
		{
			headers: {
				Authorization: `Bearer ${authToken}`,
			}
		}
	);

	if (data.errors) {
		throw new Error('Failed to update privacy settings');
	}

	return data.data?.insert_whatsub_privacy_settings?.affected_rows > 0;
};

interface SharedSubscription {
	id: string;
	service_name: string;
	service_image_url: string;
	blurhash: string;
	plan: string;
	is_public: boolean;
	whatsub_service: {
		__typename: string;
		whatsub_class: {
			__typename: string;
			name: string;
		};
	};
}

interface FetchSharedSubscriptionsParams {
	userId: string;
	authToken: string;
}

export const fetchSharedSubscriptions = async ({
	userId,
	authToken
}: FetchSharedSubscriptionsParams): Promise<SharedSubscription[]> => {
	const query = `
		query GetActiveUserSubscriptions($user_id: uuid, $limit: Int, $offset: Int) {
			whatsub_users_subscription(
				where: {
					user_id: { _eq: $user_id }
					status: { _eq: "active" }
				}
				order_by: { created_at: desc }
				limit: $limit
				offset: $offset
			) {
				id
				service_name
				service_image_url
				blurhash
				plan
				is_public
				whatsub_service {
					__typename
					whatsub_class {
						__typename
						name
					}
				}
			}
		}
	`;

	const variables = { user_id: userId, limit: 50,offset: 0 };

	const { data } = await apiClient.post(
		"",
		{ query, variables },
		{
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		}
	);

	console.log('data, ', data);
	if (data.errors) {
		throw new Error('Failed to load subscriptions');
	}

	return data.data?.whatsub_users_subscription || [];
};

interface UpdateSubscriptionPublicStatusParams {
	subscriptionId: string;
	userId: string;
	authToken: string;
	isPublic: boolean;
}

export const updateSubscriptionPublicStatus = async ({
	subscriptionId,
	userId,
	authToken,
	isPublic
}: UpdateSubscriptionPublicStatusParams): Promise<boolean> => {
	const query = `
		mutation MyMutation($subscription_id: uuid = "", $user_id: uuid = "", $is_public: Boolean = true) {
			update_whatsub_users_subscriptions(
				where: {
					subscription_id: {_eq: $subscription_id}
					user_id: {_eq: $user_id}
				}
				_set: {is_public: $is_public}
			) {
				affected_rows
			}
		}
	`;

	const variables = {
		subscription_id: subscriptionId,
		user_id: userId,
		is_public: isPublic
	};

	const { data } = await apiClient.post(
		"",
		{ query, variables },
		{
			headers: {
				Authorization: `Bearer ${authToken}`,
			}
		}
	);

	if (data.errors) {
		throw new Error('Failed to update subscription');
	}

	return data.data?.update_whatsub_users_subscriptions?.affected_rows > 0;
};
