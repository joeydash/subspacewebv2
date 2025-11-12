import React, { useState, useEffect, useCallback } from 'react';
import { Package, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Room {
	id: string;
	status: string;
	is_public: boolean;
	name: string;
	room_dp: string;
	blurhash: string;
}

const SharedSubscriptionSettingsComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [publicGroup, setPublicGroup] = useState(false);
	const [isLoadingPublicGroup, setIsLoadingPublicGroup] = useState(false);
	const [rooms, setRooms] = useState<Room[]>([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const [roomsError, setRoomsError] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);

	const fetchPublicGroupSettings = useCallback(async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoadingPublicGroup(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query Query($user_id: uuid) {
              whatsub_store_public_groups(where: {user_id: {_eq: $user_id}}) {
                is_public
              }
            }
          `,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.data?.whatsub_store_public_groups?.[0]) {
				const settings = data.data.whatsub_store_public_groups[0];
				setPublicGroup(settings.is_public || false);
			}
		} catch (error) {
			console.error('Error fetching public group settings:', error);
		} finally {
			setIsLoadingPublicGroup(false);
		}
	}, [user?.id, user?.auth_token]);

	const fetchRooms = useCallback(async (showLoading: boolean) => {
		if (!user?.id || !user?.auth_token) return;

		if (showLoading) {
			setIsLoadingRooms(true);
		}

		setRoomsError(null);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query MyQuery($user_id: uuid, $limit: Int, $offset: Int) {
						whatsub_rooms(
							where: {
							user_id: { _eq: $user_id }
							status: { _eq: "active" }
							type: { _eq: "group" }
							}
							order_by: { created_at: desc }
							limit: $limit
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
					`,
					variables: {
						user_id: user.id,
						limit: 50,
						offset: 0
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error fetching rooms:', data.errors);
				setRoomsError('Failed to load subscription groups');
				return;
			}

			setRooms(data.data?.whatsub_rooms || []);
		} catch (error) {
			console.error('Error fetching rooms:', error);
			setRoomsError('Failed to load subscription groups');
		} finally {
			if (showLoading) {
				setIsLoadingRooms(false);
			}
		}
	}, [user?.id, user?.auth_token]);

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchPublicGroupSettings();
			fetchRooms(true);
		}
	}, [user?.id, user?.auth_token, fetchPublicGroupSettings, fetchRooms]);

	const handleRoomToggle = async (roomId: string, currentIsPublic: boolean) => {
		if (!user?.id || !user?.auth_token) return;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($room_id: uuid = "", $is_public: Boolean = true) {
              __typename
              update_whatsub_rooms(
                where: { id: { _eq: $room_id } }
                _set: { is_public: $is_public }
              ) {
                __typename
                affected_rows
              }
            }
          `,
					variables: {
						room_id: roomId,
						is_public: !currentIsPublic
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error updating room public status:', data.errors);
				return;
			}

			if (data.data?.update_whatsub_rooms?.affected_rows > 0) {
				setRooms(prevRooms =>
					prevRooms.map(room =>
						room.id === roomId
							? { ...room, is_public: !currentIsPublic }
							: room
					)
				);
			}
		} catch (error) {
			console.error('Error updating room public status:', error);
		}
	};

	const handleSharedSubscriptionToggle = () => {
		const newValue = !publicGroup;
		setPublicGroup(newValue);
		updatePublicGroupSetting(newValue);
	};

	const updatePublicGroupSetting = async (value: boolean) => {
		if (!user?.id || !user?.auth_token) return;

		try {
			if (value) {
				const response = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${user.auth_token}`
					},
					body: JSON.stringify({
						query: `
              mutation publicAllGroups($user_id: uuid!) {
                __typename
                w_publicAllGroups(request: {user_id: $user_id}) {
                  __typename
                  affected_rows
                }
              }
            `,
						variables: {
							user_id: user.id
						}
					})
				});

				const data = await response.json();

				if (data.errors) {
					console.error('Error updating public group settings:', data.errors);
					setPublicGroup(!value);
				} else {
					fetchRooms(false);
				}
			} else {
				const response = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${user.auth_token}`
					},
					body: JSON.stringify({
						query: `
              mutation publicAllGroups($user_id: uuid!) {
                __typename
                w_unpublicAllGroups(request: {user_id: $user_id}) {
                  __typename
                  affected_rows
                }
              }
            `,
						variables: {
							user_id: user.id
						}
					})
				});

				const data = await response.json();
				if (data.errors) {
					console.error('Error updating public group settings:', data.errors);
					setPublicGroup(!value);
				} else {
					fetchRooms(false);
				}
			}
		} catch (error) {
			console.error('Error updating public group settings:', error);
			setPublicGroup(!value);
		}
	};

	return (
		<>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
			>
				<div className="flex items-center gap-3">
					<Package className="h-5 w-5 text-gray-400 group-hover:text-white" />
					<span className="font-medium">Shared Subscriptions Settings</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
				) : (
					<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
				)}
			</button>
			{isExpanded && (
				isLoadingPublicGroup || isLoadingRooms ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
						<p className="text-gray-400 mt-2">Loading settings...</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Global Public Group Toggle */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h4 className="font-medium text-white text-base">Toggle All Groups Once</h4>
								<button
									onClick={handleSharedSubscriptionToggle}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${publicGroup ? 'bg-indigo-600' : 'bg-gray-600'}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${publicGroup ? 'translate-x-6' : 'translate-x-1'}`}
									/>
								</button>
							</div>
							<p className="text-sm text-gray-400 mt-3">
								Groups with toggle 'ON' are public and will be shown in the marketplace. Private groups are only visible to members.
							</p>
						</div>

						{/* Individual Rooms */}
						<div>
							<h4 className="font-medium text-white text-base mb-4 flex items-center gap-2">
								<Users className="h-5 w-5 text-indigo-400" />
								Your Subscription Groups ({rooms.length})
							</h4>

							{roomsError ? (
								<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
									<p className="text-red-400 text-sm">{roomsError}</p>
								</div>
							) : rooms.length === 0 ? (
								<div className="bg-dark-400 rounded-lg p-6 text-center">
									<Users className="h-8 w-8 text-gray-500 mx-auto mb-2" />
									<p className="text-gray-400 text-sm">No subscription groups found</p>
								</div>
							) : (
								<div className="bg-dark-400 rounded-lg p-4 max-h-80 overflow-y-scroll hide-scrollbar">
									<div className="space-y-3">
										{rooms.map((room) => (
											<div key={room.id} className="flex items-center gap-3 p-4 bg-dark-500 rounded-lg">
												<div className="flex items-center gap-3 flex-1 min-w-0">
													<div className="w-12 h-12 rounded-lg overflow-hidden bg-white p-1 flex-shrink-0">
														<img
															src={room.room_dp}
															alt={room.name}
															className="w-full h-full object-contain"
														/>
													</div>
													<div className="flex-1 min-w-0 overflow-hidden">
														<h5 className="font-medium text-white text-sm sm:text-base truncate leading-tight">{room.name}</h5>
														<p className="text-xs sm:text-sm text-gray-400 capitalize truncate">{room.status}</p>
													</div>
												</div>
												<div className="flex-shrink-0 ml-2">
													<button
														onClick={() => handleRoomToggle(room.id, room.is_public)}
														className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${room.is_public ? 'bg-indigo-600' : 'bg-gray-600'}`}
													>
														<span
															className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${room.is_public ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`}
														/>
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				)
			)}
		</>
	);
};

export default SharedSubscriptionSettingsComponent;
