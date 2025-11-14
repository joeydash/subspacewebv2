import { apiClient } from "@/config/axios-client";

export interface PrivacySettings {
	hide_phone_number: boolean;
	hide_email_id: boolean;
}

interface FetchPrivacySettingsParams {
	authToken: string;
	userId: string;
}

export const fetchPrivacySettings = async ({
	authToken,
	userId
}: FetchPrivacySettingsParams): Promise<PrivacySettings> => {
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

export interface SharedSubscription {
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
			query getWhatsubUserSubscriptions($user_id: uuid, $limit: Int, $offset: Int) {
			whatsub_users_subscription(where: {user_id: {_eq: $user_id}, status: {_eq: "active"}}, order_by: {created_at: desc}, limit: $limit, offset: $offset) {
				id
				service_name
				service_image_url
				blurhash
				plan
				is_public
				whatsub_service {
					whatsub_class {
						name
					}
				}
			}
			}
	`;

	const variables = { user_id: userId, limit: 50, offset: 0 };

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
		throw new Error('Failed to load subscriptions');
	}

	return data.data?.whatsub_users_subscription || [];
};

export interface SubscriptionRoom {
	id: string;
	status: string;
	is_public: boolean;
	name: string;
	room_dp: string;
	blurhash: string;
}

interface FetchSubscriptionRoomsParams {
	userId: string;
	authToken: string;
	limit?: number;
	offset?: number;
}

export const fetchSubscriptionRooms = async ({ userId, authToken, limit = 50, offset = 0 }: FetchSubscriptionRoomsParams): Promise<SubscriptionRoom[]> => {
	const query = `
		query MyQuery($user_id: uuid, $limit: Int, $offset: Int) {
			whatsub_rooms(
				where: { user_id: { _eq: $user_id }, status: { _eq: "active" }, type: { _eq: "group" } },
				order_by: { created_at: desc },
				limit: $limit,
				offset: $offset
			) {
				id
				status
				is_public
				name
				room_dp
				blurhash
			}
		}
	`;

	const variables = { user_id: userId, limit, offset };

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
		throw new Error('Failed to load subscription groups');
	}

	return data.data?.whatsub_rooms || [];
};

export interface PublicGroupSettings {
	is_public: boolean;
}

interface FetchPublicGroupSettingsParams {
	userId: string;
	authToken: string;
}

export const fetchPublicGroupSettings = async ({ userId, authToken }: FetchPublicGroupSettingsParams): Promise<PublicGroupSettings> => {
	const query = `
		query Query($user_id: uuid) {
			whatsub_store_public_groups(where: {user_id: {_eq: $user_id}}) {
				is_public
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

	if (data.errors) {
		throw new Error('Failed to load public group settings');
	}

	const settings = data.data?.whatsub_store_public_groups?.[0];
	return { is_public: settings?.is_public ?? false };
};

interface UpdateSubscriptionPublicStatusParams {
	subscriptionId: string;
	authToken: string;
	isPublic: boolean;
}

export const updateSharedSubscriptionPublicStatus = async ({
	subscriptionId,
	authToken,
	isPublic
}: UpdateSubscriptionPublicStatusParams): Promise<boolean> => {
	const query = `	
			mutation Mutation($sub_id: uuid, $is_public: Boolean) {
				update_whatsub_users_subscription(where: {id: {_eq: $sub_id}}, _set: {is_public: $is_public}) {
					affected_rows
				}
			}
	`;

	const variables = {
		sub_id: subscriptionId,
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

interface UpdateRoomPublicStatusParams {
	roomId: string;
	authToken: string;
	isPublic: boolean;
}

export const updateRoomPublicStatus = async ({
	roomId,
	authToken,
	isPublic
}: UpdateRoomPublicStatusParams): Promise<boolean> => {
	const query = `
		mutation UpdateRoom($room_id: uuid, $is_public: Boolean) {
			update_whatsub_rooms(where: {id: {_eq: $room_id}}, _set: {is_public: $is_public}) {
				affected_rows
			}
		}
	`;

	const variables = {
		room_id: roomId,
		is_public: isPublic,
	};

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
		throw new Error('Failed to update room public status');
	}

	return data.data?.update_whatsub_rooms?.affected_rows > 0;
};

interface UpdatePublicGroupSettingsParams {
	userId: string;
	authToken: string;
	isPublic: boolean;
}

export const updatePublicGroupSettings = async ({
	userId,
	authToken,
	isPublic
}: UpdatePublicGroupSettingsParams
): Promise<boolean> => {
	const queryName = isPublic ? 'w_publicAllGroups' : 'w_unpublicAllGroups';
	const query = `
		mutation publicAllGroups($user_id: uuid!) {
			${queryName}(request: {user_id: $user_id}) {
				affected_rows
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

	if (data.errors) {
		throw new Error('Failed to update public group settings');
	}

	let result;

	if (isPublic) {
		result = data.data?.w_publicAllGroups;
	} else {
		result = data.data?.w_unpublicAllGroups;
	}

	return result?.affected_rows > 0;
};


export interface NotificationSettings {
	message: boolean;
	coupon_expiry: boolean;
	subscription_expiry: boolean;
	promotional: boolean;
}

interface FetchNotificationSettingsParams {
	authToken: string;
	userId: string;
	signal?: AbortSignal;
}

export const fetchNotificationSettings = async ({
	authToken,
	userId,
	signal
}: FetchNotificationSettingsParams): Promise<NotificationSettings> => {
	const query = `
		query getNotificationSettings($user_id: uuid) {
			whatsub_notification_settings(where: {user_id: {_eq: $user_id}}) {
				message
				coupon_expiry
				subscription_expiry
				promotional
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
			signal
		}
	);

	if (data.errors) {
		throw new Error('Failed to load notification settings. Please try again.');
	}

	return data.data?.whatsub_notification_settings?.[0];
};



interface UpdateNotificationSettingsParams {
	authToken: string;
	userId: string;
	settings: NotificationSettings;
}

export const updateNotificationSettings = async ({
	authToken,
	userId,
	settings
}: UpdateNotificationSettingsParams): Promise<boolean> => {
	const query = `
		mutation UpdateNotificationSettings(
			$user_id: uuid!,
			$message: Boolean,
			$coupon_expiry: Boolean,
			$promotional: Boolean,
			$subscription_expiry: Boolean
		) {
			insert_whatsub_notification_settings(
				objects: {
					user_id: $user_id,
					message: $message,
					coupon_expiry: $coupon_expiry,
					promotional: $promotional,
					subscription_expiry: $subscription_expiry
				},
				on_conflict: {
					constraint: whatsub_notification_settings_user_id_key,
					update_columns: [message, coupon_expiry, promotional, subscription_expiry]
				}
			) {
				affected_rows
			}
		}
	`;

	const variables = {
		user_id: userId,
		message: settings.message,
		coupon_expiry: settings.coupon_expiry,
		promotional: settings.promotional,
		subscription_expiry: settings.subscription_expiry
	};

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
		throw new Error('Error updating notification settings');
	}

	return data.data?.insert_whatsub_notification_settings?.affected_rows > 0;
};

export interface QuickReply {
	id: string;
	message: string;
	shortcut: string;
}

interface FetchQuickRepliesParams {
	authToken: string;
	userId: string;
}

export const fetchQuickReplies = async ({
	authToken,
	userId
}: FetchQuickRepliesParams): Promise<QuickReply[]> => {
	const query = `
		query getQuickReply($user_id: uuid) {
			whatsub_quick_reply(where: {user_id: {_eq: $user_id}}) {
			    id
				message
				shortcut
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
		throw new Error('Failed to load quick replies. Please try again.');
	}

	return data.data?.whatsub_quick_reply || [];
};

interface DeleteQuickReplyParams {
	authToken: string;
	userId: string;
	quickReplyId: string;
}

export const deleteQuickReply = async ({ authToken, userId, quickReplyId }: DeleteQuickReplyParams): Promise<boolean> => {
	const query = `
		mutation deleteQuickReply($user_id: uuid, $quickReplyId: uuid) {
			delete_whatsub_quick_reply(where: {user_id: {_eq: $user_id}, id: {_eq: $quickReplyId}}) {
				affected_rows
			}
		}
	`;

	const variables = {
		user_id: userId,
		quickReplyId: quickReplyId
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
		throw new Error('Failed to delete quick reply');
	}

	return data.data?.delete_whatsub_quick_reply?.affected_rows > 0;
};

interface CreateQuickReplyParams {
	authToken: string;
	userId: string;
	shortcut: string;
	message: string;
}

export const createQuickReply = async ({ authToken, userId, shortcut, message }: CreateQuickReplyParams): Promise<boolean> => {
	const query = `
		mutation addQuickReply($user_id: uuid, $message: String, $shortcut: String) {
			insert_whatsub_quick_reply_one(object: {user_id: $user_id, message: $message, shortcut: $shortcut}, on_conflict: {constraint: whatsub_quick_reply_user_id_shortcut_key, update_columns: [message]}) {
				user_id
			}
		}
	`;

	const variables = {
		user_id: userId,
		message: message,
		shortcut: shortcut
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
		throw new Error(data.errors[0]?.message || 'Failed to save quick reply');
	}

	return !!data.data?.insert_whatsub_quick_reply_one?.user_id;
};
