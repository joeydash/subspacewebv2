import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface ProductDetailSkeletonProps {
	showAbout?: boolean;
	showRedeemInstructions?: boolean;
	plansCount?: number;
}

const ProductDetailSkeleton: React.FC<ProductDetailSkeletonProps> = ({
	showAbout = true,
	showRedeemInstructions = true,
	plansCount = 6
}) => {
	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<Skeleton circle width={40} height={40} />
				<div className="flex-1">
					<Skeleton width={200} height={24} />
					<Skeleton width={300} height={16} />
				</div>
			</div>

			{/* Hero Section with Backdrop */}
			<div className="relative mb-8 rounded-xl overflow-hidden">
				<div className="h-48 md:h-64 relative">
					<Skeleton width="100%" height="100%" />

					{/* Service Info Overlay */}
					<div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
						<div className="flex items-end gap-3 md:gap-6">
							<div className="w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0">
								<Skeleton width="100%" height="100%" className="rounded-xl" />
							</div>
							<div className="flex-1 text-white min-w-0">
								<div className="mb-2">
									<Skeleton width={200} height={28} />
								</div>
								<div className="flex flex-wrap items-center gap-2 mb-3">
									<Skeleton width={80} height={20} className="rounded-full" />
									<Skeleton width={100} height={20} className="rounded-full" />
									<Skeleton width={60} height={20} className="rounded-full" />
									<Skeleton width={90} height={20} className="rounded-full" />
								</div>
								<div className="flex gap-2">
									<Skeleton width={80} height={28} className="rounded-lg" />
									<Skeleton width={70} height={28} className="rounded-lg" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* About Section */}
			{showAbout && (
				<div className="mb-6">
					<div className="space-y-2">
						<Skeleton width="100%" height={14} />
						<Skeleton width="95%" height={14} />
						<Skeleton width="85%" height={14} />
					</div>
				</div>
			)}

			{/* Redeem Instructions */}
			{showRedeemInstructions && (
				<div className="mb-8">
					<div className="flex items-center justify-between w-full py-3 px-4 rounded-lg">
						<div className="flex items-center gap-2 md:gap-3">
							<Skeleton width={20} height={20} />
							<Skeleton width={180} height={18} />
						</div>
						<Skeleton width={20} height={20} />
					</div>
				</div>
			)}

			{/* Products/Plans Section */}
			<div>
				<div className="flex items-center justify-between mb-4 md:mb-6">
					<div>
						<Skeleton width={180} height={24} />
						<Skeleton width={250} height={14} className="mt-1" />
					</div>
					<Skeleton width={80} height={14} />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
					{Array.from({ length: plansCount }).map((_, index) => (
						<div
							key={index}
							className="relative rounded-lg overflow-hidden bg-dark-400 border border-gray-700/50"
						>
							{/* Header with discount */}
							<div className="bg-linear-to-r from-dark-300/50 to-dark-400/50 px-3 py-2.5 flex items-center justify-between border-b border-gray-700/30">
								<div className="flex items-center gap-2">
									<Skeleton width={60} height={20} className="rounded" />
								</div>
								<Skeleton width={28} height={28} className="rounded-full" />
							</div>

							{/* Content */}
							<div className="p-4">
								<Skeleton width="80%" height={16} className="mb-2" />
								<div className="mb-3 min-h-10">
									<Skeleton width="100%" height={14} className="mb-1" />
									<Skeleton width="85%" height={14} />
								</div>

								{/* Price and Duration Row */}
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-baseline gap-2">
										<Skeleton width={80} height={28} />
										<Skeleton width={60} height={14} />
									</div>
									<Skeleton width={70} height={20} className="rounded" />
								</div>

								{/* Action Button */}
								<Skeleton height={42} className="rounded-lg" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ProductDetailSkeleton;