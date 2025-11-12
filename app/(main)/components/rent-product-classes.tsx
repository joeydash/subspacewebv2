import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import CategoriesSkeleton from './skeletons/categories-skeleton';

import { useRentProductClasses } from '@/lib/hooks/rent/use-rent-product-classes';

import { useCurrentLocation } from '@/lib/context/location-context';

interface ServicePreview {
	id: string;
	image: string;
}

interface RentProductClass {
	class_id: string;
	poster: string;
	total_services_count: number;
	services_preview: ServicePreview[];
	class_name: string;
}


const RentProductClasses: React.FC = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const router = useRouter();

	const { location: globalLocation } = useCurrentLocation();

	const { data: productClasses, isLoading } = useRentProductClasses({ userId: user?.id || '', authToken: user?.auth_token || '', address: (globalLocation ?? {}) as Record<string, unknown> });


	if (isLoading) {
		return (
			<section className="mb-12">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">Products</h2>
				</div>
				<CategoriesSkeleton count={8} />
			</section>
		);
	}

	if (!productClasses || productClasses?.length === 0) {
		return null;
	}

	// Split into rows of up to 5 items. First row will have at least 5 when possible.
	const perRow = 5;
	const rows: RentProductClass[][] = [];
	for (let i = 0; i < productClasses.length; i += perRow) {
		rows.push(productClasses.slice(i, i + perRow));
	}

	const maxRowLength = Math.max(...rows.map(r => r.length));
	const containerWidth = maxRowLength * (256 + 24); // item width + gap

	return (
		<section className="mb-12">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold">Subspace Minutes</h2>
				<Link href="/rental-brands" className="text-indigo-400 hover:text-indigo-300 transition-colors">
					{t('common.viewAll')}
				</Link>
			</div>
			<div className="relative">
				<div className="overflow-x-auto pb-4 hide-scrollbar">
					<div className="flex flex-col space-y-6 px-1" style={{ width: `${containerWidth}px` }}>
						{rows.map((row, rowIndex) => (
									<div key={rowIndex} className="flex space-x-6">
										{row.map((productClass) => (
											<div
												key={productClass.class_id}
												onClick={() => router.push(`/rental-brands?class=${productClass.class_name}`)}
												className="w-64 h-40 rounded-xl overflow-hidden group cursor-pointer relative transition-all duration-300 transform hover:scale-105"
												style={{
													backgroundImage: `url(${productClass.poster})`,
													backgroundSize: 'cover',
													backgroundPosition: 'center'
												}}
											>
												<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
												<div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />
												<div className="absolute inset-0 p-6 pt-4 flex flex-col justify-between">
													<div className="flex justify-end">
														<div className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium">
															{productClass.total_services_count}+ {t('explore.brands')}
														</div>
													</div>
													<div className="flex flex-col items-end">
														<h3 className="text-white font-bold text-lg mb-3">{productClass.class_name}</h3>
														<div className="flex -space-x-2">
															{productClass.services_preview.slice(0, 4).map((service) => (
																<div
																	key={service.id}
																	className="w-12 h-12 rounded-full border-2 border-dark-500 overflow-hidden bg-white shadow-lg transition-transform duration-200 hover:scale-110"
																>
																	<img
																		src={service.image}
																		alt=""
																		className="w-full h-full object-cover"
																	/>
																</div>
															))}
															{productClass.total_services_count > 4 && (
																<div className="w-12 h-12 rounded-full border-2 border-dark-500 bg-white/90 backdrop-blur-sm flex items-center justify-center text-sm text-dark-900 font-bold shadow-lg">
																	+{productClass.total_services_count - 4}
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								))}
							</div>
				</div>
			</div>
		</section>
	);
};

export default RentProductClasses;
