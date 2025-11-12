'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, ExternalLink, Smartphone, ChevronDown, ChevronUp, Info, X, Star, Users, Clock, Package, Plus, Minus, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import PlanDetailsModal from './plan-details-modal';
import ProductDetailSkeleton from './product-detail-skeleton';
import ReactMarkdown from "react-markdown";
import { toast } from 'react-hot-toast';
import LoginModal from '@/components/login-modal';
import RentProductModal from '@/components/rent-product-modal';
import Skeleton from 'react-loading-skeleton';

import { useServiceDetails } from '@/lib/hooks/service/use-service-details'
import { useRentProducts } from '@/lib/hooks/rent/use-rent-products';

import { useCart, CART_BASE_KEY } from '@/lib/hooks/cart/use-cart';
import { useAddToCartMutation } from '@/lib/hooks/cart/use-add-to-cart';
import { useRemoveFromCartMutation } from '@/lib/hooks/cart/use-remove-from-cart';

import { useCurrentLocation } from "@/lib/context/location-context";

import { useQueryClient } from '@tanstack/react-query';

interface Plan {
	id: string;
	plan_name: string;
	display_data: string;
	price: number;
	plan_details: string;
	discounted_price: number;
	duration: string | null;
	duration_type: string | null;
	status: string;
	is_plan: boolean;
	whatsub_order_items: Array<{
		id: string;
		quantity: number;
	}>;
}

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
	whatsub_plans: Plan[];
}


interface SubscriptionProduct {
	id: string;
	service_id: string;
	product_name: string;
	product_description: string;
	product_photos: string;
	price: string;
	latitude: string;
	longitude: string;
	radius_meters: string;
	created_at: string;
	updated_at: string;
}



interface DistinctPlan {
	whatsub_plans: Plan[];
	group_limit: number;
	hide_limit: boolean;
	share_limit: boolean;
	number_of_users: number;
	name: string;
	room_dp: string;
	blurhash: string;
	count: number;
	auth_fullname2: {
		fullname: string;
		dp: string;
	};
}


// FlexiPay Component
interface FlexiPaySectionProps {
	serviceDetails: ServiceDetails;
	serviceId?: string;
	isAuthenticated: boolean;
	onLoginRequired: () => void;
}

const FlexiPaySection = ({ serviceDetails, serviceId, isAuthenticated, onLoginRequired }: FlexiPaySectionProps) => {
	//   const { t } = useLanguageStore();
	const { user } = useAuthStore();
	const [flexiPayAmount, setFlexiPayAmount] = useState('');
	const [isProcessingFlexiPay, setIsProcessingFlexiPay] = useState(false);
	const router = useRouter();

	const queryClient = useQueryClient();

	const calculateFlexiPayAmount = () => {
		const amount = parseFloat(flexiPayAmount);
		if (!amount || !serviceDetails?.flexipay_discount) return amount;

		const discount = (amount * serviceDetails.flexipay_discount) / 100;
		return amount - discount;
	};

	const isFlexiPayValid = () => {
		const amount = parseFloat(flexiPayAmount);
		if (!amount || !serviceDetails) return false;

		return amount >= serviceDetails.flexipay_min && amount <= serviceDetails.flexipay_max;
	};

	const handleFlexiPayPurchase = async () => {
		if (!isFlexiPayValid() || !user?.id || !user?.auth_token || !serviceDetails || !serviceId) return;

		setIsProcessingFlexiPay(true);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($amount: numeric!, $service_id: uuid!, $user_id: uuid!) {
                whatsubAddAmountToCart(
                  request: { amount: $amount, service_id: $service_id, user_id: $user_id }
                ) {
                  affected_rows
                }
              }
          `,
					variables: {
						amount: parseFloat(flexiPayAmount),
						service_id: serviceId,
						user_id: user.id
					}
				})
			});

			const data = await response.json();
			if (data.data?.whatsubAddAmountToCart?.affected_rows > 0) {
				setFlexiPayAmount('');
				toast((t) => (
					<div
						className={`${t.visible ? 'animate-enter' : 'animate-leave'
							} bg-dark-400 shadow-xl pointer-events-auto`}
					>
						<div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
							<div className="shrink-0">
								<div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-600 flex items-center justify-center">
									<ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
								</div>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm sm:text-base font-bold text-white mb-0.5 truncate">
									Added to Cart! 🎉
								</p>
								<p className="text-xs sm:text-sm text-gray-300 truncate">
									<span className="font-semibold text-green-400">₹{calculateFlexiPayAmount().toFixed(2)}</span> FlexiPay
								</p>
							</div>
							<button
								onClick={() => toast.dismiss(t.id)}
								className="shrink-0 text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-lg"
							>
								<X className="h-4 w-4 sm:h-5 sm:w-5" />
							</button>
						</div>

						<button
							onClick={() => {
								toast.dismiss(t.id);
								router.push('/cart');
							}}
							className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
						>
							<ShoppingCart className="h-4 w-4" />
							View Cart
						</button>
					</div>
				), {
					duration: 2000,
					position: 'top-center',
				});
			} else {
				toast.error('Failed to add item to cart');
			}
		} catch (error) {
			toast.error('Failed to add item cart');
			console.error('Error adding FlexiPay to cart:', error);
		} finally {
			setIsProcessingFlexiPay(false);
			queryClient.invalidateQueries({ queryKey: [CART_BASE_KEY, user.id] });
		}
	};

	if (!serviceDetails.flexipay || !serviceId) return null;

	return (
		<div className="mb-4 sm:mb-6 sm:bg-dark-400 rounded-lg sm:p-4 sm:border border-gray-700/50 hover:border-blue-500/30 transition-all">
			{/* Header */}
			<div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-700/50">
				<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
					<span className="text-white font-bold text-base sm:text-lg">₹</span>
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5 sm:gap-2">
						<h3 className="text-sm sm:text-base font-bold text-white">FlexiPay</h3>
						<span className="bg-emerald-500/10 text-emerald-400 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
							{serviceDetails.flexipay_discount}% OFF
						</span>
					</div>
					<p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
						Choose ₹{serviceDetails.flexipay_min} - ₹{serviceDetails.flexipay_max}
					</p>
				</div>
			</div>

			{/* Amount Input with Quick Select Pills */}
			<div className="space-y-2 sm:space-y-3">
				<div className="relative">
					<div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-lg font-bold">₹</div>
					<input
						type="number"
						value={flexiPayAmount}
						onChange={(e) => setFlexiPayAmount(e.target.value)}
						placeholder="0"
						className="w-full bg-dark-300 text-white text-xl sm:text-2xl font-bold pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all no-arrows"
						min={serviceDetails.flexipay_min}
						max={serviceDetails.flexipay_max}
					/>
				</div>

				{/* Quick Amount Pills - Scrollable on mobile */}
				<div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
					{(() => {
						const min = serviceDetails.flexipay_min;
						const max = serviceDetails.flexipay_max;
						const step = (max - min) / 3;
						const amounts = [
							min,
							Math.round(min + step),
							Math.round(min + step * 2),
							max
						];

						return amounts.map((amount, index) => (
							<button
								key={index}
								onClick={() => setFlexiPayAmount(amount.toString())}
								className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${flexiPayAmount === amount.toString()
									? 'bg-blue-500 text-white'
									: 'bg-dark-300 text-gray-400 hover:bg-dark-200 hover:text-white'
									}`}
							>
								₹{amount}
							</button>
						));
					})()}
				</div>

				{/* Price Display */}
				{flexiPayAmount && parseFloat(flexiPayAmount) > 0 && isFlexiPayValid() && (
					<div className="flex items-center justify-between bg-dark-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
						<span className="text-xs sm:text-sm text-gray-400">You pay after discount</span>
						<span className="text-lg sm:text-xl font-bold text-emerald-400">
							₹{calculateFlexiPayAmount().toFixed(2)}
						</span>
					</div>
				)}

				{/* Add to Cart Button */}
				<button
					onClick={() => {
						if (!isAuthenticated) {
							onLoginRequired();
							return;
						}
						handleFlexiPayPurchase();
					}}
					disabled={!isFlexiPayValid() || isProcessingFlexiPay}
					className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isFlexiPayValid() && !isProcessingFlexiPay
						? 'bg-blue-500 hover:bg-blue-600 text-white'
						: 'bg-gray-600 text-gray-400 cursor-not-allowed'
						}`}
				>
					{isProcessingFlexiPay ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
							<span className="text-xs sm:text-sm">Processing...</span>
						</>
					) : (
						<>
							<ShoppingCart className="h-4 w-4" />
							<span className="text-xs sm:text-sm">Add To Cart</span>
						</>
					)}
				</button>

				{/* Error Message */}
				{flexiPayAmount && !isFlexiPayValid() && (
					<p className="text-red-400 text-[10px] sm:text-xs text-center">
						Please enter an amount between ₹{serviceDetails.flexipay_min} and ₹{serviceDetails.flexipay_max}
					</p>
				)}
			</div>
		</div>
	);
};

// Products/Plans Component
interface ProductPlansProps {
	serviceDetails: ServiceDetails;
	isAuthenticated: boolean;
	onLoginRequired: () => void;
	onPlanInfoClick: (plan: Plan) => void;
}

const ProductPlansSection = ({ serviceDetails, isAuthenticated, onLoginRequired, onPlanInfoClick }: ProductPlansProps) => {
	const { t } = useLanguageStore();
	const { user } = useAuthStore();

	const { data: cartData } = useCart(user);
	const addToCartMutation = useAddToCartMutation({ user_id: user?.id || '', auth_token: user?.auth_token || '' });
	const removeFromCartMutation = useRemoveFromCartMutation({ user_id: user?.id || '', auth_token: user?.auth_token || '' });

	const calculateDiscount = (originalPrice: number, discountedPrice: number) => {
		const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
		return +discount.toFixed(2);
	};

	const getCartQuantity = (item) => {
		if (!item || !cartData) return 0;

		return cartData?.itemQuantityMap?.get(item.id) || 0;
	}

	const activePlans = serviceDetails.whatsub_plans.filter(plan => plan.status === 'active');

	if (activePlans.length === 0) return null;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
			{activePlans.map((plan) => {
				const discount = calculateDiscount(plan.price, plan.discounted_price);
				const cartQuantity = getCartQuantity(plan);
				const isAddingThisPlan = false;

				return (
					<div
						key={plan.id}
						className="relative rounded-lg overflow-hidden transition-all duration-300 bg-dark-400 border border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
					>
						{/* Header with discount and info */}
						<div className="bg-gradient-to-r from-dark-300/50 to-dark-400/50 px-3 py-2.5 flex items-center justify-between border-b border-gray-700/30">
							<div className="flex items-center gap-2">
								{discount > 0 && (
									<span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-2 py-1 rounded">
										{discount}% OFF
									</span>
								)}
							</div>
							<button
								onClick={() => {
									if (!isAuthenticated) {
										onLoginRequired();
										return;
									}
									onPlanInfoClick(plan);
								}}
								className="w-7 h-7 rounded-[50%] bg-gray-700/60 hover:bg-gray-600 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
							>
								<Info className="h-4 w-4" />
							</button>
						</div>

						{/* Content */}
						<div className="p-4">
							<h4 className="font-bold text-base mb-2 text-white leading-tight line-clamp-1">{plan.plan_name}</h4>

							{plan.is_plan ? (
								<p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-3 min-h-[40px]">
									{plan.display_data}
								</p>
							) : (
								<p className="text-sm text-gray-500 italic mb-3 min-h-[40px]">
									One-time purchase
								</p>
							)}

							{/* Price and Duration Row */}
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-baseline gap-2">
									<span className="text-2xl font-bold text-emerald-400">
										₹{plan.discounted_price.toFixed(0)}
									</span>
									{plan.price > plan.discounted_price && (
										<span className="text-sm text-gray-500 line-through">
											₹{plan.price.toFixed(0)}
										</span>
									)}
								</div>
								{plan.duration && plan.duration_type && (
									<div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-blue-400">
										<Clock className="h-3.5 w-3.5" />
										<span>{plan.duration} {plan.duration_type}</span>
									</div>
								)}
							</div>

							{/* Action Button */}
							{cartQuantity > 0 ? (
								<div className="flex items-center justify-between gap-2 bg-dark-300/50 rounded-lg px-2 h-[42px] border border-blue-500/20">
									<button
										onClick={() => {
											removeFromCartMutation.mutate({ plan_id: plan.id, id: plan.whatsub_order_items?.[0]?.id })
										}}
										disabled={isAddingThisPlan}
										className="w-8 h-8 bg-gray-700/80 hover:bg-red-500/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
									>
										<Minus className="h-4 w-4" />
									</button>
									<div className="flex-1 text-center">
										<span className="text-lg font-bold text-white leading-none">{cartQuantity}</span>
										<p className="text-[10px] text-gray-400 leading-tight">in cart</p>
									</div>
									<button
										onClick={() => addToCartMutation.mutate(plan)}
										disabled={isAddingThisPlan}
										className="w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
									>
										<Plus className="h-4 w-4" />
									</button>
								</div>
							) : (
								<button
									onClick={() => {
										if (!isAuthenticated) {
											onLoginRequired();
											return;
										}
										addToCartMutation.mutate(plan);
									}}
									disabled={isAddingThisPlan}
									className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									{isAddingThisPlan ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
											<span>{t('product.addingToCart')}</span>
										</>
									) : (
										<>
											<ShoppingCart className="h-4 w-4" />
											<span>{t('product.addToCart')}</span>
										</>
									)}
								</button>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};

// Groups Component
interface GroupsSectionProps {
	serviceId: string | undefined;
	isAuthenticated: boolean;
	onLoginRequired: () => void;
	onGroupClick: (distinctPlan: DistinctPlan) => void;
}

const GroupsSection = ({ serviceId, isAuthenticated, onLoginRequired, onGroupClick }: GroupsSectionProps) => {
	const { user } = useAuthStore();
	const [distinctPlans, setDistinctPlans] = useState<DistinctPlan[]>([]);

	useEffect(() => {
		const fetchDistinctPlans = async (serviceIds: string[], authToken: string) => {
			const query = `
        query MyQuery2($service_ids: [uuid!]) {
          whatsub_distinct_plans(
            where: { whatsub_plans: { service_id: { _in: $service_ids } } }
            limit: 10
          ) {
            whatsub_plans {
              id
              price
              duration
              duration_type
              service_id
            }
            group_limit
            hide_limit
            share_limit
            number_of_users
            name
            room_dp
            blurhash
            count
            auth_fullname2 {
              fullname
              dp
            }
          }
        }
      `;

			const response = await fetch("https://db.subspace.money/v1/graphql", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${authToken}`
				},
				body: JSON.stringify({
					query,
					variables: { service_ids: serviceIds },
				}),
			});

			const result = await response.json();

			if (result.errors) {
				console.error("GraphQL errors:", result.errors);
				throw new Error(result.errors[0].message);
			}

			return result.data.whatsub_distinct_plans as DistinctPlan[];
		};

		if (serviceId && user?.auth_token) {
			fetchDistinctPlans([serviceId], user.auth_token)
				.then(data => setDistinctPlans(data))
				.catch(error => console.error('Failed to fetch distinct plans:', error));
		}
	}, [serviceId, user?.auth_token]);

	const getDurationDisplay = (duration: number, durationType: string) => {
		if (durationType === 'months') {
			if (duration === 3) return 'Quarter';
			if (duration === 6) return 'Half Year';
			if (duration === 12) return 'Year';
		} else if (durationType === 'years') {
			if (duration === 1) return 'Year';
		}

		const typeMap: { [key: string]: string } = {
			'months': 'Month',
			'years': 'Year',
			'quarters': 'Quarter'
		};

		return typeMap[durationType] || 'Month';
	};

	if (distinctPlans.length === 0) return null;

	return (
		<section className="mt-8">
			<h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Groups</h2>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{distinctPlans.map((distinctPlan: DistinctPlan, index: number) => (
					<div
						key={distinctPlan.whatsub_plans?.id || index}
						className="bg-dark-500 rounded-xl p-4 transition-all duration-300 hover:bg-dark-400 border border-gray-700/50 hover:border-green-500/50 group"
					>
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 shrink-0">
								<div className="relative w-full h-full rounded-full overflow-hidden bg-white">
									{distinctPlan.room_dp ? (
										<Image
											src={distinctPlan.room_dp}
											alt={distinctPlan.name}
											fill
											className="object-cover"
											sizes="48px"
										/>
									) : (
										<div className="w-full h-full bg-gray-700" aria-hidden />
									)}
								</div>
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h3 className="font-bold text-white text-lg group-hover:text-green-400 transition-colors truncate">
										{distinctPlan.name}
									</h3>
								</div>
								<div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
									<span className="text-green-400 font-medium">
										₹{Math.ceil((distinctPlan.whatsub_plans?.price) / (distinctPlan.group_limit || distinctPlan.share_limit || 1))} / User / {getDurationDisplay(distinctPlan.whatsub_plans?.duration, distinctPlan.whatsub_plans?.duration_type)}
									</span>
								</div>
								<div className="text-xs text-gray-400">
									{distinctPlan.number_of_users} / {distinctPlan.share_limit || distinctPlan.group_limit || 1} friends sharing
								</div>
							</div>
							<button
								onClick={(e) => {
									if (!isAuthenticated) {
										onLoginRequired();
										return;
									}
									e.stopPropagation();
									onGroupClick(distinctPlan);
								}}
								className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap text-sm shrink-0"
							>
								<UserPlus className="h-4 w-4" />
								Join
							</button>
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

// Offline Products Component
interface OfflineProductsSectionProps {
	serviceId: string | undefined;
	isAuthenticated: boolean;
	onLoginRequired: () => void;
	onRentNowClick: (product: SubscriptionProduct) => void;
	sectionRef?: React.RefObject<HTMLDivElement>;
}

const OfflineProductsSection = ({
	serviceId,
	isAuthenticated,
	onLoginRequired,
	onRentNowClick,
	sectionRef
}: OfflineProductsSectionProps) => {
	const { user } = useAuthStore();
	const { location: globalLocation } = useCurrentLocation();

	const {
		data: subscriptionProducts = [],
		isLoading: isLoadingSubscriptionProducts,
	} = useRentProducts({
		serviceId,
		user,
		address: globalLocation
	});

	if (!subscriptionProducts || (subscriptionProducts.length === 0 && !isLoadingSubscriptionProducts)) {
		return null;
	}

	return (
		<div className="mt-8" ref={sectionRef}>
			<div className="flex items-center justify-between mb-4 md:mb-6">
				<div>
					<h3 className="text-lg md:text-2xl font-bold">Offline Products</h3>
					<p className="text-xs md:text-sm text-gray-400">Rent physical products near you</p>
				</div>
				<div className="text-xs md:text-sm text-gray-400">
					{subscriptionProducts?.length} available
				</div>
			</div>

			{isLoadingSubscriptionProducts ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{[...Array(4)].map((_, index) => (
						<div key={index} className="rounded-lg overflow-hidden bg-dark-400 border border-gray-700/50">
							<Skeleton height={140} baseColor="#1f2937" highlightColor="#374151" />
							<div className="p-3">
								<Skeleton height={16} width="80%" baseColor="#1f2937" highlightColor="#374151" className="mb-2" />
								<Skeleton height={12} count={2} baseColor="#1f2937" highlightColor="#374151" className="mb-2" />
								<Skeleton height={20} width="60%" baseColor="#1f2937" highlightColor="#374151" className="mb-2" />
								<Skeleton height={36} baseColor="#1f2937" highlightColor="#374151" />
							</div>
						</div>
					))}
				</div>
			) : subscriptionProducts?.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-400 text-lg">No offline products available in your area</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{subscriptionProducts?.map((product) => {
						const mainPhoto = product.product_photos[0]?.url || '';

						return (
							<div
								key={product.id}
								className="relative rounded-lg overflow-hidden transition-all duration-300 bg-dark-400 border border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
							>
								{/* Image Section */}
								<div className="relative aspect-[4/3] overflow-hidden bg-dark-300">
									{mainPhoto ? (
										<Image
											src={mainPhoto}
											alt={product.product_name}
											fill
											className="object-cover transition-transform duration-300 group-hover:scale-110"
											sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Package className="h-8 w-8 text-gray-600" />
										</div>
									)}
									{/* Rental Badge */}
									<div className="absolute top-1.5 right-1.5 bg-blue-500/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
										Rental
									</div>
								</div>

								{/* Content */}
								<div className="p-3">
									<h4 className="font-semibold text-sm mb-1.5 text-white leading-tight line-clamp-1">{product.product_name}</h4>

									<p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
										{product.product_description}
									</p>

									{/* Price */}
									<div className="flex items-baseline gap-1 mb-2">
										<span className="text-lg font-bold text-emerald-400">
											₹{parseFloat(product.base_price).toFixed(0)}
										</span>
										<span className="text-[10px] text-gray-500">/hr</span>
									</div>

									{/* Action Button */}
									<button
										onClick={() => {
											if (!isAuthenticated) {
												onLoginRequired();
												return;
											}
											onRentNowClick(product);
										}}
										className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
									>
										<Package className="h-3.5 w-3.5" />
										<span>Rent Now</span>
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

const ProductDetailPage = () => {
	const params = useParams<{ id: string }>();
	const id = params?.id;
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, isAuthenticated } = useAuthStore();
	const { t } = useLanguageStore();

	const [showRedeemInstructions, setShowRedeemInstructions] = useState(false);
	const [showPlanModal, setShowPlanModal] = useState(false);
	const [modalPlan, setModalPlan] = useState<Plan | null>(null);
	const [showLogin, setShowLogin] = useState(false);
	const [showRentModal, setShowRentModal] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<SubscriptionProduct | null>(null);

	const offlineProductsRef = useRef<HTMLDivElement>(null);

	const { data, isLoading } = useServiceDetails({ user, serviceId: id });
	const serviceDetails = data?.service;
	//   const orders = data?.orders || [];


	const openPlanModal = (plan: Plan) => {
		setModalPlan(plan);
		setShowPlanModal(true);
	};

	const handleRentNowClick = (product: SubscriptionProduct) => {
		setSelectedProduct(product);
		setShowRentModal(true);
	};

	const handleGroupClick = (distinctPlan: DistinctPlan) => {
		if (distinctPlan.whatsub_plans) {
			router.push(`/groups/${distinctPlan.whatsub_plans.id}`);
		}
	};

	const handleRentConfirm = (startTime: string, endTime: string) => {
		if (selectedProduct) {
			const params = new URLSearchParams({
				product_location_id: selectedProduct.product_location_id,
				startTime,
				endTime,
			});
			router.push(`/rental-checkout/${selectedProduct.id}?${params.toString()}`);
		}
	};

	const sectionParam = searchParams.get('section');

	useEffect(() => {
		if (sectionParam === 'offline_products' && offlineProductsRef.current && !isLoading) {
			setTimeout(() => {
				offlineProductsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 100);
		}
	}, [sectionParam, isLoading]);

	if (isLoading) {
		return (
			<div className="page-container pt-24">
				<ProductDetailSkeleton
					showAbout={true}
					showRedeemInstructions={true}
					plansCount={6}
				/>
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
					<h1 className="text-2xl font-bold mb-4">{t('product.notFound')}</h1>
					<p className="text-gray-400 mb-6">{t('product.notFoundSubtitle')}</p>
					<Link href="/all-brands" className="btn btn-primary">
						{t('product.backToBrands')}
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
					className="text-gray-400 hover:text-white transition-colors hover:bg-dark-400 rounded-lg"
				>
					<ArrowLeft className="h-6 w-6" />
				</button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">{t('product.title')}</h1>
					<p className="text-gray-400">{t('product.subtitle')}</p>
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
					<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>

					{/* Service Info Overlay */}
					<div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
						<div className="flex items-end gap-3 md:gap-6">
							<div className="w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 bg-white shadow-lg">
								<div className="relative w-full h-full">
									{serviceDetails.image_url ? (
										<Image
											src={serviceDetails.image_url}
											alt={serviceDetails.service_name}
											fill
											className="object-contain p-2"
											sizes="96px"
										/>
									) : (
										<div className="w-full h-full bg-slate-200" aria-hidden />
									)}
								</div>
							</div>
							<div className="flex-1 text-white min-w-0">
								<h2 className="text-xl md:text-3xl font-bold mb-2 truncate">{serviceDetails.service_name}</h2>
								<div className="flex flex-wrap items-center gap-2 mb-3">
									<span className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
										{serviceDetails.whatsub_class.name}
									</span>
									{serviceDetails.flexipay && (
										<span className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
											FlexiPay {serviceDetails.flexipay_discount}% {t('common.off')}
										</span>
									)}
									{serviceDetails.playstore_rating > 0 && (
										<div className="flex items-center gap-1 bg-yellow-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
											<Star className="h-3 w-3 fill-current" />
											{serviceDetails.playstore_rating.toFixed(1)}
										</div>
									)}
									{serviceDetails.playstore_number_of_ratings > 0 && (
										<div className="flex items-center gap-1 bg-gray-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
											<Users className="h-3 w-3" />
											{(serviceDetails.playstore_number_of_ratings / 1000000).toFixed(2)}M
										</div>
									)}
								</div>
								<div className="flex flex-wrap gap-2">
									{serviceDetails.url && (
										<a
											href={serviceDetails.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
										>
											<ExternalLink className="h-3 w-3" />
											Website
										</a>
									)}
									{serviceDetails.package_name && (
										<a
											href={`https://play.google.com/store/apps/details?id=${serviceDetails.package_name}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
										>
											<Smartphone className="h-3 w-3" />
											{t('product.app')}
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
				<div className="mb-6">
					<p className="text-sm md:text-base text-gray-300 leading-relaxed">
						{serviceDetails.about}
					</p>
				</div>
			)}

			{/* Redeem Instructions */}
			{serviceDetails.flexipay_vendor_instructions && (
				<div className="mb-8">
					<button
						onClick={() => setShowRedeemInstructions(!showRedeemInstructions)}
						className="flex items-center justify-between w-full text-left group py-3 px-2 sm:px-4 rounded-lg hover:bg-dark-500/50 transition-colors"
					>
						<div className="flex items-center gap-2 md:gap-3">
							<Info className="h-4 w-4 md:h-5 md:w-5 text-orange-400 flex-shrink-0" />
							<span className="text-base md:text-lg font-semibold text-white">{t('product.redeem')}</span>
						</div>
						<div className="transition-transform duration-200 group-hover:scale-110 flex-shrink-0">
							{showRedeemInstructions ? (
								<ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
							) : (
								<ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
							)}
						</div>
					</button>
					{showRedeemInstructions && (
						<div className="mt-3 p-4 md:p-5 bg-dark-500/30 rounded-lg border-l-4 border-orange-400">
							<div className="prose prose-invert max-w-none prose-sm md:prose-base">
								<div className="text-gray-300 text-sm md:text-base">
									<ReactMarkdown>
										{serviceDetails.flexipay_vendor_instructions}
									</ReactMarkdown>
								</div>
							</div>
							{serviceDetails.flexipay_vendor_conditions && (
								<div className="mt-4 pt-4 border-t border-gray-700/50">
									<h4 className="font-medium mb-2 text-sm md:text-base text-orange-400">{t('product.termsAndConditions')}</h4>
									<p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
										{serviceDetails.flexipay_vendor_conditions}
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* Products/Plans Section */}
			{(serviceDetails?.whatsub_plans.length > 0 || !!serviceDetails.flexipay) && (
				<div>
					<div className="mb-4 sm:mb-5 md:mb-6">
						<div className="flex items-center justify-between mb-1">
							<h3 className="text-lg sm:text-xl md:text-2xl font-bold">{t('product.availablePlans')}</h3>
							<div className="text-xs sm:text-sm text-gray-400 whitespace-nowrap ml-2">
								{serviceDetails.whatsub_plans.filter(plan => plan.status === 'active').length + (serviceDetails.flexipay ? 1 : 0)} {t('product.count')}
							</div>
						</div>
						<p className="text-xs sm:text-sm text-gray-400">{t('product.availablePlansSubtitle')}</p>
					</div>

					<FlexiPaySection
						serviceDetails={serviceDetails}
						isAuthenticated={isAuthenticated}
						onLoginRequired={() => setShowLogin(true)}
					/>

					<ProductPlansSection
						serviceDetails={serviceDetails}
						isAuthenticated={isAuthenticated}
						onLoginRequired={() => setShowLogin(true)}
						onPlanInfoClick={openPlanModal}
					/>
				</div>
			)}

			<OfflineProductsSection
				serviceId={id}
				isAuthenticated={isAuthenticated}
				onLoginRequired={() => setShowLogin(true)}
				onRentNowClick={handleRentNowClick}
				sectionRef={offlineProductsRef}
			/>

			<GroupsSection
				serviceId={id}
				isAuthenticated={isAuthenticated}
				onLoginRequired={() => setShowLogin(true)}
				onGroupClick={handleGroupClick}
			/>

			{/* Plan Details Modal */}
			{showPlanModal && modalPlan && (
				<PlanDetailsModal
					plan={modalPlan}
					onClose={() => setShowPlanModal(false)}
				/>
			)}

			<LoginModal
				isOpen={showLogin}
				onClose={() => setShowLogin(false)}
			/>

			{selectedProduct && (
				<RentProductModal
					isOpen={showRentModal}
					onClose={() => {
						setShowRentModal(false);
						setSelectedProduct(null);
					}}
					productName={selectedProduct.product_name}
					productLocationId={selectedProduct.product_location_id}
					onConfirm={handleRentConfirm}
				/>
			)}
		</div>
	);
};

export default ProductDetailPage;