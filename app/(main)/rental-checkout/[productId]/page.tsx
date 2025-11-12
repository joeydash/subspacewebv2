'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CreditCard, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Package, Calendar, Clock, Loader as Loader2, Wallet, MapPin, Home, Building, Hotel, Plus } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import QRPaymentModal from '@/components/qr-payment-modal';
import { useRentPrice } from '@/lib/hooks/rent/use-rent-price';
import { useWalletBalance } from '@/lib/hooks/wallet/use-wallet-balance';
import { DateTimePicker } from '@/components/date-time-picker';
import { useAddresses } from '@/lib/hooks/address/use-addresses';
import AddAddressModal from '@/components/add-address-modal';
import { useQueryClient } from '@tanstack/react-query';

import { useRentProductMutation } from "@/lib/hooks/rent/use-rent-product-mutation";
import { RENTAL_HISTORY_BASE_KEY } from "@/lib/hooks/rent/use-rental-history";
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/protected-route';

interface SubscriptionProduct {
	id: string;
	service_id: string;
	product_name: string;
	product_description: string;
	product_photos: string[];
}

interface Address {
	id: string;
	type: 'home' | 'work' | 'hotel' | 'other';
	name: string;
	contact_number: string;
	fhb_name: string;
	floor: string;
	latitude: string;
	longitude: string;
	full_address: string;
}

interface PriceData {
	currency: string;
	duration: {
		days: number;
		hours: number;
		months: number;
		weeks: number;
	};
	price_per_unit: {
		days: number;
		hours: number;
		months: number;
		weeks: number;
	};
	product_id: string;
	total_price: number;
}

const RentalCheckoutPage = () => {
	const params = useParams();
	const productId = params?.productId as string;
	const searchParams = useSearchParams();
	const productLocationId = searchParams?.get("product_location_id");

	const router = useRouter();
	const { user } = useAuthStore();

	const [productDetails, setProductDetails] = useState<SubscriptionProduct | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [paymentSuccess, setPaymentSuccess] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);
	const [startDateTime, setStartDateTime] = useState<Date | undefined>(undefined);
	const [endDateTime, setEndDateTime] = useState<Date | undefined>(undefined);
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
	const [showAddressModal, setShowAddressModal] = useState(false);

	const queryClient = useQueryClient();
	const { data: addresses, isLoading: isLoadingAddresses } = useAddresses({ userId: user?.id, authToken: user?.auth_token });

	const rentProductMutation = useRentProductMutation();

	const formatToISOString = (date?: Date) => {
		if (!date) return '';
		return date.toISOString();
	};

	const { data: priceData, isLoading: isPriceLoading, error: priceError } = useRentPrice({
		start_time: formatToISOString(startDateTime),
		end_time: formatToISOString(endDateTime),
		product_location_id: productLocationId || '',
		user_id: user?.id || '',
		auth_token: user?.auth_token
	});

	const { data: walletData } = useWalletBalance({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	useEffect(() => {
		const data = rentProductMutation?.data;

		if (data?.details?.amount_required) {
			setPendingPaymentAmount(rentProductMutation.data.details.amount_required / 100);
			setShowPaymentModal(true);
			rentProductMutation.reset();

			return;
		}

		if (data?.data.success) {
			queryClient.invalidateQueries([RENTAL_HISTORY_BASE_KEY]);
			router.push('/profile/rental-history');
			rentProductMutation.reset();
		}

	}, [rentProductMutation.data, router, queryClient])

	useEffect(() => {
		if (user?.id && user?.auth_token && productId) {
			fetchProductDetails();
		}
	}, [user?.id, user?.auth_token, productId]);

	const fetchProductDetails = async () => {
		if (!productId || !user?.auth_token) return;

		setIsLoading(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: `
            query GetProductById($id: uuid!) {
              whatsub_subscription_product_by_pk(id: $id) {
                id
                service_id
                product_name
                product_description
                product_photos
              }
            }
          `,
					variables: {
						id: productId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to load product details');
				return;
			}

			const product = data.data?.whatsub_subscription_product_by_pk;
			if (product) {
				setProductDetails({
					id: product.id,
					service_id: product.service_id,
					product_name: product.product_name,
					product_description: product.product_description || '',
					product_photos: product.product_photos || []
				});
			} else {
				setError('Product not found');
			}
		} catch (error) {
			console.error('Error fetching product details:', error);
			setError('Failed to load product details');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRent = () => {
		if (!selectedAddressId) {
			toast.error('Please select a delivery address');
			return;
		}
		if (!startDateTime || !endDateTime) {
			toast.error('Please select rental period');
			return;
		}
		rentProductMutation.mutate({
			address_id: selectedAddressId,
			user_id: user.id,
			product_id: productId,
			product_location_id: productLocationId,
			start_time: formatToISOString(startDateTime),
			end_time: formatToISOString(endDateTime),
			auth_token: user.auth_token,
		});
	};

	const handlePaymentSuccess = () => {
		handleRent();
	};

	const handlePaymentError = (errorMessage: string) => {
		toast.error(`Payment failed: ${errorMessage}`);
	};

	if (isLoading) {
		return (
			<div className="page-container pt-24">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
				</div>
			</div>
		);
	}

	if (!productDetails) {
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
					<h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
					<p className="text-gray-400 mb-6">The subscription product you're looking for could not be found.</p>
					<button onClick={() => router.back()} className="btn btn-primary">
						Go Back
					</button>
				</div>
			</div>
		);
	}



	const isValidRentalPeriod = () => {
		if (!startDateTime || !endDateTime) return false;

		const diffMs = endDateTime.getTime() - startDateTime.getTime();
		const diffDays = diffMs / (1000 * 60 * 60 * 24);

		return diffDays >= 1;
	};

	const getAddressIcon = (type: string) => {
		switch (type) {
			case 'home':
				return <Home className="h-4 w-4 md:h-5 md:w-5" />;
			case 'work':
				return <Building className="h-4 w-4 md:h-5 md:w-5" />;
			case 'hotel':
				return <Hotel className="h-4 w-4 md:h-5 md:w-5" />;
			default:
				return <MapPin className="h-4 w-4 md:h-5 md:w-5" />;
		}
	};

	const handleAddressModalSuccess = () => {
		queryClient.invalidateQueries({ queryKey: ['addresses'] });
		setShowAddressModal(false);
	};


	return (
		<div className="page-container pt-20 pb-8 px-4 md:px-6">
			<div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-8">
				<button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-1.5 md:p-2 hover:bg-dark-400 rounded-lg flex-shrink-0">
					<ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
				</button>
				<div className="flex-1 min-w-0">
					<h1 className="text-xl md:text-3xl font-bold truncate">Rental Checkout</h1>
					<p className="text-xs md:text-base text-gray-400 truncate">Complete your rental order</p>
				</div>
			</div>

			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-0">
						<div className="pb-6 border-b border-gray-700/50">
							<h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
								<Package className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
								Product Details
							</h2>
							<div className="flex items-start gap-3 md:gap-4">
								<div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-white p-2 flex-shrink-0 shadow-lg relative">
									{productDetails.product_photos && productDetails.product_photos.length > 0 ? (
										<Image
											src={productDetails.product_photos[0]}
											alt={productDetails.product_name}
											fill
											className="object-contain"
										/>
									) : (
										<div className="w-full h-full bg-gray-200 flex items-center justify-center">
											<Package className="h-6 w-6 md:h-8 md:w-8 text-gray-500" />
										</div>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-lg md:text-xl font-bold mb-1 text-white leading-tight">{productDetails.product_name}</h3>
									<p className="text-xs md:text-sm text-blue-400 font-medium mb-2">Subscription Rental</p>
									{productDetails.product_description && (
										<p className="text-xs md:text-sm text-gray-400 mt-2 line-clamp-2">{productDetails.product_description}</p>
									)}
								</div>
							</div>
						</div>

						<div className="py-6 border-b border-gray-700/50">
							<div className="flex items-center gap-2 mb-4">
								<Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
								<h2 className="text-base md:text-lg font-bold">Select Rental Period</h2>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<DateTimePicker
									value={startDateTime}
									onChange={setStartDateTime}
									label="Start Date & Time"
								/>
								<DateTimePicker
									value={endDateTime}
									onChange={setEndDateTime}
									label="Return Date & Time"
									minDate={startDateTime}
								/>
							</div>
							{startDateTime && endDateTime && (
								isValidRentalPeriod() ? (
									<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
										<div className="flex items-start gap-2 text-blue-400 text-sm">
											<Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
											<div className="flex-1">
												<p className="font-medium">Rental Duration Confirmed</p>
												<p className="text-gray-300 text-xs mt-1">
													{startDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {startDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} → {endDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {endDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
												</p>
											</div>
										</div>
									</div>
								) : (
									<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
										<div className="flex items-start gap-2 text-red-400 text-sm">
											<AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
											<p>Rental period must be at least 1 day (24 hours)</p>
										</div>
									</div>
								)
							)}
						</div>

						<div className="pt-6">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
									<h2 className="text-base md:text-lg font-bold">Delivery Address</h2>
								</div>
								<button
									onClick={() => setShowAddressModal(true)}
									className="flex items-center gap-1.5 md:gap-2 text-blue-400 hover:text-blue-300 transition-colors text-xs md:text-sm font-medium"
								>
									<Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
									Add New
								</button>
							</div>

							{isLoadingAddresses ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-blue-400" />
								</div>
							) : addresses && addresses.length > 0 ? (
								<div className="space-y-3">
									{addresses.map((address: Address) => (
										<button
											key={address.id}
											onClick={() => setSelectedAddressId(address.id)}
											className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all ${selectedAddressId === address.id
													? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
													: 'border-gray-700/50 bg-dark-400/30 hover:border-gray-600 hover:bg-dark-400/50'
												}`}
										>
											<div className="flex items-start gap-3">
												<div className={`mt-0.5 ${selectedAddressId === address.id ? 'text-blue-400' : 'text-gray-400'
													}`}>
													{getAddressIcon(address.type)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<span className="text-xs md:text-sm font-semibold capitalize text-white">{address.type}</span>
														{selectedAddressId === address.id && (
															<CheckCircle className="h-4 w-4 text-blue-400" />
														)}
													</div>
													<p className="text-xs md:text-sm text-gray-300 font-medium">{address.name}</p>
													<p className="text-xs md:text-sm text-gray-400 mt-1 line-clamp-2">{address.full_address}</p>
													<p className="text-xs text-gray-500 mt-1">{address.contact_number}</p>
												</div>
											</div>
										</button>
									))}
								</div>
							) : (
								<div className="text-center py-8">
									<MapPin className="h-10 w-10 md:h-12 md:w-12 text-gray-600 mx-auto mb-3" />
									<p className="text-sm md:text-base text-gray-400 mb-4">No addresses found</p>
									<button
										onClick={() => setShowAddressModal(true)}
										className="text-blue-400 hover:text-blue-300 transition-colors text-xs md:text-sm font-medium"
									>
										Add your first address
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="lg:col-span-1">
						<div className="bg-gradient-to-br from-dark-500 to-dark-600 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden sticky top-24">
							<div className="p-4 md:p-6 border-b border-gray-700/50">
								<h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
									<CreditCard className="h-5 w-5 text-blue-400" />
									Rental Summary
								</h2>
							</div>

							<div className="p-4 md:p-6">
								{isValidRentalPeriod() && priceData ? (
									<>
										<div className="space-y-3 mb-6">
											{(priceData as PriceData).duration.months > 0 && (
												<div className="flex justify-between items-center">
													<span className="text-gray-400 text-xs md:text-sm">
														{(priceData as PriceData).duration.months} month{(priceData as PriceData).duration.months > 1 ? 's' : ''}
													</span>
													<span className="text-white font-medium text-sm md:text-base">₹{((priceData as PriceData).duration.months * (priceData as PriceData).price_per_unit.months).toFixed(2)}</span>
												</div>
											)}
											{(priceData as PriceData).duration.weeks > 0 && (
												<div className="flex justify-between items-center">
													<span className="text-gray-400 text-xs md:text-sm">
														{(priceData as PriceData).duration.weeks} week{(priceData as PriceData).duration.weeks > 1 ? 's' : ''}
													</span>
													<span className="text-white font-medium text-sm md:text-base">₹{((priceData as PriceData).duration.weeks * (priceData as PriceData).price_per_unit.weeks).toFixed(2)}</span>
												</div>
											)}
											{(priceData as PriceData).duration.days > 0 && (
												<div className="flex justify-between items-center">
													<span className="text-gray-400 text-xs md:text-sm">
														{(priceData as PriceData).duration.days} day{(priceData as PriceData).duration.days > 1 ? 's' : ''}
													</span>
													<span className="text-white font-medium text-sm md:text-base">₹{((priceData as PriceData).duration.days * (priceData as PriceData).price_per_unit.days).toFixed(2)}</span>
												</div>
											)}
											{(priceData as PriceData).duration.hours > 0 && (
												<div className="flex justify-between items-center">
													<span className="text-gray-400 text-xs md:text-sm">
														{(priceData as PriceData).duration.hours} hour{(priceData as PriceData).duration.hours > 1 ? 's' : ''}
													</span>
													<span className="text-white font-medium text-sm md:text-base">₹{((priceData as PriceData).duration.hours * (priceData as PriceData).price_per_unit.hours).toFixed(2)}</span>
												</div>
											)}

											{walletData && walletData.unlocked_amount > 0 && (
												<div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
													<span className="text-gray-400 text-xs md:text-sm flex items-center gap-2">
														<Wallet className="h-4 w-4" />
														Wallet Balance
													</span>
													<span className="text-green-400 font-medium text-sm md:text-base">
														- ₹{Math.min(walletData.unlocked_amount / 100).toFixed(2)}
													</span>
												</div>
											)}
										</div>

										<div className="bg-dark-400/50 rounded-xl p-4 mb-6">
											<div className="flex justify-between items-center">
												<span className="font-bold text-base md:text-lg">Amount To Pay</span>
												<span className="font-bold text-xl md:text-2xl text-[#2CFF05]">
													₹{walletData
														? Math.max(0, (priceData as PriceData).total_price - (walletData.unlocked_amount / 100)).toFixed(2)
														: (priceData as PriceData).total_price.toFixed(2)
													}
												</span>
											</div>
										</div>
									</>
								) : isPriceLoading ? (
									<div className="py-12 flex flex-col items-center gap-3">
										<Loader2 className="h-8 w-8 animate-spin text-blue-400" />
										<span className="text-gray-400 text-xs md:text-sm">Calculating price...</span>
									</div>
								) : !isValidRentalPeriod() ? (
									<div className="py-12 text-center">
										<Calendar className="h-10 w-10 md:h-12 md:w-12 text-gray-600 mx-auto mb-3" />
										<p className="text-gray-400 text-xs md:text-sm">Select rental period to see pricing</p>
									</div>
								) : null}

								{error && (
									<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
										<div className="flex items-start gap-2 text-red-400 text-xs md:text-sm">
											<AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
											<span>{error}</span>
										</div>
									</div>
								)}

								<button
									onClick={handleRent}
									disabled={rentProductMutation.isPending || !isValidRentalPeriod() || isPriceLoading || !priceData || !selectedAddressId}
									className="w-full py-3 md:py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none text-sm md:text-base"
								>
									{rentProductMutation.isPending ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
											Processing...
										</>
									) : isPriceLoading ? (
										<>
											<Loader2 className="h-5 w-5 animate-spin" />
											Loading...
										</>
									) : !isValidRentalPeriod() ? (
										'Select Rental Period'
									) : !priceData ? (
										'Calculating...'
									) : !selectedAddressId ? (
										'Select Delivery Address'
									) : (
										<>
											<CreditCard className="h-4 w-4 md:h-5 md:w-5" />
											Complete Order
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={pendingPaymentAmount}
				onSuccess={handlePaymentSuccess}
				onError={handlePaymentError}
				title="Add Money to Wallet"
				description="Add money to your wallet to complete the subscription purchase"
			/>

			<AddAddressModal
				isOpen={showAddressModal}
				onClose={() => setShowAddressModal(false)}
				onSuccess={handleAddressModalSuccess}
			/>
		</div>
	);
};



const ProtectedRentalCheckoutPage = () => {
	return (
		<ProtectedRoute>
			<RentalCheckoutPage />
		</ProtectedRoute>
	)
}

export default RentalCheckoutPage;
