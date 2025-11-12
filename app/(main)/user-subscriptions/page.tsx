'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Clock, Users, Share2, Settings, Star, Search, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import SubscriptionManagementModal from '@/components/subscription-management-modal';
import ShareSubscriptionModal from '@/components/share-subscription-modal';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/protected-route';

interface UserSubscription {
	id: string;
	service_image_url: string;
	expiring_at: string;
	status: string;
	type: string;
	room_id: string | null;
	price: number;
	share_limit: number;
	service_name: string;
	plan: string;
	service_id: string;
	plan_id: string;
	is_public: boolean;
	whatsub_plan: {
		duration: number;
		duration_type: string;
		accounts: number;
	};
}

const UserSubscriptionsPage = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
	const [filteredSubscriptions, setFilteredSubscriptions] = useState<UserSubscription[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
	const [typeFilter, setTypeFilter] = useState<'all' | 'admin' | 'member'>('all');

	// Modal state
	const [showManagementModal, setShowManagementModal] = useState(false);
	const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
	const [showShareModal, setShowShareModal] = useState(false);
	const [subscriptionToShare, setSubscriptionToShare] = useState<UserSubscription | null>(null);

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchUserSubscriptions();
		}
	}, [user?.id, user?.auth_token]);

	useEffect(() => {
		filterSubscriptions();
	}, [subscriptions, searchQuery, statusFilter, typeFilter]);

	const fetchUserSubscriptions = async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoading(true);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query GetAllUserSubs($user_id: uuid = "") {
              __typename
              whatsub_users_subscription(
                where: {
                  user_id: {_eq: $user_id}, 
                  whatsub_service: {status: {_eq: "active"}}, 
                  status: {_neq: "inactive"}
                }, 
                order_by: [{expiring_at: asc_nulls_last}, {created_at: desc}]
              ) {
                __typename
                service_image_url
                id
                expiring_at
                status
                type
                room_id
                price
                share_limit
                service_name
                plan
                service_id
                plan_id
                is_public
                whatsub_plan {
                  __typename
                  duration
                  duration_type
                  accounts
                }
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
				toast.error('Failed to fetch subscriptions');
				return;
			}

			setSubscriptions(data.data?.whatsub_users_subscription || []);
		} catch (error) {
			console.error('Error fetching subscriptions:', error);
			toast.error('Failed to fetch subscriptions');
		} finally {
			setIsLoading(false);
		}
	};

	const filterSubscriptions = () => {
		let filtered = [...subscriptions];

		// Apply search filter
		if (searchQuery) {
			filtered = filtered.filter(sub =>
				sub.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				sub.plan.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Apply status filter
		if (statusFilter !== 'all') {
			const now = new Date();
			filtered = filtered.filter(sub => {
				const expiryDate = new Date(sub.expiring_at);
				const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

				switch (statusFilter) {
					case 'active':
						return sub.status === 'active' && daysUntilExpiry > 7;
					case 'expiring':
						return sub.status === 'active' && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
					case 'expired':
						return daysUntilExpiry <= 0;
					default:
						return true;
				}
			});
		}

		// Apply type filter
		if (typeFilter !== 'all') {
			filtered = filtered.filter(sub => sub.type === typeFilter);
		}

		setFilteredSubscriptions(filtered);
	};

	const handleManageSubscription = (subscription: UserSubscription) => {
		setSelectedSubscription(subscription);
		setShowManagementModal(true);
	};

	const handleShareSubscription = (subscription: UserSubscription) => {
		setSubscriptionToShare(subscription);
		setShowShareModal(true);
	};

	const handleModalSuccess = () => {
		// Refresh subscriptions after successful action
		fetchUserSubscriptions();
	};

	const formatExpiryDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return { text: 'Expired', color: 'text-red-400', bgColor: 'bg-red-500/10' };
		} else if (diffDays <= 7) {
			return { text: `${diffDays} ${t('subscription.daysLeft')}`, color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
		} else if (diffDays <= 30) {
			return { text: `${diffDays} ${t('subscription.daysLeft')}`, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
		} else {
			return { text: `${diffDays} ${t('subscription.daysLeft')}`, color: 'text-green-400', bgColor: 'bg-green-500/10' };
		}
	};

	const getStatusCounts = () => {
		const now = new Date();
		let active = 0, expiring = 0, expired = 0;

		subscriptions.forEach(sub => {
			const expiryDate = new Date(sub.expiring_at);
			const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

			if (sub.status === 'active' && daysUntilExpiry > 7) {
				active++;
			} else if (sub.status === 'active' && daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
				expiring++;
			} else if (daysUntilExpiry <= 0) {
				expired++;
			}
		});

		return { active, expiring, expired };
	};

	const statusCounts = getStatusCounts();

	return (
		<div className="page-container pt-20 md:pt-24">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<Link href="/manage" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
					<ArrowLeft className="h-6 w-6" />
				</Link>
				<div className="flex-1">
					<h1 className="text-3xl font-bold flex items-center gap-3">
						<Package className="h-8 w-8 text-indigo-400" />
						Your Subscriptions
					</h1>
					<p className="text-gray-400">Manage all your tracked subscriptions</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={fetchUserSubscriptions}
						disabled={isLoading}
						className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
					>
						<RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
					</button>
					<div className="hidden md:flex items-center gap-2 bg-dark-500 rounded-lg p-3">
						<Package className="h-5 w-5 text-indigo-400" />
						<span className="text-sm font-medium">{filteredSubscriptions.length} subscriptions</span>
					</div>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
							<Package className="h-6 w-6 text-blue-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-blue-400">{subscriptions.length}</h3>
							<p className="text-gray-300">Total</p>
						</div>
					</div>
				</div>

				<div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
							<Star className="h-6 w-6 text-green-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-green-400">{statusCounts.active}</h3>
							<p className="text-gray-300">Active</p>
						</div>
					</div>
				</div>

				<div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
							<Clock className="h-6 w-6 text-orange-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-orange-400">{statusCounts.expiring}</h3>
							<p className="text-gray-300">Expiring Soon</p>
						</div>
					</div>
				</div>

				<div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
							<Clock className="h-6 w-6 text-red-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-red-400">{statusCounts.expired}</h3>
							<p className="text-gray-300">Expired</p>
						</div>
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="rounded-xl md:p-6 mb-8 flex flex-col lg:flex-row gap-4">
				{/* Search */}
				<div className="relative flex-1">
					<input
						type="text"
						placeholder="Search subscriptions..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="input pl-12 py-3 text-lg w-full"
					/>
					<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
				</div>
			</div>

			{/* Loading State */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 6 }).map((_, index) => (
						<div key={index} className="bg-dark-500 rounded-xl p-6 border border-gray-700/50">
							<div className="animate-pulse">
								<div className="flex items-center gap-4 mb-4">
									<div className="w-16 h-16 bg-dark-400 rounded-lg"></div>
									<div className="flex-1">
										<div className="h-4 bg-dark-400 rounded mb-2"></div>
										<div className="h-3 bg-dark-400 rounded w-2/3"></div>
									</div>
								</div>
								<div className="space-y-3">
									<div className="h-3 bg-dark-400 rounded"></div>
									<div className="h-3 bg-dark-400 rounded w-3/4"></div>
									<div className="h-8 bg-dark-400 rounded"></div>
								</div>
							</div>
						</div>
					))}
				</div>
			) : filteredSubscriptions.length === 0 ? (
				<div className="bg-dark-500 rounded-xl p-12 text-center">
					<div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<Package className="h-8 w-8 text-indigo-400" />
					</div>
					<h3 className="text-xl font-bold mb-2">
						{searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
							? 'No Matching Subscriptions'
							: 'No Subscriptions Found'
						}
					</h3>
					<p className="text-gray-400 mb-6">
						{searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
							? 'Try adjusting your search or filter criteria'
							: 'Start by adding your first subscription to track'
						}
					</p>
					<div className="flex gap-4 justify-center">
						{(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
							<button
								onClick={() => {
									setSearchQuery('');
									setStatusFilter('all');
									setTypeFilter('all');
								}}
								className="btn btn-secondary"
							>
								Clear Filters
							</button>
						)}
						<Link href="/trending-subscriptions" className="btn btn-primary">
							<Package className="h-4 w-4 mr-2" />
							Add Subscription
						</Link>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-20rem)] overflow-y-auto hide-scrollbar md:max-h-full">
					{filteredSubscriptions.map((subscription) => {
						const expiryInfo = formatExpiryDate(subscription.expiring_at);
						const monthlyPrice = subscription.whatsub_plan.duration_type === 'years'
							? subscription.price / 12
							: subscription.price;
						const shareLimit = subscription.share_limit;
						const userPrice = monthlyPrice / shareLimit;

						return (
							<div key={subscription.id} className="bg-dark-500 rounded-xl p-6 hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-indigo-500/50 group">
								<div className="flex items-center gap-4 mb-4">
									<div className="w-16 h-16 rounded-lg overflow-hidden bg-transparent p-1">
										<Image
											src={subscription.service_image_url}
											alt={subscription.service_name}
											width={64}
											height={64}
											className="h-full w-full object-contain"
										/>
									</div>
									<div className="flex-1">
										<div className="flex items-start justify-between">
											<div>
												<h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">
													{subscription.service_name}
												</h3>
												<p className="text-sm text-gray-400">{subscription.plan}</p>
											</div>
											<div className="flex items-center gap-2">
												{subscription.room_id === null && shareLimit > 1 && (
													<button
														onClick={() => handleShareSubscription(subscription)}
														className="text-green-400 hover:text-green-300 transition-colors p-2 hover:bg-green-500/10 rounded-lg"
													>
														<Share2 className="h-4 w-4" />
													</button>
												)}
											</div>
										</div>
									</div>
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-gray-400">{t('subscription.yourShare')}: </span>
										<span className="font-bold text-[#2CFF05]">₹{userPrice.toFixed(2)}/mo</span>
									</div>

									{subscription.share_limit > 1 && (
										<div className="flex items-center gap-2 text-sm text-gray-400">
											<Users className="h-4 w-4" />
											<span>{t('subscription.sharedWith')} {subscription.share_limit - 1} {t('subscription.others')}</span>
										</div>
									)}

									<div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${expiryInfo.bgColor}`}>
										<Clock className="h-4 w-4" />
										<span className={expiryInfo.color}>{expiryInfo.text}</span>
									</div>

									<div className="flex items-center justify-between pt-2 border-t border-gray-700">
										<span className="text-xs text-gray-500 uppercase tracking-wide">
											{subscription.type} • {subscription.status}
										</span>
										<button
											onClick={() => handleManageSubscription(subscription)}
											className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors flex items-center gap-1"
										>
											<Settings className="h-4 w-4" />
											{t('subscription.manage')}
										</button>
									</div>

									{subscription.room_id === null && shareLimit > 1 && (
										<div className="text-xs text-indigo-400 mt-2">
											Share this subscription and earn up to ₹{(subscription.price / subscription.share_limit).toFixed(2)}
										</div>
									)}

									{subscription.room_id && (
										<Link
											href={`/chat?groupId=${subscription.room_id}`}
											className="w-full block text-center text-xs text-white bg-indigo-600 mt-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
										>
											Go to Group Chat
										</Link>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Subscription Management Modal */}
			<SubscriptionManagementModal
				isOpen={showManagementModal}
				onClose={() => setShowManagementModal(false)}
				subscription={selectedSubscription}
				onSuccess={handleModalSuccess}
			/>

			{/* Share Subscription Modal */}
			{subscriptionToShare && (
				<ShareSubscriptionModal
					isOpen={showShareModal}
					onClose={() => setShowShareModal(false)}
					subscription={subscriptionToShare}
				/>
			)}
		</div>
	);
};


const ProtectedUserSubscriptionsPage = () => {
	return (
		<ProtectedRoute>
			<UserSubscriptionsPage />
		</ProtectedRoute>
	);
};

export default ProtectedUserSubscriptionsPage;