import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Mail } from 'lucide-react';

const MailboxSkeleton: React.FC = () => {
	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1">
						<Mail className="h-5 w-5 text-indigo-400" />
						<Skeleton width={180} height={20} />
					</div>
					<Skeleton width={220} height={16} />
				</div>
			</div>

			{/* Mail Animation */}
			<div className="flex justify-center">
				<Skeleton height={96} width={96} borderRadius={12} />
			</div>

			{/* Features List */}
			<div className="space-y-2.5">
				{[1, 2, 3].map((index) => (
					<div key={index} className="flex items-center gap-3 p-3 bg-dark-400/50 rounded-lg">
						<Skeleton circle width={28} height={28} className="flex-shrink-0" />
						<div className="flex-1">
							<Skeleton width="100%" height={16} />
						</div>
					</div>
				))}
			</div>

			{/* Tutorial Section */}
			<div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex-1">
						<Skeleton width="75%" height={20} className="mb-1" />
						<Skeleton width="55%" height={14} />
					</div>
					<Skeleton circle width={48} height={48} className="flex-shrink-0" />
				</div>
			</div>

			{/* Email Address Section */}
			<div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex-1">
						<Skeleton width="100%" height={20} />
					</div>
					<Skeleton width={40} height={40} borderRadius={8} className="flex-shrink-0" />
				</div>
			</div>
		</div>
	);
};

export default MailboxSkeleton;
