import {useQuery} from "@tanstack/react-query";
import {fetchUnreadChatsCount} from "../../api/chat";

export const UNREAD_CHATS_COUNT_BASE_KEY = "unread_chats";

export const useUnreadChatsCount = ({userId, authToken}) => {
  return useQuery({
    queryKey: [UNREAD_CHATS_COUNT_BASE_KEY, userId],
    queryFn: () => fetchUnreadChatsCount({userId, authToken}),
    enabled: !!userId && !!authToken,
    staleTime: 5 * 60 * 1000 
  });
};