export interface HelpWidgetData {
  title: string;
  details: string;
  anim_url: string;
  type: string;
  data: any;
}

export const fetchHelpWidgetDetails = async (authToken: string, key: string = 'mailbox'): Promise<HelpWidgetData> => {
  const response = await fetch('https://db.subspace.money/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      query: `
        query GetHelpWidgetDetails($key: String) {
          __typename
          whatsub_help_widget(where: { key: { _eq: $key } }) {
            __typename
            title
            details
            anim_url
            type
            data
          }
        }
      `,
      variables: {
        key
      }
    })
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error('Failed to fetch mailbox details');
  }

  const widgetData = data.data?.whatsub_help_widget?.[0];
  if (!widgetData) {
    throw new Error('No mailbox data found');
  }

  return widgetData;
};
