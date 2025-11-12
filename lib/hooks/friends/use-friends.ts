import { useQuery } from "@tanstack/react-query";
import { fetchFriends } from "../../api/friends";

interface UseFriendsParams {
  userId: string;
  authToken: string;
}

export const useFriends = ({ userId, authToken }: UseFriendsParams) => {
  return useQuery({
    queryKey: ["friends", userId],
    queryFn: () => fetchFriends({ userId, authToken }),
    enabled: !!userId && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
