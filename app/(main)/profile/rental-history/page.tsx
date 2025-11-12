'use client';

import { Package, Calendar, MapPin } from 'lucide-react';
import { useRentalHistory } from '@/lib/hooks/rent/use-rental-history';
import { format } from 'date-fns';
import { useAuthStore } from '@/lib/store/auth-store';
import RentalHistorySkeleton from './rental-history-skeleton';

const RentalHistoryComponent = () => {
	const { user } = useAuthStore();
	const {
		data: rentalHistory,
		isLoading,
		error
	} = useRentalHistory({ userId: user?.id, authToken: user?.auth_token });


	if (isLoading) {
		return <RentalHistorySkeleton count={3} />;
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4">
					<p className="text-red-400">Failed to load rental history. Please try again later.</p>
				</div>
			</div>
		);
	}

	if (!rentalHistory || rentalHistory.length === 0) {
		return (
			<div className="text-center py-8">
				<Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
				<p className="text-gray-400">No rental history found</p>
			</div>
		);
	}

	rentalHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

	return (
		<div>
			<h2 className="text-xl md:text-2xl font-bold mb-6">Rental History</h2>
			<div className="space-y-2 md:space-y-4">
				{rentalHistory.map((rental) => {
					const product = rental.whatsub_subscription_product_location?.whatsub_subscription_product;
					const address = rental.whatsub_addresses;
					const productPhoto = product?.product_photos?.[0] || '';

					return (
						<div
							key={rental.id}
							className="bg-dark-400 rounded-lg p-3 md:p-4 hover:bg-dark-300 transition-colors"
						>
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								{productPhoto && (
									<div className="flex-shrink-0 w-full sm:w-20 md:w-24 h-32 sm:h-auto bg-dark-500 rounded-lg overflow-hidden">
										<img
											src={productPhoto}
											alt={product?.product_name}
											className="w-full h-full object-cover"
										/>
									</div>
								)}

								<div className="flex-1 min-w-0 flex flex-col justify-between">
									<div>
										<h3 className="text-base md:text-lg font-semibold text-white mb-1 truncate">
											{product?.product_name || 'Unknown Product'}
										</h3>

										{product?.product_description && (
											<p className="text-xs md:text-sm text-gray-400 mb-2 truncate">
												{product.product_description}
											</p>
										)}

										<div className="space-y-1 text-xs md:text-sm">
											<div className="flex items-center gap-2 text-gray-300">
												<Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-400 flex-shrink-0" />
												<span className="truncate">
													{format(new Date(rental.start_time), 'MMM dd, yyyy')} - {format(new Date(rental.end_time), 'MMM dd, yyyy')}
												</span>
											</div>

											{address && (
												<div className="flex items-center gap-2 text-gray-300">
													<MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-400 flex-shrink-0" />
													<span className="truncate">
														{address.full_address}
														{address.nearby_landmark && `, ${address.nearby_landmark}`}
													</span>
												</div>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2 text-sm md:text-base mt-2 pt-2 border-t border-dark-500">
										<span className="font-semibold text-indigo-400">₹{rental.total_price / 100}</span>
										{rental.quantity > 1 && (
											<span className="text-gray-400">× {rental.quantity}</span>
										)}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default RentalHistoryComponent;
