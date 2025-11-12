'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { ArrowLeft, Search } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/language-store';
import { BrandsPageSkeleton } from '@/skeletons/brands-skeleton';

import { useRentProductBrands } from '@/lib/hooks/rent/use-rent-product-brands';
import { useCurrentLocation } from '@/lib/context/location-context';

const RentalBrandsPage = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [searchQuery, setSearchQuery] = useState('');
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const selectedCategory = searchParams.get('category') || 'All';

	const { location: globalLocation } = useCurrentLocation();
	const { data, isLoading } = useRentProductBrands({
		userId: user?.id || '',
		authToken: user?.auth_token || '',
		address: globalLocation
	});

	const rentalBrands = useMemo(() => data?.brands || [], [data?.brands]);
	const categories = useMemo(() => data?.categories || ['All'], [data?.categories]);

	const handleCategoryNavigation = useCallback(
		(category: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (category === 'All') {
				params.delete('category');
			} else {
				params.set('category', category);
			}
			const queryString = params.toString();
			router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
		},
		[pathname, router, searchParams]
	);

	const filteredBrands = useMemo(
		() =>
			rentalBrands.filter(brand => {
				const matchesSearch = brand.service_name.toLowerCase().includes(searchQuery.toLowerCase());
				const matchesCategory = selectedCategory === 'All' || brand.class === selectedCategory;
				return matchesSearch && matchesCategory;
			}),
		[rentalBrands, searchQuery, selectedCategory]
	);

	return (
		<div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 space-y-4">
					<div className="flex items-center gap-3">
						<Link href="/" className="text-gray-400 hover:text-white transition-colors">
							<ArrowLeft className="h-6 w-6" />
						</Link>
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{t('brands.title')}</h1>
					</div>

					{/* Search Bar */}
					<div className="relative w-full">
						<input
							type="text"
							placeholder={t('brands.searchPlaceHolder')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input pl-12 py-3 w-full rounded-2xl"
						/>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					</div>
				</div>

				{/* Filters */}
				{!isLoading && (
					<div className="mb-6">
						<div className="relative">
							<div className="overflow-x-auto pb-2 hide-scrollbar">
								<div className="flex space-x-2 px-1 min-w-max">
									{Array.from(categories).map((category) => (
										<button
											key={category}
											onClick={() => {
												handleCategoryNavigation(category);
											}}
											className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium ${selectedCategory === category
												? 'bg-slate-600 text-white shadow-lg hover:bg-slate-500'
												: 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
												}`}
										>
											{category === 'All' ? t('common.all') : category}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Brands Grid */}
				{isLoading ? (
					<BrandsPageSkeleton
						showCategories={true}
						categoriesCount={8}
						brandsCount={12}
					/>
				) : filteredBrands.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-gray-400 text-lg">{t('brands.noBrands')}</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{filteredBrands.map((service) => (
							<Link
								href={`/products/${service.id}?section=offline_products`}
								key={service.id}
								className="bg-slate-800/30 rounded-lg overflow-hidden group hover:ring-2 hover:ring-slate-500 transition-all cursor-pointer"
							>
								<div className="relative aspect-square overflow-hidden">
									{(service.backdrop_url || service.image_url) ? (
										<Image
											src={service.backdrop_url || service.image_url || ''}
											alt={service.service_name}
											fill
											className="object-cover transition-transform duration-300 group-hover:scale-110"
											sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
										/>
									) : (
										<div className="w-full h-full bg-slate-700" aria-hidden />
									)}
									{service.flexipay === 't' && service.flexipay_discount !== '0' && (
										<div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-lg">
											{service.flexipay_discount}% {t('common.off')}
										</div>
									)}
								</div>
								<div className="p-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-sm mb-0.5 truncate">{service.service_name}</h3>
											<p className="text-[10px] text-gray-400 truncate">{service.class}</p>
										</div>
										<div className="shrink-0">
											{service.image_url ? (
												<Image
													src={service.image_url}
													alt={`${service.service_name} logo`}
													width={36}
													height={36}
													className="rounded-md object-cover"
												/>
											) : (
												<div className="w-9 h-9 rounded-md bg-slate-700" aria-hidden />
											)}
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default RentalBrandsPage;
