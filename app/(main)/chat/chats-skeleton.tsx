import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface ChatsSkeletonProps {
  count?: number;
  showHeader?: boolean;
}

const ChatsSkeleton: React.FC<ChatsSkeletonProps> = ({ count = 8, showHeader = false}) => {
	return (
		<>
		{showHeader && (
			<div className="px-2 py-4">
			{/* Header with search and plus button */}
			<div className="flex items-center gap-2 mb-4">
				<div className="flex-1">
				<Skeleton height={40} className="rounded-2xl" />
				</div>
				<Skeleton width={40} height={40} circle />
			</div>

			{/* Tabs skeleton */}
			<div className="flex gap-2 overflow-x-auto hide-scrollbar">
				<Skeleton width={60} height={36} className="rounded-full" />
				<Skeleton width={80} height={36} className="rounded-full" />
				<Skeleton width={70} height={36} className="rounded-full" />
				<Skeleton width={100} height={36} className="rounded-full" />
			</div>
			</div>
		)}

		<div className="space-y-1 px-2">
			{Array.from({ length: count }).map((_, index) => (
			<div
				key={index}
				className="px-2 py-4 rounded-xl"
			>
				<div className="flex items-start gap-3">
				<div className="relative shrink-0">
					<Skeleton circle width={48} height={48} />
				</div>
				<div className="flex-1 min-w-0 space-y-2">
					<div className="flex justify-between items-start gap-2">
					<Skeleton width="60%" height={16} />
					<Skeleton width={40} height={12} />
					</div>
					<Skeleton width="80%" height={14} />
				</div>
				</div>
			</div>
			))}
		</div>
		</>
  );
};

export default ChatsSkeleton;