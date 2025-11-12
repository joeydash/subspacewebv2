'use client';

import { useEffect, useState } from 'react';
import WhatsAppMessageModal from './whatsapp-message-modal';
import { useLanguageStore } from '@/lib/store/language-store';
import { X, Phone, MessageSquare, Star, MessageCircleMore } from 'lucide-react';
import ServiceDetailModal from './service-detail-modal';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { CallUI } from './call-ui';


interface FriendInfoModalProps {
	friendId: string;
	friendName: string;
	userId: string;
	userAuthToken: string;
	closeModal: () => void
}

interface FriendProfile {
	info: {
		dp: string;
		email: string;
		fullname: string;
		last_active: string;
		phone: string;
	} | null;
	commonGroups: Array<{
		id: string;
		name: string;
		room_dp: string;
	}>;
	subscriptions: Array<{
		plan: string;
		service_image_url: string;
		service_name: string;
		service_id: string;
		type: string;
	}>;
}

function FriendInfoModal({
	friendId,
	friendName,
	userId,
	userAuthToken,
	closeModal
}: FriendInfoModalProps
) {
	const [friendProfile, setFriendProfile] = useState<FriendProfile>({ info: null, commonGroups: [], subscriptions: [] });
	const [isLoadingProfile, setIsLoadingProfile] = useState(true);

	const [isCallActive, setIsCallActive] = useState(false);
	const [showMessageModal, setShowMessageModal] = useState(false);
	const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

	const router = useRouter();

	const { t } = useLanguageStore();

	useEffect(() => {
		fetchFriendProfile(friendId);
	}, [friendId])


	const fetchFriendProfile = async (friendId: string) => {
		if (!userId || !userAuthToken) return;

		setIsLoadingProfile(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${userAuthToken}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery($user_id: uuid = "", $friends_user_id: uuid = "") {
              __typename
              getUserInfo(request: {friends_user_id: $friends_user_id, user_id: $user_id}) {
                __typename
                dp
                email
                fullname
                last_active
                phone
              }
              getUserCommonGroups(request: {friends_user_id: $friends_user_id, user_id: $user_id}) {
                __typename
                id
                name
                room_dp
              }
              getUserPublicSubscriptions(request: {friends_user_id: $friends_user_id, user_id: $user_id}) {
                __typename
                plan
                service_image_url
                service_name
                service_id
                type
              }
            }
          `,
					variables: {
						user_id: userId,
						friends_user_id: friendId
					}
				})
			});

			const data = await response.json();

			setFriendProfile({
				info: data.data.getUserInfo,
				commonGroups: data.data.getUserCommonGroups || [],
				subscriptions: data.data.getUserPublicSubscriptions || []
			});
		} catch (error) {
			console.error('Error fetching friend profile:', error);
		} finally {
			setIsLoadingProfile(false);
		}
	};

	const handleChatWithUser = async () => {
		if (!userId || !userAuthToken) return;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${userAuthToken}`
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
						user_id: userId,
						other_id: friendId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error creating chat room:', data.errors);
				return;
			}

			const roomId = data.data?.createAnonymousRoom?.id;
			if (roomId) {
				// Navigate to chat page with the created room
				router.push(`/chat?groupId=${roomId}`);
			}
		} catch (error) {
			toast.error('Failed to create chat: ', error.message);
			console.error('Error creating private room:', error);
		}
	};

	const handleCommonGroupClick = (groupId: string) => {
		router.push('/chat?groupId=' + groupId);
	};


	return (
		<>
			<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
				<div className="bg-dark-500 rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
					{isLoadingProfile && (
						<div className='w-full h-[75vh] flex items-center justify-center scrollbar-hide'>
							<div className="flex justify-center items-center h-32">
								<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
							</div>
						</div>
					)}
					{!isLoadingProfile && (
						<>
							{/* Header */}
							<div className="relative p-4 sm:p-6 border-b border-gray-700/50">
								<div className="flex justify-between items-start mb-4 sm:mb-6">
									<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
										<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-1">
											<div className="w-full h-full rounded-full overflow-hidden bg-dark-600 relative">
												{friendProfile.info?.dp ? (
													<Image
														src={friendProfile.info.dp}
														alt={friendProfile.info.fullname || ''}
														fill
														className="object-cover"
														sizes="80px"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-gray-400">
														{friendProfile.info?.fullname?.charAt(0)?.toUpperCase()}
													</div>
												)}
											</div>
										</div>
										<div className="flex-1 min-w-0">
											<h2 className="text-xl sm:text-2xl font-bold text-white truncate">{friendProfile.info?.fullname}</h2>
											<p className="text-xs sm:text-sm text-gray-400 truncate">{t('chat.lastActive')}: {new Date(friendProfile.info?.last_active).toLocaleString()}</p>
										</div>

										<button
											onClick={handleChatWithUser}
											className="p-2 hover:bg-dark-400 rounded-lg transition-colors"
										>
											<MessageCircleMore className="w-6 h-6 sm:w-8 sm:h-8" />
										</button>
									</div>
									<button
										onClick={closeModal}
										className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-dark-400 hover:bg-dark-300 rounded-xl flex items-center justify-center transition-colors"
									>
										<X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
									</button>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
									<div className="bg-dark-400 rounded-xl p-2 sm:p-4">
										<p className="text-xs sm:text-sm text-gray-400 mb-1">{t('profile.email')}</p>
										<p className="text-sm sm:text-base text-white font-medium truncate">{friendProfile.info?.email}</p>
									</div>
									<div className="bg-dark-400 rounded-xl p-2 sm:p-4">
										<p className="text-xs sm:text-sm text-gray-400 mb-1">{t('profile.phone')}</p>
										<p className="text-sm sm:text-base text-white font-medium truncate">{friendProfile.info?.phone}</p>
									</div>
								</div>
								{!isCallActive ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 pt-4 sm:pt-6">
										<button
											onClick={() => {
												setIsCallActive(true);
											}}
											className="flex-1 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
										>
											<Phone className="h-4 w-4 sm:h-5 sm:w-5" />
											{t('chat.call')}
										</button>
										<button
											onClick={() => {
												setShowMessageModal(true);
											}}
											className="flex-1 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
										>
											<svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
											</svg>
											WhatsApp
										</button>
									</div>
								) : (
									<div className="pt-4">
										<CallUI
											friendId={friendId}
											friendName={friendName}
											autoStart={true}
											onCallEnd={() => setIsCallActive(false)}
										/>
									</div>
								)}
							</div>

							{/* Subscriptions */}
							<div className="p-4 sm:p-6 border-b border-gray-700/50">
								{friendProfile?.subscriptions.length > 0 && <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
									<Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
									{t('friends.activeSubscriptions')}
								</h3>}
								<div className="flex items-center space-x-4 overflow-scroll hide-scrollbar">
									{friendProfile?.subscriptions.map((sub, index) => (
										<div key={index}
											className="relative w-[150px] sm:w-[175px] shrink-0 bg-dark-400 rounded-xl p-3 sm:p-4 hover:bg-dark-300 transition-colors">
											{sub.type === 'admin' && (
												<div className="mb-3 absolute top-1 right-1">
													<span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-medium">
														Admin
													</span>
												</div>
											)}

											{sub.type === 'member' && (
												<div className="mb-3 absolute top-1 right-1">
													<span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-medium">
														Member
													</span>
												</div>
											)}
											<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white p-1 mb-2 sm:mb-3 relative">
												{sub.service_image_url ? (
													<Image
														src={sub.service_image_url}
														alt={sub.service_name}
														fill
														className="object-contain"
														sizes="48px"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-gray-400">
														{sub.service_name?.charAt(0)?.toUpperCase()}
													</div>
												)}
											</div>
											<h4 className="text-sm sm:text-base font-medium text-white">{sub.service_name}</h4>
											<p className="text-xs sm:text-sm text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">{sub.plan}</p>
										</div>
									))}
								</div>

								{/* Common Groups */}
								{friendProfile?.commonGroups.length > 0 && (
									<div className="my-4 sm:my-6">
										<h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
											<MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
											{t('chat.commonGroups')}
										</h3>
										<div className="space-y-2 sm:space-y-3">
											{friendProfile?.commonGroups.map((group) => (
												<div
													key={group.id}
													className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-dark-400 rounded-xl hover:bg-dark-300 transition-colors cursor-pointer"
													onClick={() => handleCommonGroupClick(group.id)}
												>
													<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-white p-1 relative">
														{group.room_dp ? (
															<Image
																src={group.room_dp}
																alt={group.name}
																fill
																className="object-contain"
																sizes="40px"
															/>
														) : (
															<div className="w-full h-full flex items-center justify-center text-gray-400">
																{group.name?.charAt(0)?.toUpperCase()}
															</div>
														)}
													</div>
													<span className="text-sm sm:text-base font-medium text-white truncate">{group.name}</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{showMessageModal && (
				<WhatsAppMessageModal
					isOpen={showMessageModal}
					onClose={() => setShowMessageModal(false)}
					friendName={friendName}
					friendId={friendId}
				/>
			)}

			{selectedServiceId !== null && (
				<ServiceDetailModal
					onClose={() => {
						setSelectedServiceId(null);
					}}
					serviceId={selectedServiceId}
				/>
			)}

		</>
	)
}

export default FriendInfoModal;