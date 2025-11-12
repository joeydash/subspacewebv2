import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { HelpCircle } from 'lucide-react';

const HelpSupportSkeleton: React.FC = () => {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-3 mb-2">
						<HelpCircle className="h-6 w-6 text-indigo-400" />
						<Skeleton width={180} height={28} />
					</div>
					<Skeleton width={240} height={20} />
				</div>
			</div>

			{/* Support Sections Skeleton */}
			<div className="space-y-4">
				{[1, 2, 3, 4].map((index) => (
					<div key={index} className="bg-dark-400 rounded-xl p-6">
						<div className="flex items-center justify-between">
							<Skeleton width="70%" height={24} />
							<Skeleton circle width={20} height={20} />
						</div>
					</div>
				))}
			</div>

			{/* Chat Button Skeleton */}
			<div className="pt-6">
				<Skeleton width="100%" height={56} borderRadius={12} />
			</div>
		</div>
	);
};

export default HelpSupportSkeleton;
