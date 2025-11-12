import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface MoneySavedSkeletonProps {
	friendsCount?: number;
	topSaversCount?: number;
}

const MoneySavedSkeleton: React.FC<MoneySavedSkeletonProps> = ({
	friendsCount = 5,
	topSaversCount = 5
}) => {
	return (
		<div className="space-y-8">
			{/* Header with Total Savings */}
			<div className="relative bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 rounded-2xl p-8 overflow-hidden">
				{/* Decorative Background Elements */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute top-4 left-8 w-4 h-4 bg-yellow-400 rounded-full opacity-60"></div>
					<div className="absolute top-12 right-12 w-3 h-3 bg-green-400 rounded-full opacity-50"></div>
					<div className="absolute bottom-8 left-16 w-2 h-2 bg-pink-400 rounded-full opacity-70"></div>
					<div className="absolute top-20 left-1/3 w-6 h-6 bg-orange-400 rounded-full opacity-40"></div>
					<div className="absolute bottom-16 right-8 w-5 h-5 bg-blue-400 rounded-full opacity-50"></div>
					<div className="absolute top-8 right-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-60"></div>
					<div className="absolute bottom-4 left-1/2 w-4 h-4 bg-red-400 rounded-full opacity-45"></div>
				</div>

				<div className="relative z-10 text-center">
					<div className="mb-2">
						<Skeleton width={120} height={24} />
					</div>
					<div className="mb-4">
						<Skeleton width={200} height={48} />
					</div>
					<div>
						<Skeleton width={180} height={20} />
					</div>
				</div>
			</div>

			{/* Savings Categories */}
			<div className="relative">
				<div className="overflow-x-auto pb-4 hide-scrollbar">
					<div className="flex space-x-4 px-1">
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className="bg-dark-400 rounded-xl p-6 text-center flex-none w-48">
								<div className="w-12 h-12 rounded-full mx-auto mb-4">
									<Skeleton circle width={48} height={48} />
								</div>
								<div className="mb-1">
									<Skeleton width={120} height={16} />
								</div>
								<div className="mb-1">
									<Skeleton width={60} height={14} />
								</div>
								<div>
									<Skeleton width={80} height={20} />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Your Friends Section */}
			<div className="bg-dark-400 rounded-xl p-6">
				<div className="mb-6">
					<Skeleton width={120} height={24} />
				</div>
				<div className="relative">
					<div className="overflow-x-auto pb-4 hide-scrollbar">
						<div className="flex space-x-4 px-1">
							{Array.from({ length: friendsCount }).map((_, index) => (
								<div key={index} className="flex-none w-32 text-center">
									<div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3">
										<Skeleton circle width={64} height={64} />
									</div>
									<div className="mb-1">
										<Skeleton width={80} height={14} />
									</div>
									<div className="mb-1">
										<Skeleton width={40} height={12} />
									</div>
									<div>
										<Skeleton width={60} height={16} />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Top Savers Section */}
			<div className="bg-dark-400 rounded-xl p-6">
				<div className="mb-6">
					<Skeleton width={100} height={24} />
				</div>
				<div className="relative">
					<div className="overflow-x-auto pb-4 hide-scrollbar">
						<div className="flex space-x-4 px-1">
							{Array.from({ length: topSaversCount }).map((_, index) => (
								<div key={index} className="flex-none w-32 text-center">
									<div className="relative mb-3">
										<div className="w-16 h-16 rounded-full overflow-hidden mx-auto">
											<Skeleton circle width={64} height={64} />
										</div>
										{/* Rank Badge */}
										<div className="absolute -top-1 -right-1">
											<Skeleton circle width={24} height={24} />
										</div>
									</div>
									<div className="h-16 flex flex-col justify-between">
										<div className="mb-1">
											<Skeleton width={80} height={14} />
										</div>
										<div className="mb-1">
											<Skeleton width={40} height={12} />
										</div>
										<div>
											<Skeleton width={50} height={14} />
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Share Button */}
			<div>
				<Skeleton height={56} className="rounded-xl" />
			</div>
		</div>
	);
};

export default MoneySavedSkeleton;