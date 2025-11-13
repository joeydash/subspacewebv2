'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Search, Star, Clock, Play, Package, TrendingUp, UserPlus, Crown, Award } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import SubscriptionManagementModal from '@/components/subscription-management-modal';
import LoginModal from '@/components/login-modal';
import RentProductModal from '@/components/rent-product-modal';
import { useCurrentLocation } from '@/lib/context/location-context';
import { useSearchResults } from '@/lib/hooks/search/use-search-results';

interface SubscriptionProduct {
	id: string;
	service_id: string;
	product_name: string;
	product_description: string;
	product_photos: Array<{ url: string }>;
	base_price: string;
	latitude: string;
	longitude: string;
	radius_meters: string;
	created_at: string;
	updated_at: string;
	product_location_id?: string;
}


const SearchResultsPageContent = () => {
	const { user, isAuthenticated } = useAuthStore();
	const { t } = useLanguageStore();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [showLogin, setShowLogin] = useState(false);
	const { location } = useCurrentLocation();
	const [serviceId, setServiceId] = useState('');
	const [showRentModal, setShowRentModal] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<SubscriptionProduct | null>(null);

	const searchQuery = searchParams.get('title') || '';
	const suggestionId = searchParams.get('suggestionId') || '';
	const suggestionIndex = searchParams.get('index') || '';

	const { data: searchResults, isLoading, error } = useSearchResults({
		searchQuery,
		user,
		suggestionId,
		suggestionIndex,
		location: location || { latitude: '', longitude: '' }
	});

	const handleServiceClick = (service: any) => {
		if (service.id) {
			router.push(`/products/${service.id}`);
		}
	};

	const handleGroupClick = (group: any) => {
		router.push('/groups/' + group.whatsub_plans.id);
	};

	const handleTrackService = (serviceId: string) => {
		setServiceId(serviceId);
	};

	const handleRentNowClick = (product: SubscriptionProduct) => {
		if (!isAuthenticated) {
			setShowLogin(true);
			return;
		}
		setSelectedProduct(product);
		setShowRentModal(true);
	};

	const handleRentConfirm = (startTime: string, endTime: string) => {
		if (selectedProduct) {
			router.push(`/rental-checkout/${selectedProduct.id}?product_location_id=${selectedProduct.product_location_id}`);
		}
	};

	const getTotalResults = () => {
		if (!searchResults) return 0;
		return (
			searchResults.services.length +
			searchResults.shows_and_movies.length +
			searchResults.shared_subscriptions.length +
			searchResults.shop_products.length +
			searchResults.subscription_products.length
		);
	};

	const getDurationDisplay = (duration: number, durationType: string) => {
		if (durationType === 'months') {
			if (duration === 3) return 'Quarter';
			if (duration === 6) return 'Half Year';
			if (duration === 12) return 'Year';
		} else if (durationType === 'years') {
			if (duration === 1) return 'Year';
		}

		// Fallback to original format
		const typeMap: { [key: string]: string } = {
			'months': 'Month',
			'years': 'Year',
			'quarters': 'Quarter'
		};

		return typeMap[durationType] || 'Month';
	};

	const formatRating = (rating: number) => {
		return rating ? rating.toFixed(1) : '0.0';
	};

	const getRankIcon = (index: number) => {
		switch (index) {
			case 0:
				return <Crown className="h-4 w-4 text-yellow-400" />;
			case 1:
				return <Award className="h-4 w-4 text-gray-300" />;
			case 2:
				return <Award className="h-4 w-4 text-orange-400" />;
			default:
				return null;
		}
	};

	return (
		<div className="page-container pt-24">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<button
					onClick={() => router.push('/')}
					className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
				>
					<ArrowLeft className="h-6 w-6" />
				</button>
				<div className="flex-1">
					<h1 className="text-3xl font-bold">Search Results</h1>
					<p className="text-gray-400">
						{isLoading ? 'Searching...' : `Results for "${searchQuery}"`}
					</p>
				</div>
				{!isLoading && searchResults && (
					<div className="hidden md:flex items-center gap-2 bg-dark-500 rounded-lg p-3">
						<Search className="h-5 w-5 text-indigo-400" />
						<span className="text-sm font-medium">{getTotalResults()} results found</span>
					</div>
				)}
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
					<p className="text-red-400">{error instanceof Error ? error.message : 'Failed to fetch search results'}</p>
				</div>
			)}

			{/* Results */}
			{!isLoading && !error && searchResults && (
				<>
					{getTotalResults() === 0 ? (
						<div className="bg-dark-500 rounded-xl p-12 text-center">
							<div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<Search className="h-8 w-8 text-gray-500" />
							</div>
							<h3 className="text-xl font-bold mb-2">No Results Found</h3>
							<p className="text-gray-400">
								No results found for "{searchQuery}". Try searching with different keywords.
							</p>
						</div>
					) : (
						<div className="space-y-8">
							{/* Brands Section - Only show when shop_products is not empty */}
							{searchResults.shop_products.length > 0 && (
								<section>
									<h2 className="text-2xl font-bold mb-6 text-gray-300">Brands</h2>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
										{searchResults.shop_products.map((product: any, index: number) => (
											<div
												key={product.id || index}
												onClick={() => handleServiceClick(product)}
												className="relative bg-dark-500 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 border border-gray-700/50 hover:border-indigo-500/50 group"
											>
												{/* Discount Badge */}
												{!!product.flexipay_discount && (
													<div className="absolute top-3 left-3 bg-green-500 text-white text-sm px-3 py-1 rounded-lg font-medium z-10">
														UPTO {product.flexipay_discount}% OFF
													</div>
												)}

												{/* Rank Badge for top 3 */}
												{index < 3 && (
													<div className="absolute top-3 right-3 z-10">
														{getRankIcon(index)}
													</div>
												)}

											{/* Background Image */}
											<div className="h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 relative overflow-hidden">
												<Image
													src={product.poster_url || product.image_url}
													alt={product.service_name}
													fill
													className="object-cover transition-transform duration-300 group-hover:scale-110"
												/>
												<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>													{/* Service Info Overlay */}
													<div className="absolute bottom-0 left-0 right-0 p-4">
														<div className="flex items-end gap-3">
															<div className="w-12 h-12 rounded-lg overflow-hidden bg-white p-1 flex-shrink-0">
																<Image
																	src={product.image_url}
																	alt={product.service_name}
																	width={48}
																	height={48}
																	className="object-contain"
																/>
															</div>
															<div className="flex-1 min-w-0">
																<h3 className="font-bold text-white text-lg mb-1 truncate">
																	{product.service_name}
																</h3>
																<p className="text-yellow-400 text-sm font-medium">
																	Starting at ₹{product.whatsub_plans?.[0]?.discounted_price || product.whatsub_plans?.[0]?.price || 99}
																</p>
															</div>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</section>
							)}

							{/* Groups Section */}
							{searchResults.shared_subscriptions.length > 0 && (
								<section>
									<h2 className="text-2xl font-bold mb-6 text-gray-300">Groups</h2>
									<div className="space-y-4">
										{searchResults.shared_subscriptions.map((group: any, index: number) => (
											<div
												key={group.id || index}
												className="bg-dark-500 rounded-xl p-4 transition-all duration-300 hover:bg-dark-400 border border-gray-700/50 hover:border-green-500/50 group max-w-xl"
											>
											<div className="flex items-center gap-3">
												<div className="w-12 h-12 rounded-full overflow-hidden bg-white p-1 flex-shrink-0">
													<Image
														src={group.image_url || group.room_dp}
														alt={group.name || group.service_name}
														width={48}
														height={48}
														className="object-cover"
													/>
												</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-1">
															<h3 className="font-bold text-white text-lg group-hover:text-green-400 transition-colors truncate">
																{group.name || group.service_name}
															</h3>
															{group.admin_name && (
																<span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full flex-shrink-0">
																	by {group.admin_name}
																</span>
															)}
														</div>
														<div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
															<span className="text-green-400 font-medium">
																₹{Math.ceil((group.whatsub_plans?.price || group.price || 0) / (group.group_limit || group.share_limit || 1))} / User / {getDurationDisplay(group.whatsub_plans?.duration, group.whatsub_plans?.duration_type)}
															</span>
														</div>
														<div className="text-xs text-gray-400">
															{group.number_of_users || 0} / {group.share_limit || group.group_limit || 1} friends sharing
														</div>
														{group.expiring_at && (
															<div className="flex items-center gap-1 text-xs text-orange-400 mt-1">
																<Clock className="h-4 w-4" />
																<span>Expires {new Date(group.expiring_at).toLocaleDateString()}</span>
															</div>
														)}
													</div>
													<button
														onClick={(e) => {
															if (!isAuthenticated) {
																setShowLogin(true);
																return;
															}
															e.stopPropagation();
															handleGroupClick(group);
														}}
														className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap text-sm flex-shrink-0"
													>
														<UserPlus className="h-4 w-4" />
														Join
													</button>
												</div>
											</div>
										))}
									</div>
								</section>
							)}

							{/* Track Subscriptions Section */}
							{searchResults.services.length > 0 && (
								<section>
									<h2 className="text-2xl font-bold mb-6 text-gray-300">Track Subscriptions</h2>
									<div className="space-y-3">
										{searchResults.services.map((service: any, index: number) => (
											<div
												key={`track-${service.id || index}`}
												onClick={() => {
													if (!isAuthenticated) {
														setShowLogin(true);
														return;
													}
													handleTrackService(service.id)
												}}
												className="bg-dark-500 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:bg-dark-400 border border-gray-700/50 hover:border-yellow-500/50 group max-w-xl"
											>
											<div className="flex items-center gap-4">
												<div className="w-12 h-12 rounded-full overflow-hidden bg-white p-1 flex-shrink-0">
													<Image
														src={service.image_url}
														alt={service.title || service.service_name}
														width={48}
														height={48}
														className="object-contain"
													/>
												</div>
													<div className="flex-1">
														<h3 className="font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
															{service.title || service.service_name}
														</h3>
														<div className="flex items-center gap-2">
															<Star className="h-4 w-4 text-yellow-400 fill-current" />
															<span className="text-yellow-400 font-medium">
																{formatRating(service.playstore_rating)}
															</span>
															{service.playstore_number_of_ratings && (
																<span className="text-gray-400 text-sm">
																	({(service.playstore_number_of_ratings / 1000000).toFixed(1)}M)
																</span>
															)}
														</div>
													</div>
													<button
														onClick={(e) => {
															if (!isAuthenticated) {
																setShowLogin(true);
																return;
															}

															e.stopPropagation();
															handleTrackService(service.id);
														}}
														className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
													>
														<TrendingUp className="h-4 w-4" />
														Track
													</button>
												</div>
											</div>
										))}
									</div>
								</section>
							)}

							{/* Subscription Products Section (Offline Products) */}
							{searchResults.subscription_products.length > 0 && (
								<section>
									<h2 className="text-2xl font-bold mb-6 text-gray-300">Offline Products</h2>
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
										{searchResults.subscription_products.map((product: SubscriptionProduct, index: number) => {
											const mainPhoto = product.product_photos?.[0]?.url || '';

											return (
												<div
													key={product.id || index}
													className="relative rounded-lg overflow-hidden transition-all duration-300 bg-dark-500 border border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
												>
												<div className="relative aspect-[4/3] overflow-hidden bg-dark-400">
													{mainPhoto ? (
														<Image
															src={mainPhoto}
															alt={product.product_name}
															fill
															className="object-cover transition-transform duration-300 group-hover:scale-110"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center">
															<Package className="h-8 w-8 text-gray-600" />
														</div>
													)}
														<div className="absolute top-1.5 right-1.5 bg-blue-500/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
															Rental
														</div>
													</div>

													<div className="p-3">
														<h4 className="font-semibold text-sm mb-1.5 text-white leading-tight line-clamp-1">{product.product_name}</h4>

														<p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
															{product.product_description}
														</p>

														<div className="flex items-baseline gap-1 mb-2">
															<span className="text-lg font-bold text-emerald-400">
																₹{parseFloat(product.base_price).toFixed(0)}
															</span>
															<span className="text-[10px] text-gray-500">/hr</span>
														</div>

														<button
															onClick={() => handleRentNowClick(product)}
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
								</section>
							)}

							{/* Shows and Movies Section */}
							{searchResults.shows_and_movies.length > 0 && (
								<section>
									<h2 className="text-2xl font-bold mb-6 text-gray-300">Shows & Movies</h2>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
										{searchResults.shows_and_movies.map((item: any, index: number) => (
											<div
												key={item.id || index}
												className="bg-dark-500 rounded-xl overflow-hidden hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-purple-500/50 group cursor-pointer"
											>
											<div className="aspect-[3/4] relative overflow-hidden">
												<Image
													src={item.image_url || item.poster_url}
													alt={item.title || item.name}
													fill
													className="object-cover transition-transform duration-300 group-hover:scale-110"
												/>
												<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>													{/* Play Button Overlay */}
													<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
														<div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
															<Play className="h-6 w-6 text-white ml-1" />
														</div>
													</div>

													{/* Title Overlay */}
													<div className="absolute bottom-0 left-0 right-0 p-3">
														<h3 className="font-bold text-white text-sm leading-tight">
															{item.title || item.name}
														</h3>
														{item.genre && (
															<p className="text-gray-300 text-xs mt-1 truncate">{item.genre}</p>
														)}
														{item.year && (
															<p className="text-gray-400 text-xs">{item.year}</p>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								</section>
							)}
						</div>
					)}
				</>
			)}

			{serviceId && (
				<SubscriptionManagementModal
					isOpen={serviceId != ''}
					onClose={() => {
						setServiceId('');
					}}
					serviceId={serviceId || undefined}
					onSuccess={() => {
						setServiceId('');
					}}
					mode="add"
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

const SearchResultsPage = () => {
	return (
		<Suspense fallback={
			<div className="page-container pt-24">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
				</div>
			</div>
		}>
			<SearchResultsPageContent />
		</Suspense>
	);
};

export default SearchResultsPage;