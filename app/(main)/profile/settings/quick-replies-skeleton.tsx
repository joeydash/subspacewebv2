import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface QuickRepliesSkeletonProps {
	count?: number;
}

const QuickRepliesSkeleton: React.FC<QuickRepliesSkeletonProps> = ({ count = 3 }) => {
	return (
		<div className="space-y-0">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="flex items-start justify-between py-3 sm:py-4 px-2 sm:px-3 border-b border-dark-300 last:border-b-0"
				>
					<div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
						<div>
							<Skeleton width={40} height={20} className="rounded" />
						</div>
						<div className="space-y-1">
							<Skeleton width={`90%`} height={14} />
							<Skeleton width={`70%`} height={14} />
						</div>
					</div>
					<div className="ml-2 sm:ml-3 p-1.5 sm:p-2">
						<Skeleton width={16} height={16} className="rounded" />
					</div>
				</div>
			))}
		</div>
	);
};

export default QuickRepliesSkeleton;
