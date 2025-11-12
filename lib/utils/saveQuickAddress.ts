export const saveQuickAddress = async (user) => {
	try {
		const addressStr = localStorage.getItem('address');
		if (!addressStr) {
			console.warn('saveQuickAddess: no address found in localStorage (key: "address")');
			return null;
		}

		let address;
		try {
			address = JSON.parse(addressStr);
		} catch (err) {
			console.error('saveQuickAddess: failed to parse address from localStorage', err);
			return null;
		}

		const { full_address, latitude, longitude, fhb_name, name: addrName, toSave } = address;
		const name = user?.fullname;

		if (!toSave) {
			console.log('Quick address already saved');
		}

		if (!full_address || !latitude || !longitude) {
			console.warn('saveQuickAddess: address missing required fields:', { full_address, latitude, longitude });
			return null;
		}

		const res = await fetch('https://db.subspace.money/v1/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${user?.auth_token}`,
			},
			body: JSON.stringify({
				query: `mutation InsertQuickAddress(
                  $user_id: uuid!,
                  $name: String!,
                  $full_address: String!,
                  $latitude: String!,
                  $longitude: String!
                ) {
                  insert_whatsub_quick_addresses_one(
                    object: {
                      user_id: $user_id
                      name: $name
                      full_address: $full_address
                      latitude: $latitude
                      longitude: $longitude
                    }
                  ) {
                    id
                    user_id
                    name
                    full_address
                    latitude
                    longitude
                    created_at
                    updated_at
                  }
                }`,
				variables: {
					user_id: user?.id,
					name,
					full_address,
					latitude: String(latitude),
					longitude: String(longitude),
				},
			}),
		});

		const data = await res.json();

		if (!res.ok) {
			console.error('saveQuickAddess: network error', res.status, data);
			return null;
		}
		if (data.errors) {
			console.error('saveQuickAddess: GraphQL errors', data.errors);
			return null;
		}

		localStorage.setItem("address", JSON.stringify({ ...address, toSave: false }))

		console.log('saved quick address');
	} catch (e) {
		console.log('Failed to save quick address:', e.message);
		return null;
	}
};
