import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface SubscriptionsSkeletonProps {
	count?: number;
}

const SubscriptionsSkeleton: React.FC<SubscriptionsSkeletonProps> = ({ count = 6 }) => {
	return (
		<div className="relative">
			<div className="overflow-x-auto pb-4 hide-scrollbar">
				<div className="flex space-x-4 px-1">
					{Array.from({ length: count }).map((_, index) => (
						<div
							key={index}
							className="flex-none w-80 bg-dark-500 rounded-xl p-6 border border-gray-700/50"
						>
							{/* Header with logo and service info */}
							<div className="flex items-center gap-4 mb-4">
								<div className="w-16 h-16 rounded-lg overflow-hidden">
									<Skeleton width={64} height={64} className="rounded-lg" />
								</div>
								<div className="flex-1">
									<div className="mb-2">
										<Skeleton width={140} height={20} />
									</div>
									<div>
										<Skeleton width={100} height={16} />
									</div>
								</div>
								{/* Share button skeleton */}
								<div className="w-8 h-8">
									<Skeleton circle width={32} height={32} />
								</div>
							</div>

							{/* Subscription details */}
							<div className="space-y-3">
								{/* Your share price */}
								<div className="flex items-center justify-between">
									<Skeleton width={80} height={16} />
									<Skeleton width={90} height={20} />
								</div>

								{/* Status badge */}
								<div className="flex items-center gap-2">
									<Skeleton circle width={16} height={16} />
									<Skeleton width={120} height={16} />
								</div>

								{/* Footer with status and manage button */}
								<div className="flex items-center justify-between pt-2 border-t border-gray-700">
									<Skeleton width={100} height={14} />
									<Skeleton width={60} height={16} />
								</div>

								{/* Share earnings text */}
								<div className="mt-2">
									<Skeleton width={200} height={12} />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default SubscriptionsSkeleton;