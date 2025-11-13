'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Search, Users, Star, Clock, MessageSquare, Shield, Crown, Info, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import { GroupsPageSkeleton } from './groups-page-skeleton';
import { toast } from 'react-hot-toast';
import LoginModal from '@/components/login-modal';

import { useGroups } from '@/lib/hooks/groups/use-groups';
import { usePlanDetails } from '@/lib/hooks/plans/use-plan-details';

interface GroupMember {
	share_limit: number;
	number_of_users: number;
	room_id: string;
	room_created_at: string;
	room_dp: string;
	blurhash: string;
	user_id: string;
	fullname: string;
	dp: string;
	last_active: string;
	user_blurhash: string;
	average_rating: number;
	number_of_ratings: number;
	group_limit: number;
	hide_limit: number;
	price: number;
	expiring_at: string;
	premium: boolean;
}

interface PlanDetails {
	plan_name: string;
	service_name: string;
	service_image_url: string;
}

const GroupsPage = () => {
	const params = useParams();
	const planId = params?.planId as string;
	const { user, isAuthenticated } = useAuthStore();
	const router = useRouter();
	const { t } = useLanguageStore();
	const [searchQuery, setSearchQuery] = useState('');
	const isMarketRandomOn = user?.isMarketRandomOn;

	const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'expiry'>(isMarketRandomOn ? 'random' : 'newest');

	const [showLogin, setShowLogin] = useState(false);
	const [showInfoModal, setShowInfoModal] = useState(false);

	const {
		data: groups,
		isLoading: isGroupsLoading,
		error: groupsError
	} = useGroups({ planId, authToken: user?.auth_token });

	const {
		data: planDetails,
		isLoading: isPlanDetailsLoading,
		error: planDetailsError
	} = usePlanDetails({ planId, authToken: user?.auth_token })


	const filteredAndSortedGroups = groups
		?.filter(group =>
			group.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
			searchQuery === ''
		)
		.sort((a, b) => {
			switch (sortBy) {
				case 'newest':
					return new Date(b.room_created_at).getTime() - new Date(a.room_created_at).getTime();
				case 'rating':
					if (b.average_rating === a.average_rating) {
						return b.number_of_ratings - a.number_of_ratings;
					}

					return b.average_rating - a.average_rating;
				case 'expiry':
					return new Date(a.expiring_at).getTime() - new Date(b.expiring_at).getTime();
				default:
					return 0;
			}
		});

	const formatDate = (dateString: string, type: string = "") => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.abs(Math.floor(diffTime / (1000 * 60 * 60 * 24)));

		if (diffDays === 0) {
			return `${t('common.today')}`;
		} else if (diffDays === 1) {
			return `${t('common.yesterday')}`;
		} else if (diffDays < 7) {
			return `${Math.abs(diffDays)} ${type === 'created' ? `${t('common.days')} ${t('common.ago')}` : `${t('common.days')}`}`;
		} else {
			return date.toLocaleDateString('en-US', {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			});
		}
	};

	const formatLastActive = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());

		const diffSeconds = Math.floor(diffTime / 1000);
		const diffMinutes = Math.floor(diffTime / (1000 * 60));
		const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);

		if (diffSeconds < 1) {
			return `${t('chat.activeNow')}`;
		} else if (diffMinutes < 1) {
			return `${t('common.active')} ${diffSeconds} ${diffSeconds === 1 ? t('common.second') : t('common.seconds')} ${t('common.ago')}`;
		} else if (diffHours < 1) {
			return `${t('common.active')} ${diffMinutes} ${diffMinutes === 1 ? t('common.minute') : t('common.minutes')} ${t('common.ago')}`;
		} else if (diffDays < 1) {
			return `${t('common.active')} ${diffHours} ${diffHours === 1 ? t('common.hour') : t('common.hours')} ${t('common.ago')}`;
		} else {
			return `${t('common.active')} ${diffDays} ${diffDays === 1 ? t('common.day') : t('common.days')} ${t('common.ago')}`;
		}
	};


	const getAvailableSlots = (group: GroupMember) => {
		return group.share_limit - group.number_of_users;
	};

	const isGroupAvailable = (group: GroupMember) => {
		return getAvailableSlots(group) > 0;
	};

	const handleJoinGroup = (group: GroupMember) => {
		// Navigate to checkout page with group details
		if (group.room_id) {
			// Get group members
			const groupInfo = {
				id: group.room_id,
				name: group.name,
				room_id: group.room_id,
				room_dp: group.room_dp,
				price: group.price,
				share_limit: group.share_limit,
				number_of_users: group.number_of_users,
				admin_name: group.fullname, // Admin name is the group owner's fullname
				plan_name: group.whatsub_plans?.plan_name,
				service_name: group.whatsub_plans?.whatsub_service?.service_name,
				service_image_url: group.whatsub_plans?.whatsub_service?.image_url || '',
				expiring_at: group.expiring_at
			};

			// Navigate to checkout with group details as query params
			const params = new URLSearchParams({
				groupData: JSON.stringify(groupInfo)
			});
			router.push(`/checkout/${group.room_id}?${params.toString()}`);
		}
	};

	const handleChatWithUser = async (group: GroupMember) => {
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
						other_id: group.user_id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				toast.error('Error creating chat room:', data.errors);
				return;
			}

			const roomId = data.data?.createAnonymousRoom?.id;
			if (roomId) {
				// Navigate to chat page with the created room
				router.push(`/chat?groupId=${roomId}`);
			}
		} catch (error) {
			console.error('Error creating private room:', error);
		}
	};

	if (isGroupsLoading || isPlanDetailsLoading) {
		return (
			<GroupsPageSkeleton
				showPlanHeader={true}
				showSearchAndSort={true}
				groupsCount={12}
			/>
		);
	}

	if (groupsError || planDetailsError) {
		return (
			<div className="page-container pt-24">
				<div className="flex items-center gap-4 mb-8">
					<button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
						<ArrowLeft className="h-6 w-6" />
					</button>
				</div>
				<div className="bg-dark-500 rounded-xl p-12 text-center">
					<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<Users className="h-8 w-8 text-red-400" />
					</div>
					<h1 className="text-2xl font-bold mb-4">{t('error.groupError')}</h1>
					<p className="text-gray-400 mb-6">{groupsError ? groupsError?.message : planDetailsError?.message}</p>
					<button onClick={() => router.back()} className="btn btn-primary">
						{t('common.tryAgain')}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 space-y-4">
					<div className="flex items-center gap-3">
						<button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
							<ArrowLeft className="h-6 w-6" />
						</button>
						<div className="flex items-center gap-3 flex-1 min-w-0">
							{planDetails?.service_image_url && (
								<div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-white p-1.5 md:p-2 flex-shrink-0 relative">
									<Image
										src={planDetails.service_image_url}
										alt={planDetails.service_name}
										fill
										className="object-contain"
										sizes="56px"
									/>
								</div>
							)}
							<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate flex-1">
								{planDetails ? `${planDetails.service_name} - ${planDetails.plan_name}` : t('group.count')}
							</h1>
						</div>
						<button
							onClick={() => setShowInfoModal(true)}
							className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700/50 rounded-full"
							aria-label="Info"
						>
							<Info className="h-5 w-5" />
						</button>
					</div>

					{/* Search Bar */}
					<div className="relative w-full">
						<input
							type="text"
							placeholder={t('group.searchPlaceHolder')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input pl-12 py-3 w-full rounded-2xl"
						/>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					</div>
				</div>

				{/* Filters */}
				{!(isGroupsLoading || isPlanDetailsLoading) && (
					<div className="mb-6">
						<div className="relative">
							<div className="overflow-x-auto pb-2 hide-scrollbar">
								<div className="flex space-x-2 px-1 min-w-max">
									<button
										onClick={() => setSortBy('random')}
										className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium ${sortBy === 'random'
												? 'bg-slate-600 text-white shadow-lg hover:bg-slate-500'
												: 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
											}`}
									>
										Random
									</button>
									<button
										onClick={() => setSortBy('rating')}
										className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium ${sortBy === 'rating'
												? 'bg-slate-600 text-white shadow-lg hover:bg-slate-500'
												: 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
											}`}
									>
										{t('group.rating')}
									</button>
									<button
										onClick={() => setSortBy('newest')}
										className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium ${sortBy === 'newest'
												? 'bg-slate-600 text-white shadow-lg hover:bg-slate-500'
												: 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
											}`}
									>
										{t('group.newest')}
									</button>
									<button
										onClick={() => setSortBy('expiry')}
										className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium ${sortBy === 'expiry'
												? 'bg-slate-600 text-white shadow-lg hover:bg-slate-500'
												: 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
											}`}
									>
										{t('group.expiry')}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Groups Grid */}
				{!filteredAndSortedGroups || filteredAndSortedGroups.length === 0 ? (
					<div className="bg-dark-500 rounded-xl p-12 text-center">
						<div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<Users className="h-8 w-8 text-gray-500" />
						</div>
						<h3 className="text-xl font-bold mb-2">{t('group.noGroupsFound')}</h3>
						<p className="text-gray-400 mb-6">
							{searchQuery
								? `${t('group.noSearchedGroupAvailable1')} "${searchQuery}"${t('group.noSearchedGroupAvailable2')}`
								: t('group.noGroupAvailableForPlan')
							}
						</p>
						<div className="flex gap-4 justify-center">
							{searchQuery && (
								<button onClick={() => setSearchQuery('')} className="btn btn-primary">
									{t('group.showAllGroups')}
								</button>
							)}
							<button onClick={() => router.back()} className="btn btn-secondary">
								{t('group.goBack')}
							</button>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredAndSortedGroups?.map((group) => {
							const availableSlots = getAvailableSlots(group);
							const isAvailable = isGroupAvailable(group);
							const pricePerUser = Math.ceil(group.price / group.share_limit);

							return (
								<div
									key={`${group.room_id}-${group.user_id}`}
									className={`group bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 border border-slate-700/50 hover:border-slate-600 ${!isAvailable && 'opacity-75'
										}`}
								>
									{/* Header with Group Owner */}
									<div className="relative p-4 md:p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/80">
										<div className="flex items-center gap-3">
											<div className="relative flex-shrink-0">
												<div className="h-14 w-14 md:h-16 md:w-16 rounded-lg overflow-hidden bg-slate-700/30 shadow-lg ring-1 ring-slate-600/50 group-hover:ring-slate-500 transition-all duration-300 relative">
													<Image
														src={group.dp || '/default-avatar.png'}
														alt={group.fullname}
														fill
														className="object-cover transition-transform duration-300 group-hover:scale-105"
														sizes="64px"
													/>
												</div>
												{group.premium && (
													<div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
														<Crown className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
													</div>
												)}
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex justify-between items-start gap-2 mb-1">
													<h3 className="font-bold text-white text-base md:text-lg truncate flex-1">{group.fullname}</h3>
													{group.average_rating > 0 && (
														<div className="flex items-center gap-1 flex-shrink-0">
															<Star className="h-3 w-3 md:h-3.5 md:w-3.5 text-yellow-400 fill-current" />
															<span className="text-xs md:text-sm font-medium text-white">{group.average_rating.toFixed(1)}</span>
														</div>
													)}
												</div>
												<div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400">
													<Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
													<span className="truncate">{formatLastActive(group.last_active)}</span>
												</div>
											</div>
										</div>
									</div>

									{/* Group Details */}
									<div className="p-4 md:p-5 space-y-3">
										<div className="flex justify-between items-start gap-2">
											<div className="min-w-0 flex-1">
												<div className="flex items-baseline gap-1.5 mb-1">
													<span className="text-xl md:text-2xl font-bold text-white">₹{pricePerUser}</span>
													<span className="text-xs md:text-sm text-gray-400">/device/month</span>
												</div>
												<div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
													<span>Total: ₹{group.price}</span>
													<span>•</span>
													<span>Split {group.share_limit} ways</span>
												</div>
											</div>
											<div className="text-right flex-shrink-0">
												<div className="text-xs md:text-sm text-gray-400">Slots</div>
												<div className={`text-lg md:text-xl font-bold ${isAvailable ? 'text-green-400' : 'text-red-400'
													}`}>
													{isAvailable ? availableSlots : '0'}
												</div>
											</div>
										</div>



										{/* Action Buttons */}
										<div className="flex gap-2">
											<button
												onClick={() => {
													if (!isAuthenticated) {
														setShowLogin(true);
														return;
													}

													handleJoinGroup(group)
												}}
												disabled={!isAvailable}
												className={`flex-1 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] ${isAvailable
														? 'bg-blue-600 hover:bg-blue-700 text-white'
														: 'bg-gray-600 text-gray-400 cursor-not-allowed'
													}`}
											>
												{isAvailable ? t('group.join') : t('group.full')}
											</button>
											<button
												onClick={() => {
													if (!isAuthenticated) {
														setShowLogin(true);
														return;
													}

													handleChatWithUser(group)
												}}
												className="px-3 md:px-4 py-2.5 md:py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
											>
												<MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-gray-300" />
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* Info Modal */}
				{showInfoModal && (
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
						<div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-auto shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-bold flex items-center gap-2">
									<Shield className="h-5 w-5 text-blue-400" />
									{t('group.info.title')}
								</h2>
								<button
									onClick={() => setShowInfoModal(false)}
									className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
							<div className="space-y-6 text-sm text-gray-300">
								<div>
									<h3 className="font-semibold text-white mb-2 text-base">{t('group.info.point1')}</h3>
									<p>{t('group.info.point1Desc')}</p>
								</div>
								<div>
									<h3 className="font-semibold text-white mb-2 text-base">{t('group.info.point2')}</h3>
									<p>{t('group.info.point2Desc')}</p>
								</div>
								<div>
									<h3 className="font-semibold text-white mb-2 text-base">{t('group.info.point3')}</h3>
									<p>{t('group.info.point3Desc')}</p>
								</div>
							</div>
							<button
								onClick={() => setShowInfoModal(false)}
								className="mt-6 w-full py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
							>
								Got it
							</button>
						</div>
					</div>
				)}

				<LoginModal
					isOpen={showLogin}
					onClose={() => setShowLogin(false)}
				/>
			</div>
		</div>
	);
};

export default GroupsPage;
