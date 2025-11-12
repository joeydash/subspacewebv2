import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface OrderHistorySkeletonProps {
	count?: number;
}

const OrderHistorySkeleton: React.FC<OrderHistorySkeletonProps> = ({ count = 5 }) => {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="bg-dark-400 rounded-xl overflow-hidden"
				>
					<div className="p-6">
						{/* Order Header */}
						<div className="flex items-start justify-between mb-4">
							<div className="flex-1">
								<div className="mb-2">
									<Skeleton width={180} height={20} />
								</div>
								<div>
									<Skeleton width={120} height={16} />
								</div>
							</div>
							<div className="text-right">
								<Skeleton width={80} height={24} />
							</div>
						</div>

						{/* Purchase and Expiry Info */}
						<div className="space-y-2 mb-4">
							<div className="flex items-center gap-2">
								<Skeleton circle width={16} height={16} />
								<Skeleton width={160} height={14} />
							</div>
							<div className="flex items-center gap-2">
								<Skeleton circle width={16} height={16} />
								<Skeleton width={140} height={14} />
							</div>
						</div>

						{/* Dotted Separator */}
						<div className="border-t border-dashed border-gray-600 my-4"></div>

						{/* Voucher Code Section */}
						<div className="flex items-center gap-3">
							<div className="flex-1">
								<Skeleton height={48} className="rounded-lg" />
							</div>
							<div className="flex gap-2">
								<Skeleton circle width={48} height={48} />
								<Skeleton circle width={48} height={48} />
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default OrderHistorySkeleton;