import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface GroupCardSkeletonProps {
	count?: number;
}

export const GroupCardSkeleton: React.FC<GroupCardSkeletonProps> = ({ count = 12 }) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50"
				>
					{/* Header with Group Owner */}
					<div className="relative p-4 md:p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/80">
						<div className="flex items-center gap-3">
							<div className="relative flex-shrink-0">
								{/* Owner avatar */}
								<div className="h-14 w-14 md:h-16 md:w-16 rounded-lg overflow-hidden">
									<Skeleton width={64} height={64} className="rounded-lg" />
								</div>
								{/* Premium badge */}
								<div className="absolute -top-1 -right-1">
									<Skeleton circle width={24} height={24} />
								</div>
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex justify-between items-start gap-2 mb-1">
									{/* Owner name */}
									<div className="flex-1">
										<Skeleton width={120} height={20} />
									</div>
									{/* Rating */}
									<div className="flex items-center gap-1 flex-shrink-0">
										<Skeleton circle width={14} height={14} />
										<Skeleton width={30} height={16} />
									</div>
								</div>
								{/* Last active */}
								<div className="flex items-center gap-1.5">
									<Skeleton circle width={16} height={16} />
									<Skeleton width={100} height={14} />
								</div>
							</div>
						</div>
					</div>

					{/* Group Details */}
					<div className="p-4 md:p-5 space-y-3">
						<div className="flex justify-between items-start gap-2">
							<div className="min-w-0 flex-1">
								<div className="flex items-baseline gap-1.5 mb-1">
									{/* Price per user */}
									<Skeleton width={60} height={28} />
									<Skeleton width={80} height={16} />
								</div>
								<div className="flex items-center gap-2">
									{/* Total and split info */}
									<Skeleton width={70} height={14} />
									<Skeleton width={80} height={14} />
								</div>
							</div>
							<div className="text-right flex-shrink-0">
								{/* Slots */}
								<Skeleton width={40} height={14} className="mb-1" />
								<Skeleton width={30} height={24} />
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-2">
							<div className="flex-1">
								<Skeleton height={44} className="rounded-lg" />
							</div>
							<div className="w-12">
								<Skeleton height={44} className="rounded-lg" />
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

interface GroupFiltersSkeletonProps {
	showPlanHeader?: boolean;
	showSearchAndSort?: boolean;
}

export const GroupFiltersSkeleton: React.FC<GroupFiltersSkeletonProps> = ({
	showPlanHeader = true,
	showSearchAndSort = true
}) => {
	return (
		<>
			<div className="space-y-4">
				{/* Plan Header */}
				{showPlanHeader && (
					<div className="flex items-center gap-3">
						<Skeleton circle width={24} height={24} />
						<div className="flex items-center gap-3 flex-1 min-w-0">
							{/* Service logo */}
							<div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0">
								<Skeleton width={56} height={56} className="rounded-lg" />
							</div>
							<div className="flex-1 min-w-0">
								{/* Service and plan name */}
								<Skeleton width={250} height={32} />
							</div>
						</div>
						<Skeleton circle width={20} height={20} />
					</div>
				)}

				{/* Search Bar */}
				{showSearchAndSort && (
					<div className="relative w-full">
						<Skeleton height={48} className="rounded-2xl" />
					</div>
				)}
			</div>

			{/* Filters */}
			{showSearchAndSort && (
				<div className="mt-6">
					<div className="flex space-x-2">
						<Skeleton width={80} height={36} className="rounded-full" />
						<Skeleton width={70} height={36} className="rounded-full" />
						<Skeleton width={75} height={36} className="rounded-full" />
						<Skeleton width={70} height={36} className="rounded-full" />
					</div>
				</div>
			)}
		</>
	);
};

interface GroupsPageSkeletonProps {
	showPlanHeader?: boolean;
	showSearchAndSort?: boolean;
	groupsCount?: number;
}

export const GroupsPageSkeleton: React.FC<GroupsPageSkeletonProps> = ({
	showPlanHeader = true,
	showSearchAndSort = true,
	groupsCount = 12
}) => {
	return (
		<div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="mb-6">
					{/* Filters Skeleton */}
					<GroupFiltersSkeleton
						showPlanHeader={showPlanHeader}
						showSearchAndSort={showSearchAndSort}
					/>
				</div>

				{/* Group Cards Skeleton */}
				<GroupCardSkeleton count={groupsCount} />
			</div>
		</div>
	);
};

export default GroupsPageSkeleton;