'use client';


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-react';
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from '@/lib/store/auth-store';
import QRPaymentModal from '@/components/qr-payment-modal';
import { useLanguageStore } from '@/lib/store/language-store';
import CartSkeleton from './cart-skeleton';
import { toast } from 'react-hot-toast';

import { useCart, CART_BASE_KEY } from '@/lib/hooks/cart/use-cart';
import { useAddToCartMutation } from '@/lib/hooks/cart/use-add-to-cart';
import { useRemoveFromCartMutation } from '@/lib/hooks/cart/use-remove-from-cart';
import { RENTAL_HISTORY_BASE_KEY } from '@/lib/hooks/rent/use-rental-history';

import { useWalletBalance, WALLET_BALANCE_BASE_KEY } from '@/lib/hooks/wallet/use-wallet-balance';
import { TRANSACTIONS_BASE_KEY } from '@/lib/hooks/wallet/use-transactions';
import ProtectedRoute from '@/components/protected-route';


const CartPage = () => {
	const router = useRouter();
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [couponCode, setCouponCode] = useState('');
	const [coupons, setCoupons] = useState<any[]>([]);
	const [couponError, setCouponError] = useState<string | null>(null);
	const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);
	const [checkoutSuccess, setCheckoutSuccess] = useState(false);
	const [selectedCoupon, setSelectedCoupon] = useState<string>('');


	const { data: cartData, isLoading: isCartItemsLoading, error: cartDataError } = useCart(user);
	const addToCartMutation = useAddToCartMutation({ user_id: user?.id || '', auth_token: user?.auth_token || '' });
	const removeFromCartMutation = useRemoveFromCartMutation({ user_id: user?.id || '', auth_token: user?.auth_token || '' });

	const { data } = useWalletBalance({ userId: user?.id || '', authToken: user?.auth_token || '' });
	const unlockedAmount = data?.unlocked_amount || 0;

	const queryClient = useQueryClient();

	useEffect(() => {
		fetchCoupons();
	}, [user?.id]);

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
            query GetCoupons($user_id: uuid = "") {
              __typename
              whatsub_coupons(where: {user_id: {_eq: $user_id}, allowed_on_brands: {_eq: true}, available: {_gte: "1"}}) {
                __typename
                coupon_code
                available
                max_amount
                discount_percentage
                coupon_md
                expiring_at
                product_id
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

	const handleApplyCoupon = async () => {
		if (!user?.id || !user?.auth_token || !couponCode.trim()) return;

		setIsApplyingCoupon(true);
		setCouponError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($user_id: uuid = "", $coupon_code: String = "", $type: String = "brand") {
              __typename
              wAddCoupon(request: {coupon_code: $coupon_code, user_id: $user_id, type: $type}) {
                __typename
                id
                coupon_code
                max_amount
                discount_percentage
                coupon_md
                product_id
              }
            }
          `,
					variables: {
						user_id: user.id,
						coupon_code: couponCode.trim(),
						type: "brand"
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setCouponError(data.errors[0]?.message || t('error.invalidCoupon'));
			} else if (data.data?.wAddCoupon) {
				// Cart will refresh automatically via React Query
				setCouponCode('');
			} else {
				setCouponError(t('error.invalidCoupon'));
			}
		} catch (error) {
			setCouponError(t('error.couponApplyFailed'));
		} finally {
			setIsApplyingCoupon(false);
		}
	};

	const handlePaymentSuccess = () => {
		setShowPaymentModal(false);

		setCheckoutSuccess(true);
		queryClient.invalidateQueries({ queryKey: [RENTAL_HISTORY_BASE_KEY, user?.id] });
		queryClient.invalidateQueries({ queryKey: [CART_BASE_KEY, user?.id] });
		queryClient.invalidateQueries({ queryKey: [WALLET_BALANCE_BASE_KEY, user?.id] });
		queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_BASE_KEY, user?.id] });

		setTimeout(() => {
			router.push('/profile/order-history');
		}, 1000);
	};

	const handlePayment = async () => {
		if (!user?.id || !user?.auth_token) {
			router.push('/auth')
		}

		setIsProcessing(true);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						mutation MyMutation($order_id: uuid = "", $user_id: uuid = "", $coupon_code: String = "") {
							__typename
							whatsubPurchaseCart(request: {order_id: $order_id, user_id: $user_id, coupon_code: $coupon_code}) {
								__typename
								affected_rows
								details
							}
							}
						`,
					variables: {
						user_id: user.id,
						order_id: cartData?.id,
						coupon_code: selectedCoupon || ''
					}
				})
			});

			const data = await response.json();
			if (data.errors) {
				toast.error(data.errors[0]?.message || 'Payment Failed');
				return;
			}

			const result = data.data?.whatsubPurchaseCart;
			const amountRequired = result?.details?.amount_required;
			const orderId = result?.details?.order_id;

			if (amountRequired) {
				// Show payment modal for the required amount
				const requiredAmount = result.details.amount_required / 100;
				setPendingPaymentAmount(requiredAmount);
				setShowPaymentModal(true);
			} else if (orderId) {
				handlePaymentSuccess();
				toast.success('Purchase Successuful');
			} else {
				toast.error('Payment Failed');
			}
		} catch (error) {
			console.error('Error processing payment:', error);
			toast.error('Payment Failed');
		} finally {
			setIsProcessing(false);
		}
	};


	const subtotal = cartData?.items?.reduce((total, item) => total + (item.discounted_price * item.quantity), 0) || 0;
	const total = Math.max(0, (subtotal - (unlockedAmount / 100)));

	if (checkoutSuccess) {
		return (
			<div className="page-container pt-24">
				<div className="max-w-2xl mx-auto">
					<div className="bg-dark-500 rounded-xl p-12 text-center">
						<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<ShoppingBag className="h-8 w-8 text-green-400" />
						</div>
						<h1 className="text-2xl font-bold mb-4">{t('cart.orderSuccessful')}</h1>
						<p className="text-gray-400 mb-6">{t('cart.orderProcessed')}</p>
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-[2000px] px-2 md:px-4 pt-24 md:pt-12 pb-8 md:pb-12">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">{t('cart.title')}</h1>
			</div>

			{isCartItemsLoading ? (
				<CartSkeleton count={3} showOrderSummary={true} />
			) : !cartData?.items || cartData.items.length === 0 ? (
				<div className="bg-dark-500 rounded-lg p-6 md:p-8 text-center">
					<div className="flex justify-center mb-4">
						<ShoppingBag className="h-12 w-12 md:h-16 md:w-16 text-gray-500" />
					</div>
					<h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{t('cart.empty')}</h2>
					<Link href="/" className="btn btn-primary max-w-[70%] mx-auto">
						{t('cart.startShopping')}
					</Link>
				</div>
			) : (
				<div className="flex flex-col-reverse lg:flex-row justify-center gap-6 max-w-7xl mx-auto">
					{/* Cart Items */}
					<div className="flex-1">
						<div className="bg-dark-500 rounded-lg p-4 md:p-6 max-h-[600px] overflow-y-auto scrollbar-hide">
							{cartData?.items?.map((item, index) => (
								<div key={item.id} className={`relative py-4 ${index !== cartData.items.length - 1 ? 'border-b border-gray-700' : ''}`}>
									<div className="flex gap-3 md:gap-4">
										{/* Product Image */}
										<div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-dark-600 rounded-lg overflow-hidden relative">
											<Image
												src={item.image_url}
												alt={item.service_name}
												fill
												className="object-cover"
											/>
										</div>

										{/* Product Details */}
										<div className="flex-1 min-w-0">
											<div className="flex justify-between items-start gap-3">
												<div className="flex-1">
													<h3 className="font-semibold text-sm md:text-base text-white mb-0.5 leading-tight">
														{item.service_name}
													</h3>
													<p className="text-xs md:text-sm text-gray-400">{item.plan_name}</p>
												</div>

												{/* Price on the right */}
												<div className="text-right flex-shrink-0">
													<div className="text-lg md:text-xl font-bold text-white">
														₹{item.discounted_price.toFixed(2)}
													</div>
													{item.discounted_price < item.price && (
														<div className="text-xs md:text-sm text-gray-400 line-through">
															₹{item.price.toFixed(2)}
														</div>
													)}
												</div>
											</div>

											{/* Quantity Controls or Delete Button */}
											{item.type !== 'flexi_coupon' ? (
												<div className="flex items-center gap-1.5 bg-dark-400/30 rounded-full p-1 border border-gray-700 mt-2 w-fit">
													<button
														onClick={() => removeFromCartMutation.mutate(item)}
														className="w-7 h-7 bg-dark-600 hover:bg-dark-500 text-white rounded-full flex items-center justify-center transition-colors"
													>
														<Minus className="h-3.5 w-3.5" />
													</button>
													<span className="w-8 text-center font-semibold text-white text-sm">{item.quantity}</span>
													<button
														onClick={() => addToCartMutation.mutate(item)}
														className="w-7 h-7 bg-dark-600 hover:bg-dark-500 text-white rounded-full flex items-center justify-center transition-colors"
													>
														<Plus className="h-3.5 w-3.5" />
													</button>
												</div>
											) : (
												<button
													onClick={() => removeFromCartMutation.mutate(item)}
													className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-full mt-2 transition-colors"
												>
													<Trash2 className="h-4 w-4" />
													<span className="text-sm">Remove</span>
												</button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Order Summary */}
					<div className="lg:w-96 flex-shrink-0">
						<div className="bg-dark-500 rounded-lg p-4 md:p-6">
							<h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">{t('cart.orderSummary')}</h2>

							<div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
								<div className="flex justify-between text-sm md:text-base">
									<span className="text-gray-400">{t('cart.subtotal')}</span>
									<span className='text-gray-100'>₹{subtotal.toFixed(2)}</span>
								</div>
								<div className="flex justify-between text-sm md:text-base">
									<span className="text-gray-400">Wallet Balance (₹{(unlockedAmount / 100).toFixed(2)})</span>
									<span className='text-red-400'>- ₹{(Math.min(unlockedAmount / 100, subtotal)).toFixed(2)}</span>
								</div>
								<div className="pt-3 md:pt-4 border-t border-gray-800 flex justify-between">
									<span className="font-bold text-sm md:text-base">{t('cart.total')}</span>
									<span className="font-bold text-gray-100 text-sm md:text-base">₹{total.toFixed(2)}</span>
								</div>
							</div>

							{/* Coupon Code */}
							<div className="mb-4 md:mb-6">
								<label htmlFor="coupon" className="block text-xs md:text-sm mb-2">
									{t('cart.couponCode')}
									{coupons.length > 0 && (
										<span className="text-gray-400 ml-2 text-xs">({coupons.length} {t('cart.available')})</span>
									)}
								</label>
								<div className="flex gap-0.25">
									<input
										type="text"
										id="coupon"
										placeholder={t('cart.enterCouponCode')}
										value={couponCode}
										onChange={(e) => setCouponCode(e.target.value)}
										className={`input flex-1 rounded-r-none ${couponError ? 'border-red-500' : ''}`}
									/>
									<button
										onClick={handleApplyCoupon}
										disabled={isApplyingCoupon || !couponCode.trim()}
										className={`px-4 py-1 rounded-r border border-l-0 transition-colors ${isApplyingCoupon || !couponCode.trim()
											? 'bg-dark-400 border-gray-700 text-gray-500 cursor-not-allowed'
											: 'bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600'
											}`}
									>
										{isApplyingCoupon ? 'Applying' : t('common.apply')}
									</button>
								</div>
								{couponError && (
									<p className="text-red-500 text-xs md:text-sm mt-2">{couponError}</p>
								)}
								{coupons.length > 0 && (
									<div className="mt-3 md:mt-4 space-y-2">
										<p className="text-xs md:text-sm font-medium text-gray-400">{t('cart.availableCoupons')}:</p>
										<div className="space-y-2">
											{coupons.map((coupon) => (
												<div
													key={coupon.coupon_code}
													className="bg-dark-400 p-2 rounded-md flex justify-between items-center"
												>
													<div>
														<p className="font-medium text-sm md:text-base">{coupon.coupon_code}</p>
														<p className="text-xs md:text-sm text-gray-400">
															{coupon.discount_percentage}% {t('cart.offUpTo')} ₹{coupon.max_amount}
														</p>
													</div>
													<button
														onClick={() => {
															setCouponCode(coupon.coupon_code);
															setCouponError(null);
														}}
														className="text-indigo-400 hover:text-indigo-300 text-xs md:text-sm"
													>
														{t('cart.useCode')}
													</button>
												</div>
											))}
										</div>
									</div>
								)}
							</div>

							<div className="space-y-3">
								<button
									onClick={handlePayment}
									disabled={isProcessing || !cartData?.items?.length}
									className="btn btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base"
								>
									{isProcessing ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
											<span className="hidden xs:inline">{t('common.processing')}</span>
										</>
									) : (
										t('cart.proceedToPay')
									)}
								</button>

								<Link href="/" className="flex items-center justify-center text-gray-400 hover:text-gray-300 text-xs sm:text-sm transition-colors py-1">
									{t('cart.continueShopping')}
									<ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			)}

			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={pendingPaymentAmount}
				onSuccess={handlePayment}
				onError={toast.error}
				title={t('cart.completePayment')}
				description={t('cart.addMoneyToComplete')}
			/>
		</div>
	);
};

const ProtectedCartPage = () => {
	return (
		<ProtectedRoute>
			<CartPage />
		</ProtectedRoute>
	)
}

export default ProtectedCartPage;