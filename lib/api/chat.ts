import { apiClient } from "@/config/axios-client"; 


import axios from '@/lib/axios'; // adjust the path to your global axios instance

interface FetchUnreadChatsCountParams {
  userId: string;
  authToken: string;
}

interface UnreadChatsCountData {
  whatsub_room_user_mapping_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export const fetchUnreadChatsCount = async ({userId, authToken}: FetchUnreadChatsCountParams): Promise<number> => {
  const response = await apiClient.post(
    '',
    {
      query: `
        query UnreadChatsCount($user_id: uuid) {
          whatsub_room_user_mapping_aggregate(
            where: {
              user_id: {_eq: $user_id},
              unseen_message_count: {_gt: 0},
              whatsub_room: {status: {_eq: "active"}}
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: {
        user_id: userId
      }
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  const data = response.data;

  if (data.errors) {
    console.error('Error fetching unread chats count:', data.errors);
    throw new Error(data.errors[0].message);
  }

  const result = data.data as UnreadChatsCountData;
  return result.whatsub_room_user_mapping_aggregate.aggregate.count;
};