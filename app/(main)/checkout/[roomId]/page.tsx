'use client';


import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Wallet, Tag, AlertCircle, CheckCircle, Clock, Users, Shield, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import QRPaymentModal from '@/components/qr-payment-modal';
import { useLanguageStore } from '@/lib/store/language-store';
import ProtectedRoute from '@/components/protected-route';

interface WalletBalance {
	unlocked_amount: number;
}

interface Coupon {
	coupon_code: string;
	available: number;
	max_amount: number;
	discount_percentage: number;
	coupon_md: string;
	expiring_at: string;
}

interface GroupDetails {
	id: string;
	name: string;
	room_id: string;
	room_dp: string;
	price: number;
	share_limit: number;
	number_of_users: number;
	admin_name: string;
	plan_name: string;
	service_name: string;
	service_image_url: string;
	expiring_at: string;
}

const CheckoutPage = () => {
	const params = useParams();
	const roomId = (params?.roomId as string) || undefined;
	const router = useRouter();
	const { user } = useAuthStore();
	const { t, selectedLanguage } = useLanguageStore();
	const [groupMembers] = useState<Array<{
		user_id: string;
		fullname: string;
		dp: string;
		is_admin: boolean;
	}>>([]);

	const [walletBalance, setWalletBalance] = useState<WalletBalance>({ unlocked_amount: 0 });
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
	const [selectedCoupon, setSelectedCoupon] = useState<string>('');
	const [couponInput, setCouponInput] = useState<string>('');
	const [showCoupons, setShowCoupons] = useState(false);
	const [isLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [paymentSuccess] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [isLoadingGroup, setIsLoadingGroup] = useState(false);
	const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);
	const [isBillingCollapsed, setIsBillingCollapsed] = useState(true);

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchWalletBalance();
			fetchCoupons();

			// Try to get group details from URL params first
			if (typeof window !== 'undefined') {
				const searchParams = new URLSearchParams(window.location.search);
				const groupDataParam = searchParams.get('groupData');
				
				if (groupDataParam) {
					try {
						const parsedGroupData = JSON.parse(groupDataParam);
						setGroupDetails(parsedGroupData);
					} catch (e) {
						console.error('Error parsing group data from URL:', e);
						// If parsing fails, fetch from API
						if (roomId) {
							fetchGroupDetails();
						}
					}
				} else if (roomId) {
					// If no group data in URL, fetch from API
					fetchGroupDetails();
				}
			}
		}
	}, [user?.id, user?.auth_token, roomId]);

	const fetchGroupDetails = async () => {
		if (!roomId || !user?.auth_token) return;

		setIsLoadingGroup(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query GetGroupDetails($room_id: uuid!) {
              __typename
              whatsub_rooms(where: {id: {_eq: $room_id}}) {
                __typename
                id
                name
                room_dp
                whatsub_room_user_mappings(where: {is_admin: {_eq: true}}) {
                  __typename
                  auth_fullname {
                    __typename
                    fullname
                  }
                }
                whatsub_room_user_mappings_aggregate {
                  __typename
                  aggregate {
                    __typename
                    count
                  }
                }
                whatsub_subscription_group {
                  __typename
                  price
                  share_limit
                  expiring_at
                  whatsub_plan {
                    __typename
                    plan_name
                    whatsub_service {
                      __typename
                      service_name
                      image_url
                    }
                  }
                }
              }
            }
          `,
					variables: {
						room_id: roomId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(t('error.groupDetailsFailed'));
				return;
			}

			const room = data.data?.whatsub_rooms?.[0];
			if (room && room.whatsub_subscription_group) {
				const group = room.whatsub_subscription_group;
				const adminName = room.whatsub_room_user_mappings?.[0]?.auth_fullname?.fullname || t('group.unknownAdmin');
				const numberOfUsers = room.whatsub_room_user_mappings_aggregate?.aggregate?.count || 0;

				setGroupDetails({
					id: room.id,
					name: room.name,
					room_id: room.id,
					room_dp: room.room_dp,
					price: group.price,
					share_limit: group.share_limit,
					number_of_users: numberOfUsers,
					admin_name: adminName,
					plan_name: group.whatsub_plan?.plan_name || t('group.defaultPlan'),
					service_name: group.whatsub_plan?.whatsub_service?.service_name || t('group.unknownService'),
					service_image_url: group.whatsub_plan?.whatsub_service?.image_url || '',
					expiring_at: group.expiring_at
				});
			} else {
				setError(t('error.groupNotFound'));
			}
		} catch (error) {
			console.error('Error fetching group details:', error);
			setError(t('error.groupDetailsFailed'));
		} finally {
			setIsLoadingGroup(false);
		}
	};

	const fetchWalletBalance = async () => {
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
            query MyQuery($user_id: uuid = "") {
              __typename
              whatsub_user_wallet_locked_unlocked_internal(where: {user_id: {_eq: $user_id}}) {
                __typename
                unlocked_amount
              }
            }
          `,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();
			const balance = data.data?.whatsub_user_wallet_locked_unlocked_internal?.[0];
			if (balance) {
				setWalletBalance(balance);
			}
		} catch (error) {
			console.error('Error fetching wallet balance:', error);
		}
	};

	const fetchCoupons = async () => {
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
            query MyQuery($user_id: uuid = "") {
              __typename
              whatsub_coupons(where: {user_id: {_eq: $user_id}, allowed_on_sharing: {_eq: true}, available: {_gte: "1"}}) {
                __typename
                coupon_code
                available
                max_amount
                discount_percentage
                coupon_md
                expiring_at
              }
            }
          `,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();
			setCoupons(data.data?.whatsub_coupons || []);
		} catch (error) {
			console.error('Error fetching coupons:', error);
		}
	};

	const handlePayment = async () => {
		if (!user?.id || !user?.auth_token || !roomId) return;

		setIsProcessing(true);
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
            mutation MyMutation($user_id: uuid = "", $room_id: uuid = "", $coupon_code: String = "") {
              __typename
              whatsubJoinSubscriptionGroupV2(request: {user_id: $user_id, room_id: $room_id, coupon_code: $coupon_code}) {
                __typename
                affected_rows
                details
              }
            }
          `,
					variables: {
						user_id: user.id,
						room_id: roomId,
						coupon_code: selectedCoupon || ''
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || t('error.paymentFailed'));
				return;
			}

			const result = data.data?.whatsubJoinSubscriptionGroupV2;
			if (result?.details?.amount_required) {
				// Show payment modal for the required amount
				const requiredAmount = result.details.amount_required / 100;
				setPendingPaymentAmount(requiredAmount);
				setShowPaymentModal(true);
			} else {
				setError(t('error.paymentFailed'));
			}
		} catch (error) {
			console.error('Error processing payment:', error);
			setError(t('error.paymentFailed'));
		} finally {
			setIsProcessing(false);
		}
	};

	const applyCoupon = (couponCode: string) => {
		setSelectedCoupon(couponCode);
		setCouponInput(couponCode);
		setShowCoupons(false);
	};

	const removeCoupon = () => {
		setSelectedCoupon('');
		setCouponInput('');
	};

	const calculateDiscount = () => {
		if (!selectedCoupon || !groupDetails) return 0;

		const coupon = coupons.find(c => c.coupon_code === selectedCoupon);
		if (!coupon) return 0;

		const itemPrice = Math.ceil(groupDetails.price / groupDetails.share_limit);
		const discount = Math.min((itemPrice * coupon.discount_percentage) / 100, coupon.max_amount);
		return discount;
	};

	const calculateTotal = () => {
		if (!groupDetails) return 0;

		const itemPrice = Math.ceil(groupDetails.price / groupDetails.share_limit);
		const fee = Math.ceil(itemPrice * 0.05); // 5% fee
		const discount = calculateDiscount();
		const walletDeduction = Math.min(walletBalance.unlocked_amount / 100, itemPrice + fee - discount);

		return Math.max(0, itemPrice + fee - discount - walletDeduction);
	};

	// Format date based on language
	const formatDate = (dateString: string) => {
		if (!dateString) return '';

		const date = new Date(dateString);

		// Use different date formats based on language
		if (selectedLanguage === 'hi' || selectedLanguage === 'bn') {
			// For Hindi and Bengali, use DD/MM/YYYY format
			return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
		}

		// Default format for other languages
		return date.toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const handlePaymentSuccess = () => {
		// Refresh wallet balance and retry the group join
		fetchWalletBalance().then(() => {
			handlePayment();
		});
	};

	const handlePaymentError = (errorMessage: string) => {
		setError(`${t('error.paymentFailed')}: ${errorMessage}`);
	};

	if (isLoading || isLoadingGroup) {
		return (
			<div className="page-container pt-24">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
				</div>
			</div>
		);
	}

	if (!groupDetails) {
		return (
			<div className="page-container pt-24">
				<div className="flex items-center gap-4 mb-8">
					<button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
						<ArrowLeft className="h-6 w-6" />
					</button>
				</div>
				<div className="bg-dark-500 rounded-xl p-12 text-center">
					<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<AlertCircle className="h-8 w-8 text-red-400" />
					</div>
					<h1 className="text-2xl font-bold mb-4">{t('checkout.groupNotFound')}</h1>
					<p className="text-gray-400 mb-6">{t('checkout.groupNotFoundDesc')}</p>
					<button onClick={() => router.back()} className="btn btn-primary">
						{t('common.goBack')}
					</button>
				</div>
			</div>
		);
	}

	if (paymentSuccess) {
		return (
			<div className="page-container pt-24">
				<div className="max-w-2xl mx-auto">
					<div className="bg-dark-500 rounded-xl p-12 text-center">
						<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<CheckCircle className="h-8 w-8 text-green-400" />
						</div>
						<h1 className="text-2xl font-bold mb-4">{t('wallet.paymentSuccess')}</h1>
						<p className="text-gray-400 mb-6">{t('checkout.redirectingToGroup')}</p>
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
					</div>
				</div>
			</div>
		);
	}

	const itemPrice = Math.ceil(groupDetails.price / groupDetails.share_limit);
	const fee = Math.ceil(itemPrice * 0.05);
	const discount = calculateDiscount();
	const walletDeduction = Math.min(walletBalance.unlocked_amount / 100, itemPrice + fee - discount);
	const netPayable = calculateTotal();

	return (
		<div className="page-container pt-24 pb-8">
			{/* Header */}
			<div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-8">
				<button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-1.5 md:p-2 hover:bg-dark-400 rounded-lg flex-shrink-0">
					<ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
				</button>
				<div className="flex-1 min-w-0">
					<h1 className="text-xl md:text-3xl font-bold truncate">{t('checkout.title')}</h1>
					<p className="text-xs md:text-base text-gray-400 truncate">{t('checkout.subtitle')}</p>
				</div>
			</div>

			<div className="max-w-3xl mx-auto">
				{/* Unified Checkout Card */}
				<div className="bg-gradient-to-br from-dark-500 to-dark-600 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl">

					{/* Group Details Section */}
					<div className="p-4 md:p-8 border-b border-gray-700/50">
						{/* Top row with image, title, and price */}
						<div className="flex items-start gap-3 mb-4">
							<div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-white p-2 flex-shrink-0 shadow-lg">
								{groupDetails.room_dp ? (
									<Image
										src={groupDetails.room_dp}
										alt={groupDetails.service_name}
										width={80}
										height={80}
										className="h-full w-full object-contain"
									/>
								) : (
									<div className="w-full h-full bg-gray-200 flex items-center justify-center">
										<span className="text-gray-500 text-xs">No Image</span>
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="text-base md:text-2xl font-bold mb-1 text-white leading-tight">{groupDetails.plan_name}</h3>
								<p className="text-xs md:text-base text-gray-400">{groupDetails.service_name}</p>
							</div>

						</div>

						{/* Admin and members info */}
						<div className="space-y-0.5 mb-1">
							<div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 rounded-lg p-3">
								<Users className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
								<span className="flex-1">{t('checkout.groupAdmin')} <span className="text-white">{groupDetails.admin_name}</span></span>
							</div>
							<div className="flex items-center gap-2 text-xs md:text-sm rounded-lg p-3">
								<Users className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
								<span className={`flex-1 ${groupDetails.number_of_users >= groupDetails.share_limit ? 'text-red-400' : 'text-gray-400'}`}>
									{groupDetails.number_of_users}/{groupDetails.share_limit} {t('group.members')}
									{groupDetails.number_of_users >= groupDetails.share_limit && (
										<span className="ml-2 text-xs bg-red-500/20 px-2 py-0.5 rounded-full">Full</span>
									)}
								</span>
							</div>
						</div>

						{/* Next payment */}
						<div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 rounded-lg p-3">
							<Clock className="h-4 w-4 flex-shrink-0" />
							<span>{t('checkout.nextPayment')} {formatDate(groupDetails.expiring_at)}</span>
						</div>

						{/* Group Members */}
						{groupMembers.length > 0 && (
							<div className="mt-6 pt-6 border-t border-gray-700/50">
								<h4 className="text-sm md:text-base font-medium text-gray-300 mb-4 flex items-center gap-2">
									<Users className="h-4 w-4" />
									{t('group.members')}
								</h4>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{groupMembers.map((member) => (
										<div key={member.user_id} className="flex items-center gap-3 bg-dark-400/30 rounded-lg p-3">
											<div className="relative flex-shrink-0">
												<div className="w-10 h-10 rounded-full overflow-hidden bg-dark-400 ring-2 ring-gray-700">
													{member.dp ? (
														<Image
															src={member.dp}
															alt={member.fullname}
															width={40}
															height={40}
															className="h-full w-full object-cover"
														/>
													) : (
														<div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
															<span className="text-blue-400 text-sm font-bold">
																{member.fullname.charAt(0).toUpperCase()}
															</span>
														</div>
													)}
												</div>
												{member.is_admin && (
													<div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center ring-2 ring-dark-500">
														<Shield className="h-3 w-3 text-white" />
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm text-white truncate">
													{member.fullname}
												</div>
												<div className="flex flex-wrap gap-1.5 mt-1">
													{member.is_admin && (
														<span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
															{t('group.admin')}
														</span>
													)}
													{member.user_id === user?.id && (
														<span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
															{t('common.you')}
														</span>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Billing Details Section */}
					<div className="bg-dark-400/30">
						<div
							className="px-4 md:px-8 py-4 cursor-pointer flex items-center justify-between hover:bg-dark-400/50 transition-colors"
							onClick={() => setIsBillingCollapsed(!isBillingCollapsed)}
						>
							<h3 className="text-base md:text-lg font-bold flex items-center gap-2">
								<CreditCard className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
								{t('checkout.billingDetails')}
							</h3>
							<ChevronDown
								className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isBillingCollapsed ? 'rotate-180' : ''}`}
							/>
						</div>

						{!isBillingCollapsed && (
							<div className="px-4 md:px-8 pb-4 space-y-3">
								<div className="flex justify-between items-center text-sm md:text-base">
									<span className="text-gray-400">{t('checkout.itemPrice')}</span>
									<span className="font-medium">₹{itemPrice}</span>
								</div>
								<div className="flex justify-between items-center text-sm md:text-base">
									<span className="text-gray-400">{t('checkout.fee')} (5%)</span>
									<span className="font-medium text-orange-400">+ ₹{fee}</span>
								</div>
								{discount > 0 && (
									<div className="flex justify-between items-center text-sm md:text-base">
										<span className="text-gray-400">{t('checkout.couponDiscount')}</span>
										<span className="font-medium text-[#2CFF05]">- ₹{discount}</span>
									</div>
								)}
								<div className="flex justify-between items-center text-sm md:text-base">
									<div className="flex items-center gap-2">
										<Wallet className="h-4 w-4 text-blue-400" />
										<span className="text-gray-400">{t('wallet.title')}</span>
										<span className="text-xs text-gray-500">(₹{(walletBalance.unlocked_amount / 100).toFixed(2)})</span>
									</div>
									<span className="font-medium text-[#2CFF05]">- ₹{walletDeduction.toFixed(2)}</span>
								</div>
							</div>
						)}

						<div className="px-4 md:px-8 py-4 bg-dark-500/50 border-t border-gray-700/50">
							<div className="flex justify-between items-center">
								<span className="text-base md:text-lg font-bold">{t('checkout.netPayable')}</span>
								<span className="text-xl md:text-2xl font-bold text-[#2CFF05]">₹{netPayable.toFixed(2)}</span>
							</div>
						</div>
					</div>

					{/* Coupon Section */}
					<div className="p-4 md:p-8 border-t border-gray-700/50">
						<div className="flex items-center gap-2 mb-4">
							<Tag className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
							<h3 className="text-base md:text-lg font-bold">Apply Coupon</h3>
							{coupons.length > 0 && (
								<span className="text-xs md:text-sm text-gray-400">({coupons.length} {t('cart.available')})</span>
							)}
						</div>

						<div className="relative">
							<input
								type="text"
								placeholder={t('cart.enterCouponCode')}
								value={couponInput}
								onChange={(e) => setCouponInput(e.target.value)}
								onFocus={() => setShowCoupons(true)}
								className="input w-full pr-20 md:pr-24 text-sm md:text-base"
							/>
							{selectedCoupon ? (
								<button
									onClick={removeCoupon}
									className="absolute right-0 top-0 h-full px-3 md:px-4 text-red-400 hover:text-red-300 text-xs md:text-sm rounded-r-lg font-medium"
								>
									{t('common.remove')}
								</button>
							) : groupDetails.number_of_users >= groupDetails.share_limit ? (
								<span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs md:text-sm">
									{t('group.groupFull')}
								</span>
							) : (
								<button
									onClick={() => applyCoupon(couponInput)}
									disabled={!couponInput.trim()}
									className="absolute right-0 top-0 h-full px-3 md:px-4 bg-blue-600 hover:bg-blue-500 text-xs md:text-sm disabled:bg-gray-500 disabled:cursor-not-allowed rounded-r-lg font-medium transition-colors"
								>
									{t('common.apply')}
								</button>
							)}
						</div>

						{/* Available Coupons */}
						{showCoupons && coupons.length > 0 && (
							<div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
								<p className="text-xs md:text-sm font-medium text-gray-400">{t('cart.availableCoupons')}:</p>
								{coupons.map((coupon) => (
									<div
										key={coupon.coupon_code}
										className="bg-dark-400/50 p-3 md:p-4 rounded-lg flex justify-between items-center hover:bg-dark-400 transition-colors cursor-pointer border border-gray-700/50"
										onClick={() => applyCoupon(coupon.coupon_code)}
									>
										<div className="flex-1">
											<p className="font-medium text-sm md:text-base">{coupon.coupon_code}</p>
											<p className="text-xs md:text-sm text-gray-400">
												{coupon.discount_percentage}% {t('cart.offUpTo')} ₹{coupon.max_amount}
											</p>
											<p className="text-xs text-gray-500 mt-1">
												{t('checkout.expires')}: {formatDate(coupon.expiring_at)}
											</p>
										</div>
										<div className="text-xs md:text-sm text-blue-400 font-medium">{t('cart.useCode')}</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Error Message & Payment Button */}
					<div className="p-4 md:p-8 space-y-4">
						{error && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
								<div className="flex items-center gap-2 text-red-400 text-sm md:text-base">
									<AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
									<span>{error}</span>
								</div>
							</div>
						)}

						{groupDetails.number_of_users >= groupDetails.share_limit && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
								<div className="flex items-center gap-2 text-red-400 text-sm md:text-base">
									<AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
									<span>{t('group.groupFullCannotJoin')}</span>
								</div>
							</div>
						)}

						{/* Payment Button */}
						<button
							onClick={handlePayment}
							disabled={isProcessing || netPayable < 0 || groupDetails.number_of_users >= groupDetails.share_limit}
							className="w-full py-3 md:py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none text-sm md:text-base"
						>
							{isProcessing ? (
								<>
									<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
									{t('common.processing')}
								</>
							) : (
								<>
									<CreditCard className="h-4 w-4 md:h-5 md:w-5" />
									{t('checkout.pay')} ₹{netPayable.toFixed(2)} {t('checkout.andJoin')}
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={pendingPaymentAmount}
				onSuccess={handlePaymentSuccess}
				onError={handlePaymentError}
				title={t('checkout.addMoneyTitle')}
				description={t('checkout.addMoneyDescription')}
			/>
		</div>
	);
};


const ProtectedCheckoutPage = () => {
	return (
		<ProtectedRoute>
			<CheckoutPage />
		</ProtectedRoute>
	)
}

export default CheckoutPage;