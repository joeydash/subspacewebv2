import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface SharedSubscriptionsSkeletonProps {
	count?: number;
}

const SharedSubscriptionsSkeleton: React.FC<SharedSubscriptionsSkeletonProps> = ({ count = 3 }) => {
	return (
		<div className="space-y-3 sm:space-y-4 px-2 sm:px-3 mt-3 sm:mt-4">
			<p className="text-xs sm:text-sm text-gray-400">
				Subscriptions with toggle 'ON' are public and will be shown in the marketplace. Private subscriptions are only visible to you.
			</p>
			<div className="space-y-3 sm:space-y-4">
				{Array.from({ length: count }).map((_, index) => (
					<div key={index} className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3 flex-1 min-w-0">
							<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hiddenp-1 shrink-0">
								<Skeleton height="100%" className="rounded" />
							</div>
							<div className="flex-1 min-w-0 space-y-1">
								<Skeleton width="70%" height={16} className="rounded" />
								<Skeleton width="50%" height={14} className="rounded" />
							</div>
						</div>
						<div className="shrink-0">
							<Skeleton width={44} height={24} borderRadius={12} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default SharedSubscriptionsSkeleton;