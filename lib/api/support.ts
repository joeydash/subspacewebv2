export interface SupportTopic {
  id: string;
  title: string;
  url: string;
}

export interface SupportSection {
  title: string;
  coursex_topics: SupportTopic[];
}

export interface SupportData {
  sections: SupportSection[];
}

export const fetchSupportData = async (
  authToken: string,
  userId: string,
  query: string = 'help'
): Promise<SupportSection[]> => {
  const response = await fetch('https://db.subspace.money/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      query: `
        query MyQuery($query: String!, $user_id: uuid!) {
          __typename
          w_supportSearch(request: { query: $query, user_id: $user_id }) {
            __typename
            sections
          }
        }
      `,
      variables: {
        query: query || 'help',
        user_id: userId
      }
    })
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error('Failed to fetch support data');
  }

  const sections = data.data?.w_supportSearch?.sections;
  if (!sections) {
    throw new Error('No support data found');
  }

  return sections;
};
