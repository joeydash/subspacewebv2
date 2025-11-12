import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface BrandCardSkeletonProps {
	count?: number;
}

export const BrandCardSkeleton: React.FC<BrandCardSkeletonProps> = ({ count = 12 }) => {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="bg-slate-800/30 rounded-lg overflow-hidden"
				>
					{/* Brand Image */}
					<div className="relative aspect-square overflow-hidden">
						<Skeleton width="100%" height="100%" />

						{/* Discount Badge */}
						<div className="absolute top-2 right-2">
							<Skeleton width={50} height={20} className="rounded-full" />
						</div>
					</div>

					{/* Brand Info */}
					<div className="p-3">
						<div className="flex items-start justify-between gap-2">
							<div className="flex-1 min-w-0">
								{/* Brand name */}
								<div className="mb-0.5">
									<Skeleton width="85%" height={14} />
								</div>
								{/* Category */}
								<div className="mb-2">
									<Skeleton width="60%" height={10} />
								</div>
							</div>
							{/* Brand logo */}
							<div className="shrink-0">
								<Skeleton width={36} height={36} className="rounded-md" />
							</div>
						</div>

						{/* Price section */}
						<div className="flex items-baseline gap-1.5">
							<Skeleton width={50} height={14} />
							<Skeleton width={40} height={11} />
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

interface BrandCategoriesSkeletonProps {
	count?: number;
}

export const BrandCategoriesSkeleton: React.FC<BrandCategoriesSkeletonProps> = ({ count = 8 }) => {
	return (
		<div className="mb-6">
			<div className="relative">
				<div className="overflow-x-auto pb-2 hide-scrollbar">
					<div className="flex space-x-2 px-1 min-w-max">
						{/* "All" category - typically shorter */}
						<div className="shrink-0">
							<Skeleton width={50} height={32} borderRadius={9999} />
						</div>

						{/* Other categories with varying widths */}
						{Array.from({ length: count - 1 }).map((_, index) => {
							const width = 70 + ((index * 23) % 50);
							return (
								<div key={index} className="shrink-0">
									<Skeleton width={width} height={32} borderRadius={9999} />
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

interface BrandsPageSkeletonProps {
	showCategories?: boolean;
	categoriesCount?: number;
	brandsCount?: number;
}

export const BrandsPageSkeleton: React.FC<BrandsPageSkeletonProps> = ({
	showCategories = true,
	categoriesCount = 8,
	brandsCount = 12
}) => {
	return (
		<div className="space-y-6">
			{/* Categories Skeleton */}
			{showCategories && (
				<BrandCategoriesSkeleton count={categoriesCount} />
			)}

			{/* Brand Cards Skeleton */}
			<BrandCardSkeleton count={brandsCount} />
		</div>
	);
};

export default BrandsPageSkeleton;