export const handleSupportChat = async (userId: string, authToken: string) => {
	if (!userId || !authToken) {
		console.log('User not logged in');
		return;
	}

	try {
		const response = await fetch('https://db.subspace.money/v1/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${authToken}`
			},
			body: JSON.stringify({
				query: `
            mutation createPrivateRoom($user_id: uuid!, $other_id: uuid!) {
              __typename
              createPrivateRoom(request: {other_id: $other_id, user_id: $user_id}) {
                __typename
                id
              }
            }
          `,
				variables: {
					user_id: userId,
					other_id: 'bcd435e5-7a58-4790-a01e-d6660dbaf3d3'
				}
			})
		});

		const data = await response.json();

		if (data.errors) {
			console.error('Error creating support chat:', data.errors);
			// showError('Failed to start chat with support');
			return;
		}

		const roomId = data.data?.createPrivateRoom?.id;

		return roomId;
	} catch (e) {
		console.log('Failed to create chat room ', e);
	}
}