"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
	TrendingUp,
	Package,
	CreditCard,
	Plus,
	Clock,
	Users,
	Zap,
	ChevronRight,
	Wallet,
	Bell,
	Settings,
	Share2
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import SubscriptionManagementModal from '@/components/subscription-management-modal';
import ShareSubscriptionModal from '@/components/share-subscription-modal';
import { useLanguageStore } from '@/lib/store/language-store';
import SubscriptionsSkeleton from './subscriptions-skeleton';
import ProtectedRoute from '@/components/protected-route';

// Types
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

interface BBPSOption {
	id: string;
	icon: string;
	data: {
		args?: {
			brand_id?: string;
		};
		route: string;
	};
	type: string;
	name: string;
	discount_text: string;
	created_at: string;
}

interface PaymentData {
	due_amount: number;
	bbps_options: BBPSOption[];
}

// Header Component
const HeaderSection = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();

	return (
			<div className="relative overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-purple-500/10"></div>
			<div className="relative page-container py-6 sm:py-8 md:py-12">
				<div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-8">
					<div className="flex-1 text-center lg:text-left w-full">
						<div className="flex items-center justify-between mb-4 sm:mb-6">
							<div className="flex items-center gap-2 sm:gap-4 min-w-0">
								<div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-dark-400 border-2 border-indigo-500/30 flex-shrink-0 relative">
									{user?.dp ? (
										<Image
											src={user.dp}
											alt={user?.fullname || user?.name || 'User'}
											fill
											className="object-cover"
										/>
									) : (
										<div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
											<span className="text-white text-base sm:text-xl md:text-2xl font-bold">
												{(user?.fullname || user?.name || 'U').charAt(0).toUpperCase()}
											</span>
										</div>
									)}
								</div>
								<div className="flex flex-col justify-center min-w-0 flex-1">
									<p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">{t('home.welcomeBack')},</p>
									<h2 className="text-base sm:text-xl md:text-2xl font-semibold text-white truncate">
										{user?.fullname || user?.name || 'User'}
									</h2>
								</div>
							</div>
						</div>						<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
							<Link href="/" className="btn btn-primary text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
								<Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
								{t('home.explore')}
							</Link>
							<Link href="/wallet" className="btn btn-secondary text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
								<Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
								{t('home.wallet')}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Due Amount Alert Component with data fetching
const DueAmountAlert = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [dueAmount, setDueAmount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchDueAmount = async () => {
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
							query GetDue($user_id: uuid!) {
								__typename
								w_getDue(request: {user_id: $user_id}) {
									__typename
									due_amount
								}
							}
						`,
						variables: {
							user_id: user.id
						}
					})
				});

				const data = await response.json();
				setDueAmount(data.data?.w_getDue?.due_amount || 0);
			} catch (error) {
				console.error('Error fetching due amount:', error);
			} finally {
				setIsLoading(false);
			}
		};

		if (user?.id && user?.auth_token) {
			fetchDueAmount();
		}
	}, [user?.id, user?.auth_token]);

	if (isLoading || dueAmount <= 0) return null;

	return (
		<div className="bg-linear-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4 sm:p-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
					<div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
						<Bell className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="text-sm sm:text-lg font-bold text-orange-400">{t('home.paymentDue')}</h3>
						<p className="text-xs sm:text-base text-gray-300 truncate">{t('home.pendingPayments')} ₹{dueAmount.toFixed(2)}</p>
					</div>
				</div>
				<Link href="/wallet" className="btn btn-primary text-sm sm:text-base px-3 sm:px-4 py-2 whitespace-nowrap flex-shrink-0">
					{t('home.payNow')}
				</Link>
			</div>
		</div>
	);
};

// Action Buttons Component
const ActionButtons = () => {
	const { t } = useLanguageStore();

	return (
		<section>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
				<Link
					href="/trending-subscriptions"
					className="bg-dark-500 rounded-xl p-4 sm:p-6 hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-indigo-500/50 group"
				>
					<div className="flex items-center gap-3 sm:gap-4">
						<div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors flex-shrink-0">
							<Plus className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
						</div>
						<div className="min-w-0">
							<h3 className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{t('home.addSubscriptions')}</h3>
							<p className="text-gray-400 text-xs sm:text-sm">{t('home.addSubscriptionsSubtitle')}</p>
						</div>
					</div>
				</Link>

				<Link
					href="/quick-payments"
					className="bg-dark-500 rounded-xl p-4 sm:p-6 hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-orange-500/50 group"
				>
					<div className="flex items-center gap-3 sm:gap-4">
						<div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors flex-shrink-0">
							<CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
						</div>
						<div className="min-w-0">
							<h3 className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{t('home.billPayments')}</h3>
							<p className="text-gray-400 text-xs sm:text-sm">{t('home.billPaymentsSubtitle')}</p>
						</div>
					</div>
				</Link>
			</div>
		</section>
	);
};

// Subscription Card Component
const SubscriptionCard = ({
	subscription,
	onManage,
	onShare
}: {
	subscription: UserSubscription;
	onManage: (sub: UserSubscription) => void;
	onShare: (sub: UserSubscription) => void;
}) => {
	const { t } = useLanguageStore();

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

	const expiryInfo = formatExpiryDate(subscription.expiring_at);
	const monthlyPrice = subscription.whatsub_plan.duration_type === 'years'
		? subscription.price / 12
		: subscription.price;
	const shareLimit = subscription.share_limit;
	const userPrice = monthlyPrice / shareLimit;

	return (
		<div className="flex-none w-80 bg-dark-500 rounded-xl p-6 hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-indigo-500/50 group">
			<div className="flex items-center gap-4 mb-4">
				<div className="w-16 h-16 rounded-lg overflow-hidden bg-transparent p-1 relative">
					<Image
						src={subscription.service_image_url}
						alt={subscription.service_name}
						fill
						className="object-contain"
					/>
				</div>
				<div className="flex-1">
					<h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">
						{subscription.service_name}
					</h3>
					<p className="text-sm text-gray-400">{subscription.plan}</p>
				</div>
				{subscription.room_id === null && shareLimit > 1 && (
					<button
						onClick={() => onShare(subscription)}
						className="text-green-400 hover:text-green-300 transition-colors p-2 hover:bg-green-500/10 rounded-lg"
					>
						<Share2 className="h-5 w-5" />
					</button>
				)}
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-gray-400">{t('subscription.yourShare')}: </span>
					<span className="font-bold text-[#2CFF05]">₹{userPrice.toFixed(2)}/mo</span>
				</div>

				<div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${expiryInfo.bgColor}`}>
					<Clock className="h-4 w-4" />
					<span className={expiryInfo.color}>{expiryInfo.text}</span>
				</div>

				<div className="flex items-center justify-between pt-2 border-t border-gray-700">
					<span className="text-xs text-gray-500 uppercase tracking-wide">
						{subscription.type} • {subscription.status}
					</span>
					<div className="flex items-center gap-3">
						<button
							onClick={() => onManage(subscription)}
							className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
						>
							{t('subscription.manage')}
						</button>
					</div>
				</div>

				{subscription.room_id === null && shareLimit > 1 && (
					<div className="text-xs text-indigo-400 mt-2">
						Share this subscription and earn upto ₹{(subscription.price / subscription.share_limit).toFixed(2)}
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
};

// Subscriptions Section Component with data fetching and modals
const SubscriptionsSection = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showManagementModal, setShowManagementModal] = useState(false);
	const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
	const [showShareModal, setShowShareModal] = useState(false);
	const [subscriptionToShare, setSubscriptionToShare] = useState<UserSubscription | null>(null);

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
						query GetUserSubs($user_id: uuid = "", $limit: Int, $offset: Int) {
							__typename
							whatsub_users_subscription(where: {user_id: {_eq: $user_id}, whatsub_service: {status: {_eq: "active"}}, status: {_neq: "inactive"}}, order_by: [{expiring_at: asc_nulls_last}, {created_at: asc}], limit: $limit, offset: $offset) {
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
						user_id: user.id,
						limit: 10,
						offset: 0
					}
				})
			});

			const data = await response.json();
			setSubscriptions(data.data?.whatsub_users_subscription || []);
		} catch (error) {
			console.error('Error fetching subscriptions:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchUserSubscriptions();
		}
	}, [user?.id, user?.auth_token]);

	const handleManageSubscription = (subscription: UserSubscription) => {
		setSelectedSubscription(subscription);
		setShowManagementModal(true);
	};

	const handleShareSubscription = (subscription: UserSubscription) => {
		setSubscriptionToShare(subscription);
		setShowShareModal(true);
	};

	const handleModalSuccess = () => {
		fetchUserSubscriptions();
	};

	return (
		<>
			<section>
				<div className="flex items-center justify-between gap-3 mb-6">
					<div className="flex-1 min-w-0">
						<h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{t('home.recurringExpenses')}</h2>
						<p className="text-sm sm:text-base text-gray-400 hidden sm:block">{t('home.recurringExpensesSubtitle')}</p>
					</div>

					<Link href="/user-subscriptions" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 whitespace-nowrap text-sm sm:text-base flex-shrink-0">
						{t('common.viewAll')}
						<ChevronRight className="h-4 w-4" />
					</Link>
				</div>

				{isLoading ? (
					<SubscriptionsSkeleton count={6} />
				) : subscriptions.length === 0 ? (
					<div className="bg-dark-500 rounded-xl p-12 text-center">
						<div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<Package className="h-8 w-8 text-indigo-400" />
						</div>
						<h3 className="text-xl font-bold mb-2">{t('home.noSubscriptions')}</h3>
						<p className="text-gray-400 mb-6">{t('home.noSubscriptionsSubtitle')}</p>
						<Link href="/" className="w-[70%] mx-auto btn btn-primary">
							<Plus className="h-4 w-4 mr-2" />
							{t('home.explore')}
						</Link>
					</div>
				) : (
					<div className="relative">
						<div className="overflow-x-auto pb-4 hide-scrollbar">
							<div className="flex space-x-4 px-1">
								{subscriptions.slice(0, 6).map((subscription) => (
									<SubscriptionCard
										key={subscription.id}
										subscription={subscription}
										onManage={handleManageSubscription}
										onShare={handleShareSubscription}
									/>
								))}
							</div>
						</div>
					</div>
				)}
			</section>

			<SubscriptionManagementModal
				isOpen={showManagementModal}
				onClose={() => setShowManagementModal(false)}
				subscription={selectedSubscription}
				onSuccess={handleModalSuccess}
			/>

			{subscriptionToShare && (
				<ShareSubscriptionModal
					isOpen={showShareModal}
					onClose={() => setShowShareModal(false)}
					subscription={subscriptionToShare}
				/>
			)}
		</>
	);
};

// Payment Option Card Component
const PaymentOptionCard = ({
	option,
	onClick
}: {
	option: BBPSOption;
	onClick: (option: BBPSOption) => void;
}) => {
	return (
		<button
			onClick={() => onClick(option)}
			className="flex-none w-36 bg-transparent rounded-xl px-2 hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-indigo-500/50 group text-center"
		>
			<div className="flex flex-col items-center mb-4">
				<div className="w-16 h-16 mx-2 mb-1 rounded-lg overflow-hidden bg-transparent p-1 group-hover: transition-colors relative">
					<Image
						src={option.icon}
						alt={option.name}
						fill
						className="object-contain"
					/>
				</div>
				<h3 className="font-medium text-sm mb-1 group-hover:text-indigo-400 transition-colors">
					{option.name}
				</h3>
				{option.discount_text && option.discount_text !== "0" && (
					<div className="text-xs text-green-400 bg-green-500/10 px-2 rounded-full">
						{option.discount_text}
					</div>
				)}
			</div>
		</button>
	);
};

// Payment Options Section Component with data fetching
const PaymentOptionsSection = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const router = useRouter();
	const [bbpsOptions, setBbpsOptions] = useState<BBPSOption[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchPaymentOptions = async () => {
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
							query GetBBPSOptions($user_id: uuid!) {
								__typename
								whatsubGetBBPSOptionsHome(request: {user_id: $user_id}) {
									__typename
									bbps_options {
										__typename
										icon
										data
										type
										name
										id
										discount_text
										created_at
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
				setBbpsOptions(data.data?.whatsubGetBBPSOptionsHome?.bbps_options || []);
			} catch (error) {
				console.error('Error fetching payment options:', error);
			} finally {
				setIsLoading(false);
			}
		};

		if (user?.id && user?.auth_token) {
			fetchPaymentOptions();
		}
	}, [user?.id, user?.auth_token]);

	const handleBBPSOptionClick = (option: BBPSOption) => {
		const args = option.data?.args;

		if (args) {
			let route;

			switch (option.data?.route) {
				case 'brand':
					route = 'products';
					break;
				default:
					route = 'payments'
			}

			router.push(`/${route}/${args.brand_id}`);
		} else if (option.data?.route) {
			if (option.data?.route === 'mobile_recharge') {
				router.push('/mobile-recharge');
			} else {
				router.push(`/${option.data.route}`);
			}
		}
	};

	return (
		<section>
			<div className="flex items-center justify-between gap-3 mb-6">
				<div className="flex-1 min-w-0">
					<h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{t('home.quickPayments')}</h2>
					<p className="text-sm sm:text-base text-gray-400 hidden sm:block">{t('home.quickPaymentsSubtitle')}</p>
				</div>
				<Link href="/quick-payments" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 whitespace-nowrap text-sm sm:text-base flex-shrink-0">
					{t('common.viewAll')}
					<ChevronRight className="h-4 w-4" />
				</Link>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="bg-dark-500 rounded-xl p-4 animate-pulse">
							<div className="w-12 h-12 bg-dark-400 rounded-lg mx-auto mb-3"></div>
							<div className="h-3 bg-dark-400 rounded mb-2"></div>
							<div className="h-2 bg-dark-400 rounded w-2/3 mx-auto"></div>
						</div>
					))}
				</div>
			) : bbpsOptions.length === 0 ? (
				<div className="bg-dark-500 rounded-xl p-8 text-center">
					<div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<CreditCard className="h-6 w-6 text-gray-500" />
					</div>
					<p className="text-gray-400">{t('quickPayments.noOptions')}</p>
				</div>
			) : (
				<div className="relative">
					<div className="overflow-x-auto pb-4 hide-scrollbar">
						<div className="flex space-x-4 px-1">
							{bbpsOptions.slice(0, 12).map((option) => (
								<PaymentOptionCard
									key={option.id}
									option={option}
									onClick={handleBBPSOptionClick}
								/>
							))}
						</div>
					</div>
				</div>
			)}
		</section>
	);
};

// Quick Actions Section Component
const QuickActionsSection = () => {
	const { t } = useLanguageStore();

	return (
		<section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
			<Link href="/" className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-4 sm:p-6 hover:from-indigo-500/30 hover:to-purple-500/30 transition-all duration-300 group">
				<div className="flex items-center gap-3 sm:gap-4">
					<div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors flex-shrink-0">
						<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
					</div>
					<div className="min-w-0">
						<h3 className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{t('home.exploreServices')}</h3>
						<p className="text-gray-400 text-xs sm:text-sm">{t('home.discoverSubscriptions')}</p>
					</div>
				</div>
			</Link>

			<Link href="/public-groups" className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 sm:p-6 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 group">
				<div className="flex items-center gap-3 sm:gap-4">
					<div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors flex-shrink-0">
						<Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
					</div>
					<div className="min-w-0">
						<h3 className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{t('home.joinGroups')}</h3>
						<p className="text-gray-400 text-xs sm:text-sm">{t('home.shareCosts')}</p>
					</div>
				</div>
			</Link>

			<Link href="/profile" className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4 sm:p-6 hover:from-orange-500/30 hover:to-red-500/30 transition-all duration-300 group">
				<div className="flex items-center gap-3 sm:gap-4">
					<div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors flex-shrink-0">
						<Settings className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
					</div>
					<div className="min-w-0">
						<h3 className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{t('home.manageAccount')}</h3>
						<p className="text-gray-400 text-xs sm:text-sm">{t('home.updateProfile')}</p>
					</div>
				</div>
			</Link>
		</section>
	);
};

// HomePage Container
const HomePage = () => {
	return (
		<ProtectedRoute>
			<div className="pt-16 min-h-screen bg-linear-to-br from-dark-600 via-dark-700 to-dark-800">
				<HeaderSection />

				<div className="page-container space-y-8 pb-16">
					<DueAmountAlert />
					<ActionButtons />
					<SubscriptionsSection />
					<PaymentOptionsSection />
					<QuickActionsSection />
				</div>
			</div>
		</ProtectedRoute>
	);
};

export default HomePage;
