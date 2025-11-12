import { useQuery } from "@tanstack/react-query";
import { fetchBlogsAndCategories } from "../../api/blogs";

interface UseBlogsParams {
  authToken: string;
  courseId: string;
  categoryTitle?: string;
}

export const useBlogs = ({ authToken, courseId, categoryTitle = '' }: UseBlogsParams) => {
  return useQuery({
    queryKey: ["blogs", courseId, categoryTitle],
    queryFn: () => fetchBlogsAndCategories({ authToken, courseId, categoryTitle }),
    enabled: !!authToken && !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
