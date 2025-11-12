'use client';

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { ArrowLeft, Search, ArrowUpDown } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/language-store';
import { BrandsPageSkeleton } from '@/skeletons/brands-skeleton';
import { useBrands } from '@/lib/hooks/brands/use-brands';
import type { Brand } from '@/lib/api/brands';

const SORT_STORAGE_KEY = 'brands_sort_preference';

const BrandsPageContent = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [searchQuery, setSearchQuery] = useState('');
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const selectedCategory = searchParams.get('category') || 'All';

	const storedSort = typeof window !== 'undefined'
		? (localStorage.getItem(SORT_STORAGE_KEY) as 'default' | 'discount' | null)
		: null;

	const [sortBy, setSortBy] = useState<'default' | 'discount'>(storedSort || 'default');
	const [showSortDropdown, setShowSortDropdown] = useState(false);
	const sortDropdownRef = useRef<HTMLDivElement>(null);

	const { data, isLoading } = useBrands({ userId: user?.id ?? '', authToken: user?.auth_token ?? '' });

	const brands = data?.brands || [];
	const categories = data?.categories || ['All'];


	const handleSortChange = (value: 'default' | 'discount') => {
		setSortBy(value);
		if (typeof window !== 'undefined') {
			localStorage.setItem(SORT_STORAGE_KEY, value);
		}
		setShowSortDropdown(false);
	};

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

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
				setShowSortDropdown(false);
			}
		};

		if (showSortDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showSortDropdown]);

	const calculateDiscount = useCallback((price?: number, discountedPrice?: number) => {
		if (!price || price === 0 || discountedPrice == null) return 0;
		return ((price - discountedPrice) / price) * 100;
	}, []);

	const getBrandDiscount = useCallback(
		(brand: Brand) => {
			if (brand.whatsub_plans?.[0]) {
				return calculateDiscount(
					brand.whatsub_plans[0].price,
					brand.whatsub_plans[0].discounted_price
				);
			}
			return brand.flexipay_discount || 0;
		},
		[calculateDiscount]
	);

	const filteredBrands = useMemo(
		() =>
			brands
				.filter(brand => {
					const matchesSearch = brand.service_name.toLowerCase().includes(searchQuery.toLowerCase());
					const matchesCategory = selectedCategory === 'All' || brand.whatsub_class?.name === selectedCategory;
					return matchesSearch && matchesCategory;
				})
				.sort((a, b) => {
					if (sortBy === 'discount') {
						const aDiscount = getBrandDiscount(a);
						const bDiscount = getBrandDiscount(b);
						return bDiscount - aDiscount;
					}
					return 0;
				}),
		[brands, getBrandDiscount, searchQuery, selectedCategory, sortBy]
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

					{/* Search Bar with Sort */}
					<div className="relative w-full flex gap-2">
						<div className="relative flex-1">
							<input
								type="text"
								placeholder={t('brands.searchPlaceHolder')}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="input pl-12 py-3 w-full rounded-2xl"
							/>
							<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
						</div>

						{/* Sort Dropdown */}
						<div className="relative" ref={sortDropdownRef}>
							<button
								onClick={() => setShowSortDropdown(!showSortDropdown)}
								className="flex items-center justify-center gap-2 px-4 h-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-2xl transition-colors"
							>
								<ArrowUpDown className="h-5 w-5 text-gray-400" />
							</button>

							{showSortDropdown && (
								<div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
									<button
										onClick={() => handleSortChange('default')}
										className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${sortBy === 'default' ? 'bg-slate-700 text-white' : 'text-gray-300'
											}`}
									>
										Default
									</button>
									<button
										onClick={() => handleSortChange('discount')}
										className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${sortBy === 'discount' ? 'bg-slate-700 text-white' : 'text-gray-300'
											}`}
									>
										Discount
									</button>
								</div>
							)}
						</div>
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
						{filteredBrands.map((brand) => (
							<Link
								href={`/products/${brand.id}`}
								key={brand.id}
								className="bg-slate-800/30 rounded-lg overflow-hidden group hover:ring-2 hover:ring-slate-500 transition-all cursor-pointer"
							>
								<div className="relative aspect-square overflow-hidden">
									{(brand.backdrop_url || brand.image_url) ? (
										<Image
											src={brand.backdrop_url || brand.image_url || ''}
											alt={brand.service_name}
											fill
											className="object-cover transition-transform duration-300 group-hover:scale-110"
											sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
										/>
									) : (
										<div className="w-full h-full bg-slate-700" aria-hidden />
									)}
									{brand.flexipay && (
										<div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-lg">
											{brand.flexipay_discount}% {t('common.off')}
										</div>
									)}
								</div>
								<div className="p-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-sm mb-0.5 truncate">{brand.service_name}</h3>
											<p className="text-[10px] text-gray-400 truncate">{brand.whatsub_class?.name}</p>
										</div>
										<div className="shrink-0">
											{brand.image_url ? (
												<Image
													src={brand.image_url}
													alt={`${brand.service_name} logo`}
													width={36}
													height={36}
													className="rounded-md object-cover"
												/>
											) : (
												<div className="w-9 h-9 rounded-md bg-slate-700" aria-hidden />
											)}
										</div>
									</div>
									{brand.whatsub_plans?.[0] && (
										<div className="mt-2 flex items-baseline gap-1.5">
											<span className="text-[#2CFF05] font-semibold text-sm">
												₹{brand.whatsub_plans[0].discounted_price}
											</span>
											{brand.whatsub_plans[0].price > brand.whatsub_plans[0].discounted_price && (
												<span className="text-[11px] text-gray-500 line-through">
													₹{brand.whatsub_plans[0].price}
												</span>
											)}
										</div>
									)}
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

const BrandsPage = () => {
	return (
		<Suspense fallback={<BrandsPageSkeleton showCategories={true} categoriesCount={8} brandsCount={12} />}>
			<BrandsPageContent />
		</Suspense>
	);
};

export default BrandsPage;