import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface TrendingServiceCardSkeletonProps {
	count?: number;
}

export const TrendingServiceCardSkeleton: React.FC<TrendingServiceCardSkeletonProps> = ({ count = 10 }) => {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="bg-dark-500 rounded-xl p-6 border border-gray-700/50"
				>
					<div className="flex items-center gap-6">
						{/* Service Logo */}
						<div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
							<Skeleton width={64} height={64} className="rounded-xl" />
						</div>

						{/* Service Info */}
						<div className="flex-1">
							<div className="flex items-start justify-between">
								<div>
									{/* Service name */}
									<div className="mb-1">
										<Skeleton width={180} height={24} />
									</div>

									{/* Rating and other info */}
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-1">
											<Skeleton circle width={16} height={16} />
											<Skeleton width={40} height={16} />
										</div>
									</div>
								</div>

								{/* Arrow icon */}
								<div className="flex-shrink-0">
									<Skeleton circle width={20} height={20} />
								</div>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

interface SearchSectionSkeletonProps {
	showSuggestions?: boolean;
}

export const SearchSectionSkeleton: React.FC<SearchSectionSkeletonProps> = ({ showSuggestions = false }) => {
	return (
		<div className="mb-8 relative">
			{/* Search Bar */}
			<div className="relative max-w-2xl mx-auto mb-6">
				<Skeleton height={56} className="rounded-xl" />
			</div>

			{/* Search Suggestions Dropdown */}
			{showSuggestions && (
				<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-dark-500 border border-gray-700 rounded-lg shadow-lg z-50 mt-2">
					<div className="p-2 max-h-80 overflow-y-auto">
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								key={index}
								className="flex items-center gap-4 px-4 py-3 rounded-lg"
							>
								<div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
									<Skeleton width={40} height={40} className="rounded-lg" />
								</div>
								<div className="flex-1">
									<div className="mb-1">
										<Skeleton width={140} height={16} />
									</div>
									<div className="flex items-center gap-2">
										<Skeleton width={80} height={14} />
										<span className="text-gray-600">•</span>
										<div className="flex items-center gap-1">
											<Skeleton circle width={12} height={12} />
											<Skeleton width={30} height={12} />
										</div>
									</div>
								</div>
								<div className="flex-shrink-0">
									<Skeleton width={60} height={20} className="rounded-full" />
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

interface TrendingSubscriptionsSkeletonProps {
	showSearch?: boolean;
	showSuggestions?: boolean;
	servicesCount?: number;
}

const TrendingSubscriptionsSkeleton: React.FC<TrendingSubscriptionsSkeletonProps> = ({
	showSearch = true,
	showSuggestions = false,
	servicesCount = 10
}) => {
	return (
		<div className="space-y-8">
			{/* Search Section */}
			{showSearch && (
				<SearchSectionSkeleton showSuggestions={showSuggestions} />
			)}

			{/* Services List */}
			<div>

				{/* Service Cards */}
				<TrendingServiceCardSkeleton count={servicesCount} />
			</div>
		</div>
	);
};

export default TrendingSubscriptionsSkeleton;