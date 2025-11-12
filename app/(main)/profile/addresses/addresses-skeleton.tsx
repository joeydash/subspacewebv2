import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface AddressesSkeletonProps {
	count?: number;
}

const AddressesSkeleton: React.FC<AddressesSkeletonProps> = ({ count = 3 }) => {
	return (
		<div className="max-h-[600px] overflow-y-auto divide-y divide-gray-800/80 scrollbar-hide">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="py-3 md:py-4 flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-0"
				>
					{/* Address Info */}
					<div className="flex-1 min-w-0">
						{/* Address type with icon */}
						<div className="flex items-center gap-2 mb-1">
							<Skeleton circle width={20} height={20} />
							<Skeleton width={60} height={16} />
						</div>

						{/* Full address */}
						<div className="space-y-1 mt-1">
							<Skeleton width="90%" height={14} />
							<Skeleton width="70%" height={14} />
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-2 sm:ml-4 self-end sm:self-start">
						<Skeleton width={32} height={32} borderRadius={8} />
						<Skeleton width={32} height={32} borderRadius={8} />
					</div>
				</div>
			))}
		</div>
	);
};

export default AddressesSkeleton;