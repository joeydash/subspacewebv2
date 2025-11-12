import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface TransactionsSkeletonProps {
	count?: number;
}

const TransactionsSkeleton: React.FC<TransactionsSkeletonProps> = ({ count = 5 }) => {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/30"
				>
					<div className="flex items-center gap-4">
						{/* Transaction Icon */}
						<div className="w-10 h-10 rounded-full">
							<Skeleton circle width={40} height={40} />
						</div>

						{/* Transaction Details */}
						<div className="flex-1">
							<div className="mb-2">
								<Skeleton width={180} height={16} />
							</div>
							<div>
								<Skeleton width={120} height={12} />
							</div>
						</div>

						{/* Amount */}
						<div className="text-right">
							<Skeleton width={80} height={16} />
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default TransactionsSkeleton;