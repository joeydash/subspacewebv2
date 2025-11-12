import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface CartSkeletonProps {
	count?: number;
	showOrderSummary?: boolean;
}

const CartSkeleton: React.FC<CartSkeletonProps> = ({ count = 3, showOrderSummary = false }) => {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
			{/* Cart Items Skeleton */}
			<div className="lg:col-span-2">
				<div className="bg-dark-500 rounded-lg overflow-hidden max-h-[600px] flex flex-col">
					{/* Header */}
					<div className="hidden sm:grid grid-cols-12 bg-dark-400 p-4">
						<div className="col-span-6">
							<Skeleton width={80} height={16} />
						</div>
						<div className="col-span-2 text-center">
							<Skeleton width={60} height={16} />
						</div>
						<div className="col-span-2 text-center">
							<Skeleton width={70} height={16} />
						</div>
						<div className="col-span-2 text-right">
							<Skeleton width={50} height={16} />
						</div>
					</div>

					{/* Cart Items */}
					<div className="divide-y divide-gray-800 overflow-y-auto flex-1 hide-scrollbar">
						{Array.from({ length: count }).map((_, index) => (
							<div key={index}>
								{/* Mobile Layout */}
								<div className="sm:hidden p-4">
									{/* Top section: Image, Name, Price */}
									<div className="flex items-start gap-3 mb-3">
										<div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
											<Skeleton width={64} height={64} />
										</div>
										<div className="flex-1">
											<div className="mb-1">
												<Skeleton width={120} height={14} />
											</div>
											<div className="mb-2">
												<Skeleton width={80} height={12} />
											</div>
											<div className="flex items-baseline gap-2">
												<Skeleton width={50} height={16} />
												<Skeleton width={40} height={12} />
											</div>
										</div>
									</div>

									{/* Bottom section: Quantity and Total */}
									<div className="bg-dark-400/30 rounded-lg p-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<Skeleton width={30} height={12} />
												<div className="flex items-center gap-2">
													<Skeleton circle width={28} height={28} />
													<Skeleton width={20} height={14} />
													<Skeleton circle width={28} height={28} />
												</div>
											</div>
											<div className="flex flex-col items-end">
												<Skeleton width={35} height={12} />
												<Skeleton width={60} height={16} />
											</div>
										</div>
									</div>

									{/* Remove button */}
									<div className="mt-2">
										<Skeleton width={70} height={12} />
									</div>
								</div>

								{/* Desktop Layout */}
								<div className="hidden sm:grid sm:grid-cols-12 sm:gap-6 sm:items-center p-4">
									{/* Product */}
									<div className="col-span-6 flex items-center">
										<div className="w-20 h-20 flex-shrink-0 rounded-full overflow-hidden">
											<Skeleton circle width={80} height={80} />
										</div>
										<div className="ml-4 flex-1">
											<div className="mb-2">
												<Skeleton width={140} height={16} />
											</div>
											<div className="mb-2">
												<Skeleton width={100} height={14} />
											</div>
											<div className="flex items-center">
												<Skeleton width={60} height={12} />
											</div>
										</div>
									</div>

									{/* Price */}
									<div className="col-span-2 text-center">
										<div className="flex flex-col items-center">
											<Skeleton width={60} height={16} />
											<div className="mt-1">
												<Skeleton width={50} height={12} />
											</div>
										</div>
									</div>

									{/* Quantity Controls */}
									<div className="col-span-2 text-center">
										<div className="flex items-center justify-center gap-2">
											<Skeleton circle width={32} height={32} />
											<Skeleton width={20} height={16} />
											<Skeleton circle width={32} height={32} />
										</div>
									</div>

									{/* Total */}
									<div className="col-span-2 text-right">
										<Skeleton width={70} height={16} />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Order Summary Skeleton */}
			{showOrderSummary && (
				<div className="lg:col-span-1">
					<div className="bg-dark-500 rounded-lg p-6">
						{/* Title */}
						<div className="mb-6">
							<Skeleton width={120} height={24} />
						</div>

						{/* Summary Items */}
						<div className="space-y-4 mb-6">
							<div className="flex justify-between">
								<Skeleton width={80} height={16} />
								<Skeleton width={60} height={16} />
							</div>
							<div className="flex justify-between">
								<Skeleton width={140} height={16} />
								<Skeleton width={70} height={16} />
							</div>
							<div className="pt-4 border-t border-gray-800 flex justify-between">
								<Skeleton width={50} height={18} />
								<Skeleton width={80} height={18} />
							</div>
						</div>

						{/* Coupon Section */}
						<div className="mb-6">
							<div className="mb-2">
								<Skeleton width={100} height={16} />
							</div>
							<div className="flex gap-0.25">
								<Skeleton height={40} className="flex-1 rounded-r-none" />
								<Skeleton width={60} height={40} className="rounded-l-none" />
							</div>
						</div>

						{/* Checkout Button */}
						<Skeleton height={48} className="rounded-lg" />
					</div>
				</div>
			)}
		</div>
	);
};

export default CartSkeleton;
