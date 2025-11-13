'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, Info, Star, LogOut, Crown, ArrowLeft, ChevronRight, CreditCard as Edit, MessageSquare, Mail, FileImage, Trash2, CreditCard, UserPlus, Link, EllipsisVertical } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import CallModal from './call-modal';
import AdminRatingModal from './admin-rating-modal';
import FriendInfoModal from '@/components/friend-info-modal';
import LeaveGroupModal from './leave-group-modal';
import EditGroupDetails from './edit-group-details';
import WelcomeMessage from './welcome-message';
// import ChatMailBox from './chat-mail-box';
import UploadTermsComponent from './upload-terms-component';
import GroupInfoView from './group-info-view';
import DeleteGroupConfirmationModal from './delete-group-confirmation-modal';
import RemoveMemberConfirmationModal from './remove-member-confirmation-modal';
import GroupDeleteRestrictionModal from './group-delete-restriction-modal';
import LeaveGroupRestrictionModal from './leave-group-restriction-modal';
import { toast } from 'react-hot-toast';

interface GroupMember {
	user_id: string;
	fullname: string;
	dp: string;
	is_admin: boolean;
	joined_at: string;
	average_rating: number;
	number_of_ratings: number;
	phone?: string;
}

interface DailyTransaction {
	user_name: string;
	date: string;
	amount: number;
}

interface GroupInfo {
	id: string;
	name: string;
	room_dp: string;
	created_at: string;
	service_name?: string;
	plan_name?: string;
	price?: number;
	expiring_at?: string;
	share_limit?: number;
	is_public?: boolean;
	average_rating?: number;
	number_of_ratings?: number;
	admin: {
		id: string;
		isGroupInfoRead: boolean;
		auth_fullname: {
			id: string;
			dp: string;
			fullname: string;
		};
		created_at: string;
		type: string;
		whatsub_admin_average_ratings: {
			average_rating: number;
			number_of_ratings: number;
		};
	};
}

interface GroupInfoModalProps {
	isOpen: boolean;
	onClose: () => void;
	groupId: string;
	groupName: string;
	groupImage?: string;
	onRefetchChats?: () => void;
	onGroupDetailsUpdated?: (name: string, image: string) => void;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
	isOpen,
	onClose,
	groupId,
	groupName,
	groupImage,
	onRefetchChats,
	onGroupDetailsUpdated
}) => {
	const { user } = useAuthStore();
	const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
	const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
	const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] = useState(false);
	const [transactionOffset, setTransactionOffset] = useState(0);
	const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
	const [showCallModal, setShowCallModal] = useState(false);
	const [selectedMemberForRating, setSelectedMemberForRating] = useState<GroupMember | null>(null);
	const [selectedMemberForInfo, setSelectedMemberForInfo] = useState<GroupMember | null>(null);
	// const [isLeavingGroup, setIsLeavingGroup] = useState(false);
	const [showInfoModal, setShowInfoModal] = useState(false);
	const [showRatingModal, setShowRatingModal] = useState(false);
	const [showLeaveModal, setShowLeaveModal] = useState(false);
	const [activeView, setActiveView] = useState<'main' | 'transactions' | 'info' | 'edit-details' | 'welcome-message' | 'mailbox' | 'make-public' | 'add-paid-member' | 'add-unpaid-member'>('main');
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [currentUserMapping, setCurrentUserMapping] = useState<any>(null);
	const [roomDetails, setRoomDetails] = useState<any>(null);
	const [memberOptionsOpen, setMemberOptionsOpen] = useState<string | null>(null);
	const [showRemoveMemberModal, setShowRemoveMemberModal] = useState<boolean>(false);
	const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
	const [copiedLink, setCopiedLink] = useState(false);
	const [isResettingLink, setIsResettingLink] = useState(false);
	const [showDeleteRestrictionModal, setShowDeleteRestrictionModal] = useState(false);
	const [showLeaveRestrictionModal, setShowLeaveRestrictionModal] = useState(false);
	const [hoursRemainingToLeave, setHoursRemainingToLeave] = useState(0);
	const [isOnline, setIsOnline] = useState(true);

	const TRANSACTIONS_LIMIT = 20;

	// Client-side mounting check
	useEffect(() => {
		setIsMounted(true);
		// Set initial online status only on client
		if (typeof navigator !== 'undefined') {
			setIsOnline(navigator.onLine);
		}
	}, []);

	useEffect(() => {
		if (isOpen && groupId && user?.auth_token) {
			fetchGroupDetails();
		}
	}, [isOpen, groupId, user?.auth_token]);

	// Prevent background scroll when modal is open (client only)
	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		if (isOpen) {
			window.document.body.style.overflow = 'hidden';
		} else {
			window.document.body.style.overflow = 'unset';
		}

		return () => {
			window.document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	// Handle online/offline events (client only)
	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);
	// Reset transactions state when modal opens
	useEffect(() => {
		if (isOpen) {
			setTransactions([]);
			setTransactionOffset(0);
			setHasMoreTransactions(true);
		}
	}, [isOpen]);
	const fetchGroupDetails = async (showLoading: boolean = true) => {
		if (!user?.auth_token || !groupId) return;

		if (showLoading) {
			setIsLoading(true);
		}

		setError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query getRoomsDetails($room_id: uuid!) {
              __typename
            
              whatsub_rooms(where: { id: { _eq: $room_id } }) {
                __typename
                is_public
                is_verified
                room_dp
                name
                id
                user_id
                free_join_link
                pay_join_link
                details
                short_mail_id
            
                auth_fullname {
                  __typename
                  fullname
                  dp
                }
            
                whatsub_users_subscriptions(where: { type: { _eq: "admin" } }) {
                  __typename
                  id
                  expiry_image
                  whatsub_plan {
                    __typename
                    admin_conditions
                  }
                }
            
                whatsub_room_user_mappings(order_by: { created_at: asc_nulls_first }) {
                  __typename
                  id
                  isGroupInfoRead
                  auth_fullname {
                    __typename
                    id
                    dp
                    fullname
                  }
                  created_at
                  type
                  whatsub_admin_average_ratings {
                    __typename
                    average_rating
                    number_of_ratings
                  }
                }
              }
            }
          `,
					variables: {
						room_id: groupId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch group details');
				return;
			}

			const room = data.data?.whatsub_rooms?.[0];

			if (!room) {
				setError('Group not found');
				return;
			}

			setRoomDetails(room);

			const admin = room.whatsub_room_user_mappings.find((user: any) => {
				if (user.auth_fullname.id == room.user_id) {
					return true;
				}

				return false;
			});

			// Set group info
			setGroupInfo({
				id: room.id,
				name: room.name,
				room_dp: room.room_dp,
				created_at: room.whatsub_room_user_mappings?.[0]?.created_at || '',
				service_name: '', // Will be populated from subscription data if needed
				plan_name: '', // Will be populated from subscription data if needed
				price: 0, // Will be populated from subscription data if needed
				expiring_at: '', // Will be populated from subscription data if needed
				share_limit: room.whatsub_room_user_mappings?.length || 0,
				is_public: room.is_public,
				admin,
				average_rating: admin?.whatsub_admin_average_ratings?.average_rating,
				number_of_ratings: admin?.whatsub_admin_average_ratings?.number_of_ratings,
			});

			// Set group members
			const members = room.whatsub_room_user_mappings.map((mapping: any) => ({
				user_id: mapping.auth_fullname.id,
				fullname: mapping.auth_fullname.fullname,
				dp: mapping.auth_fullname.dp,
				is_admin: room.user_id == mapping.auth_fullname.id,
				joined_at: mapping.created_at,
				average_rating: mapping.whatsub_admin_average_ratings?.[0]?.average_rating || 0,
				number_of_ratings: mapping.whatsub_admin_average_ratings?.[0]?.number_of_ratings || 0,
				phone: ''
			}));

			// Find current user's mapping
			const userMapping = room.whatsub_room_user_mappings.find((mapping: any) =>
				mapping.auth_fullname.id === user?.id
			);
			setCurrentUserMapping(userMapping);
			// Sort members: admins first, then by join date
			members.sort((a, b) => {
				if (a.is_admin && !b.is_admin) return -1;
				if (!a.is_admin && b.is_admin) return 1;
				return new Date(a.joined_at || '').getTime() - new Date(b.joined_at || '').getTime();
			});

			setGroupMembers(members);

		} catch (error) {
			console.error('Error fetching group details:', error);
			setError('Failed to fetch group details');
		} finally {
			if (showLoading) {
				setIsLoading(false);
			}
		}
	};

	const fetchTransactions = async (reset = false) => {
		if (!user?.auth_token || !groupId) return;

		const currentOffset = reset ? 0 : transactionOffset;

		if (reset) {
			setIsLoadingTransactions(true);
			setTransactions([]);
			setTransactionOffset(0);
			setHasMoreTransactions(true);
		} else {
			setIsLoadingMoreTransactions(true);
		}

		setError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery($room_id: uuid!, $limit: Int, $offset: Int) {
              __typename
              w_getDailyTransactions(request: {room_id: $room_id, limit: $limit, offset: $offset}) {
                __typename
                daily_transactions
              }
            }
          `,
					variables: {
						room_id: groupId,
						limit: TRANSACTIONS_LIMIT,
						offset: currentOffset
					}
				})
			});

			const data = await response.json();


			if (data.errors) {
				setError('Failed to fetch transactions');
				return;
			}

			const newTransactions = data.data?.w_getDailyTransactions?.daily_transactions || [];

			if (reset) {
				setTransactions(newTransactions);
			} else {
				setTransactions(prev => [...prev, ...newTransactions]);
			}

			// Update pagination state
			setTransactionOffset(currentOffset + TRANSACTIONS_LIMIT);
			setHasMoreTransactions(newTransactions.length === TRANSACTIONS_LIMIT);
			setActiveView('transactions');
		} catch (error) {
			console.error('Error fetching transactions:', error);
			setError('Failed to fetch transactions');
		} finally {
			if (reset) {
				setIsLoadingTransactions(false);
			} else {
				setIsLoadingMoreTransactions(false);
			}
		}
	};

	const loadMoreTransactions = async () => {
		if (!hasMoreTransactions || isLoadingMoreTransactions) return;
		await fetchTransactions(false);
	};

	const handleTransactionsScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

		// Check if user has scrolled to bottom (with 10px threshold)
		if (scrollHeight - scrollTop <= clientHeight + 10) {
			loadMoreTransactions();
		}
	};
	const handleTransactionsClick = () => {
		fetchTransactions(true);
	};

	const handleInfoClick = () => {
		setShowInfoModal(true);
	};

	const handleBackToMain = () => {
		setActiveView('main');
		setTransactions([]);
	};

	const handleCallMember = (member: GroupMember) => {
		setSelectedMemberForInfo(member);
		setShowCallModal(true);
	};

	function diffInHoursFromNow(isoString) {
		const givenDate = new Date(isoString);

		const now = new Date();
		const diffMs = now - givenDate;
		const diffHours = diffMs / (1000 * 60 * 60);

		return diffHours;
	}


	const handleLeaveGroup = () => {
		// Check if user has been in the group for at least 6 hours
		const currentUserMember = groupMembers.find(member => member.user_id === user?.id);
		if (currentUserMember && currentUserMember.joined_at) {
			const hoursSinceJoined = diffInHoursFromNow(currentUserMember.joined_at);

			if (hoursSinceJoined < 6) {
				// User hasn't been in the group for 6 hours yet
				const hoursRemaining = 6 - hoursSinceJoined;
				setHoursRemainingToLeave(hoursRemaining);
				setShowLeaveRestrictionModal(true);
				return;
			}
		}

		// Member wants to leave group
		setShowLeaveModal(true);
	};

	const handleDeleteGroup = () => {
		// Admin wants to delete group - check if there are other members
		const otherMembers = groupMembers.filter(member => member.user_id !== user?.id);
		if (otherMembers.length > 0) {
			// Show restriction modal if there are other members
			setShowDeleteRestrictionModal(true);
		} else {
			// Show delete confirmation if no other members
			setShowDeleteConfirmation(true);
		}
	}

	const handleInfoMarkAsRead = () => {
		// Update local state and go back to main view
		setCurrentUserMapping(prev => ({ ...prev, isGroupInfoRead: true }));
		setActiveView('main');
	};

	const handleLeaveSuccess = () => {
		// Close all modals and refresh
		setShowLeaveModal(false);
		onClose();
		// You might want to navigate away or refresh the chat list here
	};

	const handleDeleteSuccess = () => {
		// Close all modals and refresh
		setShowDeleteConfirmation(false);
		onClose();
		// Refetch chats to reflect changes
		onRefetchChats?.();
		// You might want to navigate away or refresh the chat list here
	};

	const handleEditDetails = () => {
		setActiveView('edit-details');
	};

	const handleSaveEditDetails = (name: string, image: string) => {
		// Update local state
		if (groupInfo) {
			setGroupInfo(prev => prev ? {
				...prev,
				name: name,
				room_dp: image
			} : null);
		}
		// Update the chat page header with new details
		onGroupDetailsUpdated?.(name, image);
		// Go back to main view
		setActiveView('main');
		// Refetch chats to reflect changes
		onRefetchChats?.();
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const getCurrentUserRole = () => {
		const currentUserMember = groupMembers.find(member => member.user_id === user?.id);
		return currentUserMember?.is_admin ? 'Admin' : 'Member';
	};

	const handleResetLink = async (isPaidLink: boolean) => {
		setIsResettingLink(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user?.auth_token}`
				},
				body: JSON.stringify({
					query: `
						mutation MyMutation(
							$user_id: uuid!
							$room_id: uuid!
							$is_paid: Boolean!
						) {
							__typename
							w_resetInviteLink(
								request: {
									user_id: $user_id
									room_id: $room_id
									is_paid: $is_paid
								}
							) {
								__typename
								link
							}
						}
					`,
					variables: {
						user_id: user?.id,
						room_id: groupId,
						is_paid: isPaidLink
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error resetting link:', data.errors);
				return;
			}

			const newLink = data.data?.w_resetInviteLink?.link;
			if (newLink) {
				// Update the roomDetails with the new link
				setRoomDetails(prev => ({
					...prev,
					[isPaidLink ? 'pay_join_link' : 'free_join_link']: newLink
				}));
			}
		} catch (error) {
			console.error('Failed to reset link:', error);
		} finally {
			setIsResettingLink(false);
		}
	};

	const togglePublicGroupStatus = async (isPublic: boolean) => {
		try {
			const res = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `mutation MyMutation($room_id: uuid = "", $is_public: Boolean = true) {
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
						room_id: groupId,
						is_public: isPublic
					}
				})
			});

			const data = await res.json();

			if (data?.data?.update_whatsub_rooms.affected_rows > 0) {
				fetchGroupDetails(false);

				if (isPublic) {
					toast.success('Your group will be made public within 24 hrs after verification.')
				}
			} else {
				toast.error('Failed to update group public status');
			}
		} catch (e) {
			toast.error('Failed to make public: ', e.message);
		}
	}

	if (!isOpen) return null;

	return (
		<>
			<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
				<div
					className="bg-dark-500 rounded-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto small-scrollbar border border-gray-700 shadow-2xl"
					onScroll={activeView == 'transactions' ? handleTransactionsScroll : undefined}
				>
					{/* Header */}
					<div className="relative flex-shrink-0">
						{/* Background with group image */}
						<div className="h-24 sm:h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 relative overflow-hidden">
							{groupImage && (
								<Image
									src={groupImage}
									alt={groupName}
									fill
									className="object-cover opacity-30"
									sizes="(max-width: 640px) 100vw, 512px"
								/>
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
						</div>

						{/* Header content */}
						<div className="absolute top-2 left-2 sm:left-4 right-2 sm:right-4 flex items-center justify-between gap-2">
							<div className="flex items-center gap-2 sm:gap-3 min-w-0">
								{activeView !== 'main' ? (
									<button
										onClick={handleBackToMain}
										className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center text-white hover:bg-white/20 transition-colors rounded-lg backdrop-blur-sm"
									>
										<ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
									</button>
								) : (
									<div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" aria-hidden />
								)}
								<div className="flex items-center gap-2 sm:gap-3 min-w-0">
									<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/90 p-2 shadow-lg relative">
										<Image
											src={groupInfo?.room_dp || groupImage || '/default-group.png'}
											alt={groupInfo?.name || groupName}
											fill
											className="object-contain"
											sizes="64px"
										/>
									</div>
									<div className="text-white min-w-0">
										<h2 className="text-lg sm:text-xl font-bold leading-tight truncate" title={groupInfo?.name || groupName}>{groupInfo?.name || groupName}</h2>
										{groupInfo?.service_name && (
											<p className="text-xs sm:text-sm opacity-90">{groupInfo.service_name} - {groupInfo.plan_name}</p>
										)}
									</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								{roomDetails?.is_verified && (
									<div className="bg-green-500/20 backdrop-blur-sm text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
										✓ Verified Group
									</div>
								)}
								<button
									onClick={onClose}
									className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white hover:bg-white/20 transition-colors rounded-lg backdrop-blur-sm"
								>
									<X className="h-5 w-5 sm:h-6 sm:w-6" />
								</button>
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="p-3 sm:p-4">
						<div>
							{isLoading ? (
								<div className="flex justify-center items-center h-32">
									<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
								</div>
							) : error ? (
								<div className="text-center py-6 sm:py-8">
									<p className="text-red-400 mb-4">{error}</p>
									<button onClick={fetchGroupDetails} className="btn btn-primary">
										Try Again
									</button>
								</div>
							) : (
								<>
									{/* Main View */}
									{activeView === 'main' && groupInfo && (
										<div className="space-y-3 sm:space-y-4">
											{/* Rating Section */}
											<div className="text-center">
												<div className="text-3xl sm:text-4xl font-bold text-white mb-2">
													{groupInfo.average_rating}
												</div>
												<div className="flex justify-center mb-2">
													{[1, 2, 3, 4, 5].map((star) => (
														<Star
															key={star}
															className={`h-5 w-5 sm:h-6 sm:w-6 ${star <= (groupInfo?.average_rating || 0)
																? 'text-blue-400 fill-current'
																: 'text-gray-600'
																}`}
														/>
													))}
												</div>
												<div className="text-gray-400 text-xs sm:text-sm mb-2">
													{!groupInfo?.number_of_ratings && 'No Ratings'}
													{groupInfo?.number_of_ratings < 1000 && (groupInfo?.number_of_ratings + ' Ratings')}
													{groupInfo?.number_of_ratings >= 1000 && ((groupInfo?.number_of_ratings / 1000) + 'K + Ratings')}
												</div>
												{/* Only show rating option if current user is not the admin */}
												{groupInfo?.admin?.auth_fullname?.id !== user?.id && (
													<div
														className="text-blue-400 font-medium cursor-pointer"
														onClick={() => {
															const adminMember = groupMembers.find(member => member.is_admin);
															if (adminMember) {
																setSelectedMemberForRating(adminMember);
																setShowRatingModal(true);
															}
														}}
													>
														Rate Your Admin
													</div>
												)}
											</div>

											{/* Action Buttons */}
											<div className="space-y-2 sm:space-y-3">
												{/* Admin-only options */}
												{groupInfo?.admin?.auth_fullname?.id === user?.id && (
													<>
														<button
															onClick={handleEditDetails}
															className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
														>
															<div className="flex items-center gap-2 sm:gap-3">
																<Edit className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
																<span className="text-sm sm:text-base font-medium">Edit Details</span>
															</div>
															<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
														</button>

														<button
															onClick={() => setActiveView('welcome-message')}
															className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
														>
															<div className="flex items-center gap-2 sm:gap-3">
																<MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
																<span className="text-sm sm:text-base font-medium">Welcome Message</span>
															</div>
															<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
														</button>

														{/* <button
															onClick={() => setActiveView('mailbox')}
															className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
														>
															<div className="flex items-center gap-2 sm:gap-3">
																<Mail className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
																<span className="text-sm sm:text-base font-medium">Mail Box</span>
															</div>
															<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
														</button> */}
														<button
															onClick={() => setActiveView('make-public')}
															className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
														>
															<div className="flex items-center gap-2 sm:gap-3">
																<FileImage className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
																<span className="text-sm sm:text-base font-medium">Verify Expiry</span>
															</div>
															<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
														</button>
														<button
															onClick={handleTransactionsClick}
															className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
														>
															<div className="flex items-center gap-2 sm:gap-3">
																<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
																<span className="text-sm sm:text-base font-medium">Transactions</span>
															</div>
															<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
														</button>

														<button
															onClick={() => setActiveView('info')}
															className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
														>
															<div className="flex items-center gap-2 sm:gap-3">
																<Info className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
																<span className="text-sm sm:text-base font-medium">Info</span>
															</div>
															<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
														</button>

														<div className="space-y-1 px-2">
															<div className="flex items-center justify-between pt-2">
																<h4 className="font-medium text-white text-base">Public Group</h4>
																<button
																	onClick={() => togglePublicGroupStatus(!roomDetails?.is_public)}
																	className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${roomDetails?.is_public ? 'bg-indigo-600' : 'bg-gray-600'}`}
																>
																	<span
																		className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${roomDetails?.is_public ? 'translate-x-6' : 'translate-x-1'}`}
																	/>
																</button>
															</div>
															<p className="text-xs sm:text-sm text-gray-400">
																Making it public will let others to join your group.
															</p>
														</div>
													</>
												)}

												{/* Common options for all users */}
												{groupInfo?.admin?.auth_fullname?.id !== user?.id && (
													<>
														<button
															onClick={handleTransactionsClick}
															className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
														>
															<div className="flex items-center gap-2 sm:gap-3">
																<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
																<span className="text-sm sm:text-base font-medium">Transactions</span>
															</div>
															<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
														</button>

														<button
															onClick={() => setActiveView('info')}
															className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
														>
															<div className="flex items-center gap-2 sm:gap-3">
																<Info className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
																<span className="text-sm sm:text-base font-medium">Info</span>
															</div>
															<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
														</button>
													</>
												)}
											</div>
										</div>
									)}

									{/* Transactions View */}
									{activeView === 'transactions' && (
										<div
											className="space-y-4"
										>
											<h3 className="text-lg sm:text-xl font-bold text-white">Daily Transactions</h3>

											{isLoadingTransactions ? (
												<div className="text-center py-6 sm:py-8">
													<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
													<p className="text-gray-400 mt-2">Loading transactions...</p>
												</div>
											) : transactions.length === 0 ? (
												<div className="text-center py-8 text-gray-400">
													<FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
													<p>No transactions found</p>
												</div>
											) : (
												<div className="space-y-2">
													{transactions.map((transaction, index) => (
														<div key={index} className="bg-dark-400 rounded-lg p-2 sm:p-4">
															<div className="flex items-center justify-between">
																<div>
																	<div className="text-sm sm:text-base font-medium text-white">{transaction?.whatsub_wallet?.authByFrom.fullname}</div>
																	<div className="text-xs sm:text-sm text-gray-400">{formatDate(transaction.created_at_date)}</div>
																</div>
																<div className="text-base sm:text-lg font-bold text-blue-400">
																	₹{(transaction.amount / 100).toFixed(2)}
																</div>
															</div>
														</div>
													))}

													{/* Load More Indicator */}
													{isLoadingMoreTransactions && (
														<div className="text-center py-4">
															<div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
															<p className="text-gray-400 text-sm mt-2">Loading more transactions...</p>
														</div>
													)}

													{/* End of Results Indicator */}
													{!hasMoreTransactions && transactions.length > 0 && (
														<div className="text-center py-4 text-gray-500 text-sm">
															No more transactions to load
														</div>
													)}
												</div>
											)}
										</div>
									)}

									{activeView === 'edit-details' && groupInfo && (
										<EditGroupDetails
											groupId={groupId}
											initialName={groupInfo.name}
											initialImage={groupInfo.room_dp}
											onSave={handleSaveEditDetails}
											onCancel={() => setActiveView('main')}
										/>
									)}

									{activeView === 'welcome-message' && (
										<WelcomeMessage
											groupId={groupId}
											onBack={() => setActiveView('main')}
											onSave={() => setActiveView('main')}
										/>
									)}

									{activeView === 'mailbox' && (
										<div className="space-y-4">Mailbox View</div>
										// <ChatMailBox
										// 	onBack={() => setActiveView('main')}
										// 	roomDetails={roomDetails}
										// />
									)}

									{/* Make Public View */}
									{activeView === 'make-public' && (
										<UploadTermsComponent
											groupId={groupId}
											onMakePublic={() => {
												setActiveView('main');
											}}
										/>
									)}

									{activeView === 'info' && groupInfo && (
										<GroupInfoView
											currentUserMapping={currentUserMapping}
											onMarkAsRead={handleInfoMarkAsRead}
										/>
									)}

									{/* Add Paid Member View */}
									{activeView === 'add-paid-member' && roomDetails && (
										<div className="space-y-3 sm:space-y-4">
											<h3 className="text-lg sm:text-xl font-bold text-white">Paid User Link</h3>
											<p className="text-gray-400">
												Anyone with SubSpace can use this link to join this group.
											</p>

											{/* Link Display */}
											<div className="bg-dark-400 rounded-lg p-4 flex items-center gap-2 sm:gap-3">
												<div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-full flex items-center justify-center">
													<Link className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
												</div>
												<div className="flex-1 font-mono text-xs sm:text-sm text-white break-all">
													{roomDetails.pay_join_link || 'https://join.subspace.money/example'}
												</div>
											</div>

											{/* Action Buttons */}
											<div className="space-y-2 sm:space-y-3">
												<button
													onClick={async () => {
														try {
															await navigator.clipboard.writeText(roomDetails.pay_join_link || '');
															setCopiedLink(true);
															setTimeout(() => setCopiedLink(false), 2000);
														} catch (error) {
															console.error('Failed to copy link:', error);
														}
													}}
													className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors"
												>
													<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-500/20 rounded flex items-center justify-center">
														<svg className="h-3.5 w-3.5 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
														</svg>
													</div>
													<span className="text-sm sm:text-base font-medium text-white">
														{copiedLink ? 'Link Copied!' : 'Copy Link'}
													</span>
												</button>

												<button
													onClick={() => {
														if (navigator.share) {
															navigator.share({
																title: 'Join my subscription group',
																text: 'Join my subscription group on SubSpace',
																url: roomDetails.pay_join_link || ''
															});
														} else {
															// Fallback for browsers that don't support Web Share API
															const text = `Join my subscription group: ${roomDetails.pay_join_link || ''}`;
															navigator.clipboard.writeText(text);
														}
													}}
													className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors"
												>
													<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-500/20 rounded flex items-center justify-center">
														<svg className="h-3.5 w-3.5 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
														</svg>
													</div>
													<span className="text-sm sm:text-base font-medium text-white">Share Link</span>
												</button>

												<button
													onClick={() => {
														handleResetLink(true);
													}}
													disabled={isResettingLink}
													className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 disabled:bg-dark-500 disabled:cursor-not-allowed rounded-lg transition-colors"
												>
													<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-500/20 rounded flex items-center justify-center">
														{isResettingLink ? (
															<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
														) : (
															<svg className="h-3.5 w-3.5 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
															</svg>
														)}
													</div>
													<span className="text-sm sm:text-base font-medium text-white">
														{isResettingLink ? 'Resetting...' : 'Reset Link'}
													</span>
												</button>
											</div>
										</div>
									)}

									{/* Add Unpaid Member View */}
									{activeView === 'add-unpaid-member' && roomDetails && (
										<div className="space-y-3 sm:space-y-4">
											<h3 className="text-lg sm:text-xl font-bold text-white">Unpaid User Link</h3>
											<p className="text-gray-400">
												Anyone with SubSpace can use this link to join this group.
											</p>

											{/* Link Display */}
											<div className="bg-dark-400 rounded-lg p-4 flex items-center gap-2 sm:gap-3">
												<div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center">
													<Link className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
												</div>
												<div className="flex-1 font-mono text-xs sm:text-sm text-white break-all">
													{roomDetails.free_join_link || 'https://join.subspace.money/example'}
												</div>
											</div>

											{/* Action Buttons */}
											<div className="space-y-2 sm:space-y-3">
												<button
													onClick={async () => {
														try {
															await navigator.clipboard.writeText(roomDetails.free_join_link || '');
															setCopiedLink(true);
															setTimeout(() => setCopiedLink(false), 2000);
														} catch (error) {
															console.error('Failed to copy link:', error);
														}
													}}
													className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors"
												>
													<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-500/20 rounded flex items-center justify-center">
														<svg className="h-3.5 w-3.5 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
														</svg>
													</div>
													<span className="text-sm sm:text-base font-medium text-white">
														{copiedLink ? 'Link Copied!' : 'Copy Link'}
													</span>
												</button>

												<button
													onClick={() => {
														if (navigator.share) {
															navigator.share({
																title: 'Join my subscription group',
																text: 'Join my subscription group on SubSpace',
																url: roomDetails.free_join_link || ''
															});
														} else {
															// Fallback for browsers that don't support Web Share API
															const text = `Join my subscription group: ${roomDetails.free_join_link || ''}`;
															navigator.clipboard.writeText(text);
														}
													}}
													className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors"
												>
													<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-500/20 rounded flex items-center justify-center">
														<svg className="h-3.5 w-3.5 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
														</svg>
													</div>
													<span className="text-sm sm:text-base font-medium text-white">Share Link</span>
												</button>

												<button
													onClick={() => {
														handleResetLink(false);
													}}
													disabled={isResettingLink}
													className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 disabled:bg-dark-500 disabled:cursor-not-allowed rounded-lg transition-colors"
												>
													<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-500/20 rounded flex items-center justify-center">
														{isResettingLink ? (
															<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
														) : (
															<svg className="h-3.5 w-3.5 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
															</svg>
														)}
													</div>
													<span className="text-sm sm:text-base font-medium text-white">
														{isResettingLink ? 'Resetting...' : 'Reset Link'}
													</span>
												</button>
											</div>
										</div>
									)}
								</>
							)}
						</div>
					</div>

					{/* Members Section - Only show in main view */}
					{activeView === 'main' && (
						<>
							{/* Add Member Section - Only visible to admin */}
							{groupInfo?.admin?.auth_fullname?.id === user?.id && (
								<div className="border-t border-gray-700 p-3 sm:p-4">
									<h3 className="text-base sm:text-lg font-bold text-gray-400 mb-3 sm:mb-4">Add Members</h3>
									<div className="space-y-2 sm:space-y-3">
										<button
											onClick={() => {
												// Handle add paid member
												setActiveView('add-paid-member');
											}}
											className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
										>
											<div className="flex items-center gap-2 sm:gap-3">
												<div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-full flex items-center justify-center">
													<CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
												</div>
												<span className="text-sm sm:text-base font-medium text-white">Add Paid Member</span>
											</div>
											<Link className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
										</button>

										<button
											onClick={() => {
												// Handle add unpaid member
												setActiveView('add-unpaid-member');
											}}
											className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
										>
											<div className="flex items-center gap-2 sm:gap-3">
												<div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center">
													<UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
												</div>
												<span className="text-sm sm:text-base font-medium text-white">Add Unpaid Member</span>
											</div>
											<Link className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white transition-colors" />
										</button>
									</div>
								</div>
							)}

							<div className="border-t border-gray-700 p-3 sm:p-4">
								<h3 className="text-base sm:text-lg font-bold text-gray-400 mb-3 sm:mb-4">Members</h3>

								{isLoading ? (
									<div className="flex justify-center py-4">
										<div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-t-2 border-b-2 border-indigo-500"></div>
									</div>
								) : (
									<div className="space-y-2 sm:space-y-3">
										{groupMembers.map((member) => (
											<div
												key={member.user_id}
												className="relative flex items-center gap-3 p-3 bg-dark-400 rounded-lg"
											>
												<div
													className="relative cursor-pointer flex items-center gap-3 flex-1"
													onClick={() => setSelectedMemberForInfo(member)}
												>
													<div className="relative">
														<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
															<div className="w-full h-full rounded-full overflow-hidden bg-dark-600 relative">
																{member.dp ? (
																	<Image
																		src={member.dp}
																		alt={member.fullname}
																		fill
																		className="object-cover"
																		sizes="48px"
																	/>
																) : (
																	<div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
																		<span className="text-white text-base sm:text-lg font-bold">
																			{member.fullname.charAt(0).toUpperCase()}
																		</span>
																	</div>
																)}
															</div>
														</div>
														{member.is_admin && (
															<div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded-full flex items-center justify-center">
																<Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
															</div>
														)}
													</div>

													<div className="flex-1">
														<div className="flex items-center gap-2">
															<span className="text-sm sm:text-base font-medium text-white">{member.fullname}</span>
															{member.is_admin && (
																<span className="text-[10px] sm:text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
																	Admin
																</span>
															)}
															{member.user_id === user?.id && (
																<span className="text-[10px] sm:text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
																	You
																</span>
															)}
														</div>
														<div className="text-xs sm:text-sm text-gray-400">
															{member.is_admin ? 'Created' : 'Joined'} on {formatDate(member.joined_at)}
														</div>
														{member.average_rating > 0 && (
															<div className="flex items-center gap-1 mt-1">
																<Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-400 fill-current" />
																<span className="text-[10px] sm:text-xs text-yellow-400">{member.average_rating.toFixed(1)}</span>
																<span className="text-[10px] sm:text-xs text-gray-400">({member.number_of_ratings})</span>
															</div>
														)}
													</div>
												</div>

												{/* Three dots menu - Only show for admin and not for the admin member themselves */}
												{groupInfo?.admin?.auth_fullname?.id === user?.id && member.user_id !== user?.id && (
													<div className="relative">
														<button
															onClick={(e) => {
																e.stopPropagation();
																setMemberOptionsOpen(memberOptionsOpen === member.user_id ? null : member.user_id);
															}}
															className="p-2 text-gray-400 hover:text-white hover:bg-dark-300 rounded-lg transition-colors"
														>
															<EllipsisVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
														</button>

														{/* Options Menu */}
														{memberOptionsOpen === member.user_id && (
															<div className="absolute right-0 top-full mt-1 bg-dark-300 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		e.preventDefault();
																		setMemberOptionsOpen(null);
																		setSelectedMemberForRating(member);
																		setShowRatingModal(true);
																	}}
																	className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-200 hover:text-white transition-colors rounded-t-lg"
																>
																	Rate
																</button>
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		e.preventDefault();
																		setMemberOptionsOpen(null);
																		setMemberToRemove(member);
																		setShowRemoveMemberModal(true);
																	}}
																	className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-b-lg"
																>
																	Remove
																</button>
															</div>
														)}
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}

					{/* Footer Actions - Only show in main view */}
					{activeView === 'main' && (
						<div className="border-t border-gray-700 p-3 sm:p-4">
							{groupInfo?.admin?.auth_fullname?.id === user?.id ? (
								<button
									onClick={handleDeleteGroup}
									className="w-full py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-500/30"
								>
									<Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
									Delete Group
								</button>
							) : (
								<button
									onClick={handleLeaveGroup}
									className="w-full py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-500/30"
								>
									<LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
									Leave group request
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			{selectedMemberForInfo && (
				<CallModal
					isOpen={showCallModal}
					onClose={() => {
						setShowCallModal(false);
						setSelectedMemberForInfo(null);
					}}
					username={selectedMemberForInfo.fullname}
					userId={selectedMemberForInfo.user_id}
					friendName={selectedMemberForInfo.fullname}
				/>
			)}




			{showRatingModal && selectedMemberForRating && (
				<AdminRatingModal
					isOpen={showRatingModal}
					onClose={() => {
						setShowRatingModal(false);
						setSelectedMemberForRating(null);
					}}
					adminName={selectedMemberForRating.fullname}
					adminId={selectedMemberForRating.user_id}
					adminImage={selectedMemberForRating.dp}
					currentRating={selectedMemberForRating.average_rating}
					totalRatings={selectedMemberForRating.number_of_ratings}
					onSuccess={() => console.log('success')}
				/>
			)}



			{selectedMemberForInfo != null && (
				<FriendInfoModal
					friendId={selectedMemberForInfo.user_id}
					friendName={selectedMemberForInfo.fullname}
					userId={user?.id || ''}
					userAuthToken={user?.auth_token || ''}
					closeModal={() => setSelectedMemberForInfo(null)}
				/>
			)}

			<LeaveGroupModal
				isOpen={showLeaveModal}
				onClose={() => setShowLeaveModal(false)}
				groupId={groupId}
				groupName={groupName}
				onSuccess={handleLeaveSuccess}
			/>

			<DeleteGroupConfirmationModal
				isOpen={showDeleteConfirmation}
				onClose={() => setShowDeleteConfirmation(false)}
				groupId={groupId}
				subscriptionId={roomDetails?.whatsub_users_subscriptions?.[0]?.id || ''}
				groupName={groupName}
				onSuccess={handleDeleteSuccess}
			/>

			<RemoveMemberConfirmationModal
				isOpen={showRemoveMemberModal}
				onClose={() => {
					setShowRemoveMemberModal(false);
					setMemberToRemove(null);
				}}
				memberName={memberToRemove?.fullname || ''}
				memberId={memberToRemove?.user_id || ''}
				groupId={groupId}
				onSuccess={() => {
					setShowRemoveMemberModal(false);
					setMemberToRemove(null);
					fetchGroupDetails(); // Refresh group details to update member list
				}}
			/>

			<GroupDeleteRestrictionModal
				isOpen={showDeleteRestrictionModal}
				onClose={() => setShowDeleteRestrictionModal(false)}
				groupName={groupName}
				memberCount={groupMembers.filter(member => member.user_id !== user?.id).length}
			/>

			<LeaveGroupRestrictionModal
				isOpen={showLeaveRestrictionModal}
				onClose={() => setShowLeaveRestrictionModal(false)}
				hoursRemaining={hoursRemainingToLeave}
			/>
		</>
	);
};

export default GroupInfoModal;