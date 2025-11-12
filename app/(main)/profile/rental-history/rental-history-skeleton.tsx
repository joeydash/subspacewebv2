import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface RentalHistorySkeletonProps {
	count?: number;
}

const RentalHistorySkeleton: React.FC<RentalHistorySkeletonProps> = ({ count = 3 }) => {
	return (
		<div>
			{/* Header */}
			<div className="mb-6">
				<Skeleton width={180} height={28} />
			</div>

			{/* Rental Cards */}
			<div className="space-y-2 md:space-y-4">
				{Array.from({ length: count }).map((_, index) => (
					<div
						key={index}
						className="bg-dark-400 rounded-lg p-3 md:p-4"
					>
						<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
							{/* Product Image Skeleton */}
							<div className="flex-shrink-0 w-full sm:w-20 md:w-24 h-32 sm:h-20 md:h-24 bg-dark-500 rounded-lg overflow-hidden">
								<Skeleton height="100%" />
							</div>

							{/* Content Skeleton */}
							<div className="flex-1 min-w-0 flex flex-col justify-between">
								<div>
									{/* Product Name */}
									<div className="mb-1">
										<Skeleton width="60%" height={20} />
									</div>

									{/* Product Description */}
									<div className="mb-2">
										<Skeleton width="80%" height={16} />
									</div>

									{/* Date and Address Info */}
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<Skeleton circle width={16} height={16} />
											<Skeleton width={200} height={14} />
										</div>
										<div className="flex items-center gap-2">
											<Skeleton circle width={16} height={16} />
											<Skeleton width={180} height={14} />
										</div>
									</div>
								</div>

								{/* Price Section */}
								<div className="mt-2 pt-2 border-t border-dark-500">
									<Skeleton width={80} height={20} />
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default RentalHistorySkeleton;
