import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface QuickRepliesSkeletonProps {
	count?: number;
}

const QuickRepliesSkeleton: React.FC<QuickRepliesSkeletonProps> = ({ count = 3 }) => {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="bg-dark-500 rounded-lg p-4 border border-gray-600"
				>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							{/* Shortcut Badge */}
							<div className="flex items-center gap-2 mb-2">
								<Skeleton width={60} height={20} className="rounded" />
							</div>

							{/* Message */}
							<div className="space-y-2">
								<Skeleton width={`80%`} height={14} />
								<Skeleton width={`60%`} height={14} />
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default QuickRepliesSkeleton;
