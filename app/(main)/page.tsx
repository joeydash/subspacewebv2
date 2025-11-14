'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';

import CarouselSkeleton from './components/skeletons/carousel-skeleton';
import FavoriteBrandsSkeleton from './components/skeletons/favorite-brands-skeleton';
import CategoriesSkeleton from './components/skeletons/categories-skeleton';
import SharedSubscriptionsSkeleton from './components/skeletons/shared-subscriptions-skeleton';

import RentProductClasses from './components/rent-product-classes';
import InfiniteScroller from "./components/infinite-scroller";


import { useCarousels } from '@/lib/hooks/carousels/use-carousels';
import { useFavouriteBrands } from '@/lib/hooks/brands/use-favorite-brands';
import { useBrandCategories } from '@/lib/hooks/brands/use-brand-categories';
import { usePublicGroups } from '@/lib/hooks/groups/use-public-groups';

interface Carousel {
	type: string;
	image_url: string;
	blurhash: string;
	data: {
		args: {
			brand_id: string;
		};
		url?: string;
		route: string;
	};
}

interface CarouselSectionProps {
	isAuthenticated: boolean;
	user: any;
}

const CarouselSection = ({ isAuthenticated, user }: CarouselSectionProps) => {
	const [currentSlide, setCurrentSlide] = useState(0);
	const router = useRouter();

	const { data: carousels, isLoading: isLoadingCarousels } = useCarousels({ isAuthenticated, user });

	const handleCarouselClick = (carousel: Carousel) => {
		try {
			let data;
			if (typeof carousel.data === 'string') {
				try {
					data = JSON.parse(carousel.data);
				} catch (parseError) {
					console.error('Error parsing carousel data:', parseError);
					return;
				}
			} else {
				data = carousel.data;
			}

			if (data?.args?.brand_id) {
				router.push(`/products/${data.args.brand_id}`);
			} else if (data?.url) {
				window.open(data.url, '_blank', 'noopener,noreferrer');
			} else {
				console.log('No navigation action available - no brand_id or url found');
			}
		} catch (error) {
			console.error('Error handling carousel click:', error);
		}
	};

	useEffect(() => {
		if (carousels?.length === 0) return;

		const interval = setInterval(() => {
			setCurrentSlide((prev) => (prev + 1) % carousels?.length);
		}, 5000);

		return () => clearInterval(interval);
	}, [carousels?.length]);

	if (isLoadingCarousels) {
		return <CarouselSkeleton count={3} />;
	}

	if (!carousels?.length) return null;

	return (
		<div className="mb-8 md:mb-12">
			<div className="relative h-56 xs:h-64 sm:h-52 overflow-hidden">
				<div className="flex items-center justify-center h-full relative">
					{[...carousels, ...carousels, ...carousels].map((carousel, index) => {
						const actualIndex = index % carousels.length;
						const offset = index - (currentSlide + carousels.length);
						const isCenter = offset === 0;
						const isAdjacent = Math.abs(offset) === 1;
						const isVisible = Math.abs(offset) <= 3;

						if (!isVisible) return null;

						return (
							<div
								key={`${actualIndex}-${Math.floor(index / carousels.length)}`}
								className={`absolute transition-all duration-700 ease-out cursor-pointer ${isCenter
									? 'z-30 scale-100 opacity-100'
									: isAdjacent
										? 'z-20 scale-75 opacity-60'
										: Math.abs(offset) === 2
											? 'z-10 scale-50 opacity-30'
											: 'z-0 scale-25 opacity-10'
									}`}
								style={{
									transform: `translateX(${offset * 280}px) scale(${isCenter ? 1 : isAdjacent ? 0.75 : Math.abs(offset) === 2 ? 0.5 : 0.25
										})`,
								}}
								onClick={() => {
									if (isCenter) {
										handleCarouselClick(carousel);
									} else {
										const targetSlide = actualIndex;
										setCurrentSlide(targetSlide);
									}
								}}
							>
								<div className={`relative aspect-video md:w-96 md:h-48 lg:w-wd lg:h-56 rounded-2xl overflow-hidden shadow-2xl group ${!isCenter ? 'filter blur-sm' : ''
									}`}>
									{carousel.image_url.endsWith('.webm') ? (
										<video
											src={carousel.image_url}
											autoPlay
											loop
											muted
											playsInline
											className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
										>
											Your browser does not support the video tag.
										</video>
									) : (
										<Image
											src={carousel.image_url}
											alt="carousel image"
											fill
											className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
										/>
									)}
									<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20"></div>
									<div className="absolute inset-0 bg-linear-to-r from-black/30 via-transparent to-black/30"></div>
								</div>
							</div>
						);
					})}
				</div>

				<button
					onClick={() => {
						setCurrentSlide((prev) => (prev - 1 + carousels.length) % carousels.length);
					}}
					className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>

				<button
					onClick={() => {
						setCurrentSlide((prev) => (prev + 1) % carousels.length);
					}}
					className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			<div className="flex justify-center items-center space-x-2 md:space-x-3 mt-4 md:mt-6">
				{carousels.map((_, index: number) => (
					<button
						key={index}
						onClick={() => setCurrentSlide(index)}
						className={`rounded-full transition-all duration-300 ${index === currentSlide
							? 'w-6 h-2.5 md:w-8 md:h-3 bg-indigo-500 shadow-lg shadow-indigo-500/50 scale-110'
							: 'w-2.5 h-2.5 md:w-3 md:h-3 bg-white/40 hover:bg-white/60 hover:scale-125 hover:shadow-md'
							}`}
					/>
				))}
			</div>
		</div>
	);
};



const ExplorePage = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const { user, isAuthenticated } = useAuthStore();
	const { t } = useLanguageStore();
	const router = useRouter();

	const {
		data: favouriteBrands,
		isLoading: isLoadingFavouriteBrands
	} = useFavouriteBrands({ isAuthenticated, user });
	const {
		data: brandCategories,
		isLoading: isLoadingBrandCategories
	} = useBrandCategories({ userId: user?.id, authToken: user?.authToken });
	const {
		data: publicGroups,
		isLoading: isLoadingPublicGroups
	} = usePublicGroups({ userId: user?.id, authToken: user?.auth_token });


	return (
		<>
			<div className='pt-[55px] md:pt-1'>
				<InfiniteScroller />
			</div>
			<div className="page-container pt-4 lg:pt-20">
				<CarouselSection isAuthenticated={isAuthenticated} user={user} />

				{/* Favorite Brands */}
				<section className="mb-8 md:mb-12">
					<div className="flex items-center justify-between mb-4 md:mb-6">
						<h2 className="text-xl md:text-2xl font-bold">{t('explore.favouriteBrands')}</h2>
					</div>
					{isLoadingFavouriteBrands ? (
						<FavoriteBrandsSkeleton count={15} />
					) : (
						<div className="relative">
							<div className="overflow-x-auto pb-4 hide-scrollbar">
								<div className="flex space-x-4 px-1 ">
									{favouriteBrands?.map((brand) => (
										<div key={brand.brand_id} className="flex flex-col items-center w-20">
											<Link href={`/products/${brand.brand_id}`} className="group cursor-pointer block">
												<div className="relative w-16 h-16 rounded-full overflow-hidden mt-4 mb-4 border-2 border-indigo-500/20 transition-all duration-300 transform group-hover:scale-105 group-hover:border-white/60">
													<Image
														src={brand.whatsub_service.image_url}
														alt="Brand logo"
														fill
														className="object-cover transition-transform duration-300 group-hover:scale-110"
													/>
												</div>
												{brand.whatsub_service.discount_text !== "0" && (
													<div className="text-center">
														<p className="flex-1 text-[10px] font-medium bg-gray-500/10 text-white rounded-full py-1 px-2 whitespace-nowrap overflow-hidden">
															{brand.whatsub_service.discount_text}
														</p>
													</div>
												)}
											</Link>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</section>
				{/* Categories & Subscriptions Grid */}
				{/* Categories */}
				<section className="mb-8 md:mb-12">
					<div className="flex items-center justify-between mb-4 md:mb-6">
						<h2 className="text-xl md:text-2xl font-bold">Gift Cards</h2>
						<Link href="/all-brands" className="text-indigo-400 hover:text-indigo-300 transition-colors">
							{t('common.viewAll')}
						</Link>
					</div>
					{isLoadingBrandCategories ? (
						<CategoriesSkeleton count={8} />
					) : (
						<div className="relative">
							<div className="overflow-x-auto pb-4 hide-scrollbar">
								<div className="flex flex-col space-y-6 px-1" style={{ width: `${Math.ceil(brandCategories.length / 2) * (256 + 24)}px` }}>
									{/* First Row */}
									<div className="flex space-x-6">
										{brandCategories?.filter((_, index) => index % 2 === 0).map((category) => (
											<div
												key={category.name}
												onClick={() => router.push(`/all-brands?category=${encodeURIComponent(category.name)}`)}
												className="w-64 h-40 rounded-xl overflow-hidden group cursor-pointer relative transition-all duration-300 transform hover:scale-105"
												style={{
													backgroundImage: `url(${category.poster})`,
													backgroundSize: 'cover',
													backgroundPosition: 'center'
												}}
											>
												<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
												<div className="absolute inset-0 bg-linear-to-b from-black/70 via-transparent to-transparent" />
												<div className="absolute inset-0 p-6 pt-4 flex flex-col justify-between">
													<div className="flex justify-end">
														<div className="bg-white/20 text-white text-sm px-3 py-1 rounded-full font-medium">
															{category.service_count}+ {t('explore.brands')}
														</div>
													</div>
													<div className="flex flex-col items-end">
														<h3 className="text-white font-bold text-lg mb-2">{category.name}</h3>
														<div className="flex -space-x-1">
															{category.service_images.slice(0, 4).map((image, index) => (
																<div
																	key={index}
																	className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-white/10 backdrop-blur-sm relative"
																>
																	<Image
																		src={image}
																		alt=""
																		fill
																		className="object-cover"
																	/>
																</div>
															))}
															{category.service_count > 4 && (
																<div className="w-10 h-10 rounded-full border-2 border-black bg-white/20 flex items-center justify-center text-xs text-black font-medium">
																	+{category.service_count - 4}
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>

									{/* Second Row */}
									<div className="flex space-x-6">
										{brandCategories?.filter((_, index) => index % 2 === 1).map((category) => (
											<div
												key={category.name}
												onClick={() => router.push(`/all-brands?category=${encodeURIComponent(category.name)}`)}
												className="w-64 h-40 rounded-xl overflow-hidden group cursor-pointer relative transition-all duration-300 transform hover:scale-105"
												style={{
													backgroundImage: `url(${category.poster})`,
													backgroundSize: 'cover',
													backgroundPosition: 'center'
												}}
											>
												<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
												<div className="absolute inset-0 bg-linear-to-b from-black/70 via-transparent to-transparent" />
												<div className="absolute inset-0 p-6 pt-4 flex flex-col justify-between">
													<div className="flex justify-end">
														<div className="bg-white/20 text-white text-sm px-3 py-1 rounded-full font-medium">
															{category.service_count}+ {t('explore.brands')}
														</div>
													</div>
													<div className="flex flex-col items-end">
														<h3 className="text-white font-bold text-lg mb-2">{category.name}</h3>
														<div className="flex -space-x-1">
															{category.service_images.slice(0, 4).map((image, index) => (
																<div
																	key={index}
																	className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-white/10 backdrop-blur-sm relative"
																>
																	<Image
																		src={image}
																		alt=""
																		fill
																		className="object-cover"
																	/>
																</div>
															))}
															{category.service_count > 4 && (
																<div className="w-10 h-10 rounded-full border-2 border-black bg-white/20 flex items-center justify-center text-xs text-black font-medium">
																	+{category.service_count - 4}
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					)}
				</section>

				{/* Products Gift Cards */}
				<RentProductClasses />

				{/* Shared Subscriptions */}
				<section className="mb-8 md:mb-12">
					<div className="flex items-center justify-between mb-4 md:mb-6">
						<h2 className="text-xl md:text-2xl font-bold">{t('explore.sharedSubscriptions')}</h2>
						<Link href="/public-groups" className="text-blue-400 hover:text-blue-300 transition-colors text-sm md:text-base">
							{t('common.viewAll')}
						</Link>
					</div>
					{isLoadingPublicGroups ? (
						<SharedSubscriptionsSkeleton count={8} />
					) : (
						<div className="relative">
							<div className="overflow-x-auto pb-4 hide-scrollbar">
								<div className="flex flex-col space-y-4 md:space-y-6 px-1" style={{ width: `${Math.ceil((publicGroups?.length || 0) / 2) * (320 + 24)}px` }}>
									{/* First Row */}
									<div className="flex space-x-4 md:space-x-6">
										{publicGroups?.filter((_, index) => index % 2 === 0).map((group) => (
											<Link
												href={`/groups/${group.whatsub_plans.id}?search=${encodeURIComponent(group.name)}`}
												key={group.name}
												className="w-72 md:w-80 bg-[#2A2D3A] rounded-xl p-4 md:p-6 hover:bg-[#323544] transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 group border border-gray-700/30"
											>
												<div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
													<div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-transparent p-1.5 md:p-2 group-hover:bg-white/20 transition-colors shrink-0 relative">
														<Image
															src={group.room_dp}
															alt={group.name}
															fill
															className="object-contain"
														/>
													</div>
													<div className="flex-1 min-w-0">
														<h3 className="font-bold text-base md:text-lg text-white group-hover:text-blue-400 transition-colors truncate">
															{group.name}
														</h3>
														<div className="text-xs md:text-sm text-gray-400 mt-1">
															{group.group_limit} {t('explore.peopleSharing')}
														</div>
													</div>
												</div>

												<div className="space-y-2 md:space-y-3">
													<div className="flex items-baseline gap-2">
														<span className="text-xl md:text-2xl font-bold text-[#2CFF05]">
															₹{Math.ceil(group.whatsub_plans.price / group.share_limit)}
														</span>
														<span className="text-gray-400 text-sm md:text-base">/device</span>
													</div>

													<div className="flex items-center justify-between gap-2">
														<div className="text-xs md:text-sm text-gray-400 truncate">
															{t('explore.duration')}: {group.whatsub_plans.duration} {group.whatsub_plans.duration_type}
														</div>
														<div className="bg-linear-to-r from-blue-500/40 to-purple-600/40 text-white text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium whitespace-nowrap">
															{group.count}+ {t('explore.groups')}
														</div>
													</div>
												</div>
											</Link>
										))}
									</div>

									{/* Second Row */}
									<div className="flex space-x-4 md:space-x-6">
										{publicGroups?.filter((_, index) => index % 2 === 1).map((group) => (
											<Link
												href={`/groups/${group.whatsub_plans.id}?search=${encodeURIComponent(group.name)}`}
												key={group.name}
												className="w-72 md:w-80 bg-[#2A2D3A] rounded-xl p-4 md:p-6 hover:bg-[#323544] transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 group border border-gray-700/30"
											>
												<div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
													<div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-transparent p-1.5 md:p-2 group-hover:bg-white/20 transition-colors shrink-0 relative">
														<Image
															src={group.room_dp}
															alt={group.name}
															fill
															className="object-contain"
														/>
													</div>
													<div className="flex-1 min-w-0">
														<h3 className="font-bold text-base md:text-lg text-white group-hover:text-blue-400 transition-colors truncate">
															{group.name}
														</h3>
														<div className="text-xs md:text-sm text-gray-400 mt-1">
															{group.group_limit} {t('explore.peopleSharing')}
														</div>
													</div>
												</div>

												<div className="space-y-2 md:space-y-3">
													<div className="flex items-baseline gap-2">
														<span className="text-xl md:text-2xl font-bold text-[#2CFF05]">
															₹{Math.ceil(group.whatsub_plans.price / group.share_limit)}
														</span>
														<span className="text-gray-400 text-sm md:text-base">/device</span>
													</div>

													<div className="flex items-center justify-between gap-2">
														<div className="text-xs md:text-sm text-gray-400 truncate">
															{t('explore.duration')}: {group.whatsub_plans.duration} {group.whatsub_plans.duration_type}
														</div>
														<div className="bg-linear-to-r from-blue-500/40 to-purple-600/40 text-white text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium whitespace-nowrap">
															{group.count}+ {t('explore.groups')}
														</div>
													</div>
												</div>
											</Link>
										))}
									</div>
								</div>
							</div>
						</div>
					)}
				</section>
			</div>
		</>
	);
};

export default ExplorePage;