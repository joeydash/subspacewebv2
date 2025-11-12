import { apiClient } from "@/config/axios-client";

export interface Blog {
  id: string;
  title: string;
  section_title: string;
  image_url: string;
  blurhash: string;
  url: string;
  created_at: string;
}

export interface Category {
  title: string;
}

export interface BlogsAndCategoriesData {
  blogs: Blog[];
  categories: Category[];
}

interface FetchBlogsAndCategoriesParams {
  authToken: string;
  courseId: string;
  categoryTitle?: string;
}

export const fetchBlogsAndCategories = async ({
  authToken,
  courseId,
  categoryTitle = '',
}: FetchBlogsAndCategoriesParams): Promise<BlogsAndCategoriesData> => {
  const query = `
    query getSections($id: uuid!, $title: String!) {
      __typename
      getSections(request: { id: $id, title: $title }) {
        __typename
        blurhash
        created_at
        id
        image_url
        section_title
        title
        url
      }
      getSectionClasses(request: { id: $id }) {
        __typename
        title
      }
    }
  `;

  const { data } = await apiClient.post(
    "",
    {
      query,
      variables: {
        id: courseId,
        title: categoryTitle,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (data.errors) {
    throw new Error(
      data.errors.map((e: { message: string }) => e.message).join(", ")
    );
  }

  return {
    blogs: data.data?.getSections || [],
    categories: data.data?.getSectionClasses || [],
  };
};
