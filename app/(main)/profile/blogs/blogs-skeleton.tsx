import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface BlogsSkeletonProps {
	count?: number;
	showFilters?: boolean;
}

const BlogsSkeleton: React.FC<BlogsSkeletonProps> = ({ count = 6, showFilters = true }) => {
	return (
		<div>
			{/* Search and Filters */}
			{showFilters && (
				<div className="space-y-4">
					{/* Search Bar */}
					<div className="relative">
						<Skeleton height={48} className="rounded-full" />
					</div>

					{/* Category Filters */}
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 pt-2">
							<Skeleton circle width={20} height={20} />
						</div>
						<div className="flex-1 min-w-0">
							<div className="overflow-x-auto overflow-y-hidden pb-3 hide-scrollbar">
								<div className="flex items-center space-x-3 w-max px-1">
									{Array.from({ length: 5 }).map((_, index) => (
										<Skeleton
											key={index}
											height={32}
											width={index === 0 ? 60 : 80 + Math.random() * 40}
											className="rounded-full"
										/>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Blogs Grid */}
			<div className="h-[490px] overflow-y-auto hide-scrollbar">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
					{Array.from({ length: count }).map((_, index) => (
						<div
							key={index}
							className="bg-dark-400 rounded-xl overflow-hidden border border-gray-700/50"
						>
							{/* Blog Image */}
							<div className="relative h-48 overflow-hidden">
								<Skeleton width="100%" height={192} />

								{/* Category Badge */}
								<div className="absolute top-2 left-2">
									<Skeleton width={80} height={24} className="rounded-full" />
								</div>

								{/* External Link Icon */}
								<div className="absolute top-3 right-3">
									<Skeleton circle width={32} height={32} />
								</div>
							</div>

							{/* Blog Content */}
							<div className="px-2 py-4">
								<div className="mb-3">
									<Skeleton width="90%" height={20} />
								</div>

								<div className="flex items-center gap-2">
									<Skeleton circle width={16} height={16} />
									<Skeleton width={100} height={14} />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Results Count */}
			<div className="text-center">
				<Skeleton width={200} height={14} />
			</div>
		</div>
	);
};

export default BlogsSkeleton;