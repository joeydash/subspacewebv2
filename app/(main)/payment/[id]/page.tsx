'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, ExternalLink, Smartphone, Info, X, Star, Users, Shield, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import QRPaymentModal from '@/components/qr-payment-modal';

interface ServiceDetails {
	image_url: string;
	blurhash: string;
	backdrop_url: string;
	backdrop_blurhash: string;
	about: string;
	url: string;
	service_name: string;
	playstore_rating: number;
	package_name: string | null;
	playstore_number_of_ratings: number;
	flexipay: boolean;
	flexipay_discount: number;
	flexipay_min: number;
	flexipay_max: number;
	flexipay_vendor: string;
	show_powered_by: boolean;
	flexipay_vendor_image: string | null;
	flexipay_vendor_conditions: string | null;
	flexipay_vendor_instructions: string;
	whatsub_class: {
		name: string;
	};
	whatsub_plans: any[];
}

interface CartOrder {
	status: string;
	whatsub_order_items_aggregate: {
		aggregate: {
			sum: {
				quantity: number;
			};
		};
	};
}

const PaymentsPage = () => {
	const params = useParams<{ id: string }>();
	const id = params?.id;
	const router = useRouter();
	const { user } = useAuthStore();

	const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
	const [cartOrders, setCartOrders] = useState<CartOrder[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [amount, setAmount] = useState('');
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showRedeemInstructions, setShowRedeemInstructions] = useState(false);

	// Real-time validation for amount input
	const validateAmount = (value: string) => {
		const amountValue = parseFloat(value);

		if (!value || value === '') {
			setError(null);
			return;
		}

		if (isNaN(amountValue) || amountValue <= 0) {
			setError('Please enter a valid amount');
			return;
		}

		if (serviceDetails?.flexipay_min && amountValue < serviceDetails.flexipay_min) {
			setError(`Minimum amount is ₹${serviceDetails.flexipay_min}`);
			return;
		}

		if (serviceDetails?.flexipay_max && amountValue > serviceDetails.flexipay_max) {
			setError(`Maximum amount is ₹${serviceDetails.flexipay_max}`);
			return;
		}

		setError(null);
	};

	// Handle amount input change with validation
	const handleAmountChange = (value: string) => {
		setAmount(value);
		validateAmount(value);
	};

	useEffect(() => {
		if (id && user?.id) {
			fetchServiceDetails(id);
		}
	}, [id, user?.id, user?.auth_token]);

	const fetchServiceDetails = async (serviceId: string) => {
		if (!user?.auth_token || !user?.id) return;

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
            query getServiceDetails($service_id: uuid!, $user_id: uuid = "") {
              __typename
              whatsub_services(where: {id: {_eq: $service_id}}) {
                __typename
                image_url
                blurhash
                backdrop_url
                backdrop_blurhash
                about
                url
                service_name
                playstore_rating
                package_name
                playstore_number_of_ratings
                flexipay
                flexipay_discount
                flexipay_min
                flexipay_max
                flexipay_vendor
                show_powered_by
                flexipay_vendor_image
                flexipay_vendor_conditions
                flexipay_vendor_instructions
                whatsub_class {
                  __typename
                  name
                }
                whatsub_plans(where: {whatsub_coupon_availability: {count: {_gt: "0"}}}, order_by: {discounted_price: asc}) {
                  __typename
                  id
                  plan_name
                  display_data
                  price
                  plan_details
                  discounted_price
                  duration
                  duration_type
                  status
                  is_plan
                  whatsub_order_items(where: {whatsub_order: {status: {_eq: "cart"}, user_id: {_eq: $user_id}}}) {
                    __typename
                    id
                    quantity
                  }
                }
              }
              whatsub_orders(where: {status: {_eq: "cart"}, user_id: {_eq: $user_id}}) {
                __typename
                status
                whatsub_order_items_aggregate {
                  __typename
                  aggregate {
                    __typename
                    sum {
                      __typename
                      quantity
                    }
                  }
                }
              }
            }
          `,
					variables: {
						service_id: serviceId,
						user_id: user.id
					}
				})
			});

			const data = await response.json();
			const service = data.data?.whatsub_services?.[0];
			const orders = data.data?.whatsub_orders || [];

			if (service) {
				setServiceDetails(service);
				setCartOrders(orders);
			}
		} catch (error) {
			console.error('Error fetching service details:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePurchase = () => {
		const amountValue = parseFloat(amount);

		if (!amountValue || amountValue <= 0) {
			setError('Please enter a valid amount');
			return;
		}

		if (serviceDetails?.flexipay_min && amountValue < serviceDetails.flexipay_min) {
			setError(`Minimum amount is ₹${serviceDetails.flexipay_min}`);
			return;
		}

		if (serviceDetails?.flexipay_max && amountValue > serviceDetails.flexipay_max) {
			setError(`Maximum amount is ₹${serviceDetails.flexipay_max}`);
			return;
		}

		// Final validation before proceeding
		if (error) {
			return;
		}

		setShowPaymentModal(true);
	};

	const handlePayment = async () => {
		if (!user?.id || !user?.auth_token) {
			router.push('/auth');
			return;
		}

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
				setError(data.errors[0]?.message || t('error.paymentFailed'));
				return;
			}

			const result = data.data?.whatsubPurchaseCart;
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
	const handlePaymentSuccess = () => {
		setAmount('');
		setError(null);
		setShowPaymentModal(false);
	};

	const handlePaymentError = (errorMessage: string) => {
		setError(`Payment failed: ${errorMessage}`);
	};

	const calculateDiscountedAmount = () => {
		const amountValue = parseFloat(amount);
		if (!amountValue || !serviceDetails?.flexipay_discount) return amountValue;

		const discount = (amountValue * serviceDetails.flexipay_discount) / 100;
		return amountValue - discount;
	};

	const calculateSavings = () => {
		const amountValue = parseFloat(amount);
		if (!amountValue || !serviceDetails?.flexipay_discount) return 0;

		return (amountValue * serviceDetails.flexipay_discount) / 100;
	};

	const getTotalCartQuantity = () => {
		return cartOrders.reduce((total, order) =>
			total + (order.whatsub_order_items_aggregate?.aggregate?.sum?.quantity || 0), 0
		);
	};

	const getQuickAmounts = () => {
		if (!serviceDetails) return [];

		const min = serviceDetails.flexipay_min || 100;
		const max = serviceDetails.flexipay_max || 5000;

		// Generate 4 quick amounts based on min/max
		const amounts = [];
		amounts.push(min);
		amounts.push(Math.round(min * 2));
		amounts.push(Math.round((min + max) / 2));
		amounts.push(Math.round(max * 0.8));

		return amounts.filter(amt => amt <= max);
	};

	if (isLoading) {
		return (
			<div className="page-container pt-24 flex items-center justify-center min-h-[60vh]">
				<div className="flex flex-col items-center gap-4">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
					<p className="text-gray-400">Loading service details...</p>
				</div>
			</div>
		);
	}

	if (!serviceDetails) {
		return (
			<div className="page-container pt-24 flex items-center justify-center">
				<div className="bg-dark-500 rounded-xl p-8 text-center max-w-md">
					<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<X className="h-8 w-8 text-red-400" />
					</div>
					<h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
					<p className="text-gray-400 mb-6">The service you're looking for doesn't exist or has been removed.</p>
					<Link href="/all-brands" className="btn btn-primary">
						Back to Brands
					</Link>
				</div>
			</div>
		);
	}

	if (!serviceDetails.flexipay) {
		return (
			<div className="page-container pt-24 flex items-center justify-center">
				<div className="bg-dark-500 rounded-xl p-8 text-center max-w-md">
					<div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<AlertCircle className="h-8 w-8 text-orange-400" />
					</div>
					<h1 className="text-2xl font-bold mb-4">FlexiPay Not Available</h1>
					<p className="text-gray-400 mb-6">This service doesn't support FlexiPay purchases.</p>
					<Link href="/all-brands" className="btn btn-primary">
						Back to Brands
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="page-container pt-24">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<button
					onClick={() => router.back()}
					className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
				>
					<ArrowLeft className="h-6 w-6" />
				</button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">FlexiPay Purchase</h1>
					<p className="text-gray-400">Buy gift cards and vouchers with instant delivery</p>
				</div>
			</div>

			{/* Hero Section with Backdrop */}
			<div className="relative mb-8 rounded-xl overflow-hidden">
				<div className="h-48 md:h-64 relative">
					{(serviceDetails.backdrop_url || serviceDetails.image_url) ? (
						<Image
							src={serviceDetails.backdrop_url || serviceDetails.image_url || ''}
							alt={serviceDetails.service_name}
							fill
							className="object-cover"
							sizes="100vw"
							priority
						/>
					) : (
						<div className="absolute inset-0 bg-slate-800" aria-hidden />
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

					{/* Service Info Overlay */}
					<div className="absolute bottom-0 left-0 right-0 p-6">
						<div className="flex items-end gap-6">
							<div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 bg-white shadow-lg">
								<div className="relative w-full h-full p-2">
									{serviceDetails.image_url ? (
										<Image
											src={serviceDetails.image_url}
											alt={serviceDetails.service_name}
											fill
											className="object-contain"
											sizes="96px"
										/>
									) : (
										<div className="w-full h-full bg-slate-200" aria-hidden />
									)}
								</div>
							</div>
							<div className="flex-1 text-white">
								<h2 className="text-2xl md:text-3xl font-bold mb-2">{serviceDetails.service_name}</h2>
								<div className="flex flex-wrap items-center gap-3 mb-4">
									<span className="bg-indigo-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
										{serviceDetails.whatsub_class.name}
									</span>
									<span className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
										<Percent className="h-3 w-3" />
										{serviceDetails.flexipay_discount}% Off
									</span>
									{serviceDetails.playstore_rating > 0 && (
										<div className="flex items-center gap-1 bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
											<Star className="h-4 w-4 fill-current" />
											{serviceDetails.playstore_rating.toFixed(1)}
										</div>
									)}
									{serviceDetails.playstore_number_of_ratings > 0 && (
										<div className="flex items-center gap-1 bg-gray-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
											<Users className="h-4 w-4" />
											{(serviceDetails.playstore_number_of_ratings / 1000000).toFixed(2)}M users
										</div>
									)}
								</div>
								<div className="flex gap-3">
									{serviceDetails.url && (
										<a
											href={serviceDetails.url}
											target="_blank"
											rel="noopener noreferrer"
											className="btn btn-secondary flex items-center gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
										>
											<ExternalLink className="h-4 w-4" />
											Website
										</a>
									)}
									{serviceDetails.package_name && (
										<a
											href={`https://play.google.com/store/apps/details?id=${serviceDetails.package_name}`}
											target="_blank"
											rel="noopener noreferrer"
											className="btn btn-secondary flex items-center gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
										>
											<Smartphone className="h-4 w-4" />
											App
										</a>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* About Section */}
			{serviceDetails.about && (
				<div className="bg-dark-500 rounded-xl p-6 mb-8">
					<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
						<Info className="h-5 w-5 text-indigo-400" />
						About {serviceDetails.service_name}
					</h3>
					<p className="text-gray-300 leading-relaxed">{serviceDetails.about}</p>
				</div>
			)}

			{/* Purchase Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				{/* Amount Input Section */}
				<div className="bg-dark-500 rounded-xl p-6">
					<h3 className="text-xl font-bold mb-6 flex items-center gap-2">
						<DollarSign className="h-5 w-5 text-green-400" />
						Enter Purchase Amount
					</h3>

					<div className="space-y-6">
						{/* Amount Input */}
						<div>
							<label className="block text-sm font-medium text-gray-400 mb-2">
								Amount (₹{serviceDetails.flexipay_min} - ₹{serviceDetails.flexipay_max})
							</label>
							<div className="relative">
								<input
									type="number"
									value={amount}
									onChange={(e) => handleAmountChange(e.target.value)}
									placeholder={`Enter amount (₹${serviceDetails.flexipay_min} - ₹${serviceDetails.flexipay_max})`}
									className={`input pl-8 w-full ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
									min={serviceDetails.flexipay_min}
									max={serviceDetails.flexipay_max}
								/>
								<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
							</div>
							<div className="mt-2 min-h-[20px]">
								{error && (
									<p className="text-red-400 text-sm flex items-center gap-1">
										<AlertCircle className="h-4 w-4" />
										{error}
									</p>
								)}
							</div>
							<div className="text-xs text-gray-500">
								Valid range: ₹{serviceDetails.flexipay_min} - ₹{serviceDetails.flexipay_max}
							</div>
						</div>

						{/* Quick Amount Buttons */}
						<div>
							<label className="block text-sm font-medium text-gray-400 mb-3">Quick Select</label>
							<div className="grid grid-cols-2 gap-3">
								{getQuickAmounts().map((quickAmount) => (
									<button
										key={quickAmount}
										onClick={() => handleAmountChange(quickAmount.toString())}
										className="p-3 bg-dark-400 hover:bg-dark-300 rounded-lg text-sm font-medium transition-colors"
									>
										₹{quickAmount}
									</button>
								))}
							</div>
						</div>

						{/* Discount Information */}
						{amount && parseFloat(amount) > 0 && !error && (
							<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
								<h4 className="font-medium text-green-400 mb-3">Discount Breakdown</h4>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-gray-400">Original Amount:</span>
										<span>₹{parseFloat(amount).toFixed(2)}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-400">Discount ({serviceDetails.flexipay_discount}%):</span>
										<span className="text-green-400">-₹{calculateSavings().toFixed(2)}</span>
									</div>
									<div className="border-t border-green-500/20 pt-2 flex justify-between font-medium">
										<span>You Pay:</span>
										<span className="text-green-400">₹{calculateDiscountedAmount().toFixed(2)}</span>
									</div>
								</div>
							</div>
						)}

						{/* Purchase Button */}
						<button
							onClick={handlePurchase}
							disabled={!amount || parseFloat(amount) <= 0 || isProcessing || !!error}
							className="btn btn-primary w-full py-3 text-lg"
						>
							{isProcessing ? (
								<>
									<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
									Processing...
								</>
							) : (
								<>
									<ShoppingCart className="h-5 w-5 mr-2" />
									Purchase Gift Card
								</>
							)}
						</button>
					</div>
				</div>

				{/* Service Information */}
				<div className="space-y-6">
					{/* FlexiPay Details */}
					<div className="bg-dark-500 rounded-xl p-6">
						<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
							<Shield className="h-5 w-5 text-blue-400" />
							FlexiPay Details
						</h3>
						<div className="space-y-4">
							<div className="flex justify-between items-center py-2 border-b border-gray-700">
								<span className="text-gray-400">Discount</span>
								<span className="font-medium text-green-400">{serviceDetails.flexipay_discount}%</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-700">
								<span className="text-gray-400">Minimum Amount</span>
								<span className="font-medium">₹{serviceDetails.flexipay_min}</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-700">
								<span className="text-gray-400">Maximum Amount</span>
								<span className="font-medium">₹{serviceDetails.flexipay_max}</span>
							</div>
							<div className="flex justify-between items-center py-2">
								<span className="text-gray-400">Vendor</span>
								<span className="font-medium capitalize">{serviceDetails.flexipay_vendor}</span>
							</div>
						</div>
					</div>

					{/* Powered By */}
					{serviceDetails.show_powered_by && serviceDetails.flexipay_vendor_image && (
						<div className="bg-dark-500 rounded-xl p-6">
							<h3 className="text-lg font-bold mb-4">Powered By</h3>
							<div className="flex items-center justify-center">
								<div className="relative h-12 w-40">
									<Image
										src={serviceDetails.flexipay_vendor_image}
										alt={serviceDetails.flexipay_vendor}
										fill
										className="object-contain"
										sizes="160px"
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Redeem Instructions */}
			{serviceDetails.flexipay_vendor_instructions && (
				<div className="bg-dark-500 rounded-xl p-6 mb-8">
					<button
						onClick={() => setShowRedeemInstructions(!showRedeemInstructions)}
						className="flex items-center justify-between w-full text-left group"
					>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
								<Info className="h-5 w-5 text-orange-400" />
							</div>
							<div>
								<h3 className="text-xl font-bold">How to Redeem</h3>
								<p className="text-gray-400 text-sm">Step-by-step redemption guide</p>
							</div>
						</div>
						<div className={`transition-transform duration-200 ${showRedeemInstructions ? 'rotate-180' : ''}`}>
							<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</button>
					{showRedeemInstructions && (
						<div className="mt-6 p-4 bg-dark-400 rounded-lg border-l-4 border-orange-400">
							<div className="prose prose-invert max-w-none">
								<p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
									{serviceDetails.flexipay_vendor_instructions}
								</p>
							</div>
							{serviceDetails.flexipay_vendor_conditions && (
								<div className="mt-4 pt-4 border-t border-gray-600">
									<h4 className="font-medium mb-2 text-orange-400">Terms & Conditions:</h4>
									<p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
										{serviceDetails.flexipay_vendor_conditions}
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* Payment Modal */}
			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={calculateDiscountedAmount()}
				onSuccess={handlePaymentSuccess}
				onError={handlePaymentError}
				title="Complete Purchase"
				description={`Purchase ${serviceDetails.service_name} gift card worth ₹${amount} (You save ₹${calculateSavings().toFixed(2)})`}
			/>
		</div>
	);
};

export default PaymentsPage;