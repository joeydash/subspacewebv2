'use client';


import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Search, Users, MessageSquare, Phone, UserPlus, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import FriendsSkeleton from './friends-skeleton';
import { useFriends } from '@/lib/hooks/friends/use-friends';
import { Friend } from '@/lib/api/friends';
import { toast } from "react-hot-toast";
import ProtectedRoute from '@/components/protected-route';

const FriendsPage = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const { t } = useLanguageStore();
	const [searchQuery, setSearchQuery] = useState('');
	const [creatingChatFor, setCreatingChatFor] = useState<string | null>(null);

	const { data: friends = [], isLoading, error } = useFriends({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	const filteredFriends = useMemo(() => {
		if (!searchQuery) return friends;

		return friends.filter(friend =>
			friend.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
			friend.phone.includes(searchQuery)
		);
	}, [friends, searchQuery]);

	const handleStartChat = async (friend: Friend) => {
		if (!user?.id || !user?.auth_token) return;

		setCreatingChatFor(friend.id);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation createPrivateRoom($user_id: uuid!, $other_id: uuid!) {
              __typename
              createAnonymousRoom(request: {other_id: $other_id, user_id: $user_id}) {
                __typename
                id
              }
            }
          `,
					variables: {
						user_id: user.id,
						other_id: friend.id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				toast.error('Error creating chat room');
				console.error('Error creating chat room:', data.errors);
				setCreatingChatFor(null);
				return;
			}

			const roomId = data.data?.createAnonymousRoom?.id;
			if (roomId) {
				// Navigate to chat page with the created room
				router.push(`/chat?groupId=${roomId}`);
			}
		} catch (error) {
			console.error('Failed to start chat:', error);
			toast.error('Failed to start chat');
			setCreatingChatFor(null);
		}
	};

	const handleCall = (friend: Friend) => {
		toast.success('Calling feature is coming very soon!');
	};

	return (
		<div className="min-h-screen pt-20 pb-12 px-2 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 space-y-4">
					<div className="flex items-center gap-3">
						<button
							onClick={() => router.back()}
							className="text-gray-400 hover:text-white transition-colors"
						>
							<ArrowLeft className="h-6 w-6" />
						</button>
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{t('friends.title')}</h1>
						{!isLoading && filteredFriends.length > 0 && (
							<span className="text-sm text-gray-400 ml-auto">
								{filteredFriends.length} {t('friends.title')}
							</span>
						)}
					</div>

					{/* Search Bar */}
					<div className="relative w-full">
						<input
							type="text"
							placeholder={t('friends.searchPlaceHolder')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input pl-12 py-3 w-full rounded-2xl"
						/>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					</div>
				</div>

				{/* Loading State */}
				{isLoading && (
					<FriendsSkeleton count={6} />
				)}

				{/* Error State */}
				{error && (
					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
						<p className="text-red-400">{error.message}</p>
					</div>
				)}

				{/* Friends List */}
				{!isLoading && !error && (
					<>
						{filteredFriends.length === 0 ? (
							<div className="bg-dark-500 rounded-xl p-12 text-center">
								<div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
									<Users className="h-8 w-8 text-gray-500" />
								</div>
								<h3 className="text-xl font-bold mb-2">
									{searchQuery ? t('friends.notFound') : t('friends.noFriends')}
								</h3>
								<p className="text-gray-400 mb-6">
									{searchQuery
										? t('friends.notFoundSubtitle')
										: t('friends.noFriendsSubtitle')
									}
								</p>
								<div className="flex gap-4 justify-center">
									{searchQuery && (
										<button
											onClick={() => {
												setSearchQuery('');
											}}
											className="btn btn-primary"
										>
											{t('friends.showAllFriends')}
										</button>
									)}
									<button className="btn btn-secondary">
										<UserPlus className="h-4 w-4 mr-2" />
										{t('friends.addFriends')}
									</button>
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{filteredFriends.map((friend) => {
									return (
										<div
											key={friend.id}
											className="bg-dark-500 rounded-xl p-1 sm:p-4 hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-indigo-500/50 group flex flex-col"
										>
											{/* Friend Header */}
											<div className="flex items-center gap-3 mb-3">
												<div className="relative flex-shrink-0">
													<div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
														<div className="w-full h-full rounded-full overflow-hidden bg-dark-600 relative">
															{friend.dp ? (
																<Image
																	src={friend.dp}
																	alt={friend.fullname}
																	fill
																	className="object-cover"
																/>
															) : (
																<div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
																	<span className="text-white text-lg font-bold">
																		{friend.fullname.charAt(0).toUpperCase()}
																	</span>
																</div>
															)}
														</div>
													</div>
												</div>

												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-base text-white group-hover:text-indigo-400 transition-colors truncate">
														{friend.fullname}
													</h3>
													<p className="text-xs text-gray-400 truncate">{friend.phone}</p>
												</div>
											</div>

											{/* Subscriptions Preview - Fixed Height */}
											<div className="min-h-[60px] flex flex-col justify-center">
											{friend.whatsub_users_subscriptions && friend.whatsub_users_subscriptions.length > 0 ? (
													<>
														<div className="flex -space-x-2">
															{friend.whatsub_users_subscriptions.slice(0, 5).map((subscription, index) => (
																<div
																	key={index}
																	className="w-8 h-8 rounded-full border-2 border-dark-500 overflow-hidden bg-white p-1"
																	title={subscription.service_name}
																>
																<Image
																	src={subscription.service_image_url}
																	alt={subscription.service_name}
																	width={32}
																	height={32}
																	className="object-contain"
																/>
																</div>
															))}
															{friend.whatsub_users_subscriptions.length > 5 && (
																<div className="w-8 h-8 rounded-full border-2 border-dark-500 bg-dark-400 flex items-center justify-center">
																	<span className="text-xs text-white font-medium">
																		+{friend.whatsub_users_subscriptions.length - 5}
																	</span>
																</div>
															)}
														</div>
													</>
												) : (
													<div className="flex items-center justify-center h-full">
														<p className="text-xs text-gray-500 italic">No active subscriptions</p>
													</div>
												)}
											</div>

											{/* Action Buttons */}
											<div className="flex gap-2 mt-auto">
												<button
													onClick={() => handleStartChat(friend)}
													disabled={creatingChatFor === friend.id}
													className="flex-1 py-2 px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{creatingChatFor === friend.id ? (
														<>
															<Loader2 className="h-4 w-4 animate-spin" />
															<span>Creating...</span>
														</>
													) : (
														<>
															<MessageSquare className="h-4 w-4" />
															<span>Chat</span>
														</>
													)}
												</button>
												<button
													onClick={() => handleCall(friend)}
													className="py-2 px-3 bg-dark-400 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors"
													title="Call"
												>
													<Phone className="h-4 w-4" />
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};


const ProtectedFriendsPage = () => { 
	return (
		<ProtectedRoute>
			<FriendsPage />
		</ProtectedRoute>
	)
}

export default ProtectedFriendsPage;