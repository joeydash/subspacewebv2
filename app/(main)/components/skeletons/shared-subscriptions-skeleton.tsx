import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface SharedSubscriptionsSkeletonProps {
	count?: number;
}

const SharedSubscriptionsSkeleton: React.FC<SharedSubscriptionsSkeletonProps> = ({ count = 8 }) => {
	return (
		<div className="relative">
			<div className="overflow-x-auto pb-4 hide-scrollbar">
				<div className="flex flex-col space-y-6 px-1" style={{ width: `${Math.ceil(count / 2) * (320 + 24)}px` }}>
					{/* First Row */}
					<div className="flex space-x-6">
						{Array.from({ length: Math.ceil(count / 2) }).map((_, index) => (
							<div
								key={`row1-${index}`}
								className="w-80 bg-[#2A2D3A] rounded-xl p-6 border border-gray-700/30"
							>
								{/* Header section with logo and title */}
								<div className="flex items-start gap-4 mb-4">
									<div className="w-16 h-16 rounded-xl overflow-hidden">
										<Skeleton width={64} height={64} className="rounded-xl" />
									</div>
									<div className="flex-1">
										<div className="mb-2">
											<Skeleton width={140} height={20} />
										</div>
										<div>
											<Skeleton width={100} height={14} />
										</div>
									</div>
								</div>

								{/* Price section */}
								<div className="space-y-3">
									<div className="flex items-baseline gap-2">
										<Skeleton width={60} height={28} />
										<Skeleton width={60} height={16} />
									</div>

									{/* Duration and groups info */}
									<div className="flex items-center justify-between">
										<Skeleton width={120} height={14} />
										<Skeleton width={80} height={24} className="rounded-full" />
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Second Row */}
					<div className="flex space-x-6">
						{Array.from({ length: Math.floor(count / 2) }).map((_, index) => (
							<div
								key={`row2-${index}`}
								className="w-80 bg-[#2A2D3A] rounded-xl p-6 border border-gray-700/30"
							>
								{/* Header section with logo and title */}
								<div className="flex items-start gap-4 mb-4">
									<div className="w-16 h-16 rounded-xl overflow-hidden">
										<Skeleton width={64} height={64} className="rounded-xl" />
									</div>
									<div className="flex-1">
										<div className="mb-2">
											<Skeleton width={140} height={20} />
										</div>
										<div>
											<Skeleton width={100} height={14} />
										</div>
									</div>
								</div>

								{/* Price section */}
								<div className="space-y-3">
									<div className="flex items-baseline gap-2">
										<Skeleton width={60} height={28} />
										<Skeleton width={60} height={16} />
									</div>

									{/* Duration and groups info */}
									<div className="flex items-center justify-between">
										<Skeleton width={120} height={14} />
										<Skeleton width={80} height={24} className="rounded-full" />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SharedSubscriptionsSkeleton;