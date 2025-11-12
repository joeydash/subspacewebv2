'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { ArrowLeft, Search, Users, Clock, Star, Shield, Info, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PublicGroupsSkeleton from './public-groups-skeleton';
import { usePublicGroups } from '@/lib/hooks/groups/use-public-groups';

interface PublicGroup {
	whatsub_plans: {
		duration: number;
		duration_type: string;
		id: string;
		price: number;
		service_id: string;
	};
	group_limit: number;
	hide_limit: number;
	share_limit: number;
	number_of_users: number;
	name: string;
	room_dp: string;
	blurhash: string;
	count: number;
}

const PublicGroupsPage = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'popular'>('all');
	// const [showFilters, setShowFilters] = useState(false);
	const [showInfoModal, setShowInfoModal] = useState(false);

	const { data: groups = [], isLoading } = usePublicGroups({ userId: user?.id, authToken: user?.auth_token });


	let filteredGroups = [...groups];

	if (searchQuery) {
		filteredGroups = filteredGroups.filter(group =>
			group.name.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}

	switch (selectedFilter) {
		case 'available':
			filteredGroups = filteredGroups.filter(group => group.number_of_users < group.share_limit);
			break;
		case 'popular':
			filteredGroups = filteredGroups.sort((a, b) => b.count - a.count);
			break;
		default:
			break;
	}

	const calculatePricePerUser = (group: PublicGroup) => {
		return Math.ceil(group.whatsub_plans.price / group.share_limit);
	};

	const getPopularityBadge = (count: number) => {
		if (count >= 50) return { text: 'Very Popular', color: 'bg-red-500' };
		if (count >= 20) return { text: 'Popular', color: 'bg-orange-500' };
		if (count >= 10) return { text: 'Trending', color: 'bg-yellow-500' };
		return null;
	};

	const handleJoinGroup = (group: PublicGroup) => {
		// Navigate to the product detail page with the service_id from the plan
		router.push(`/groups/${group.whatsub_plans.id}`);
	};

	return (
		<div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 space-y-4">
					<div className="flex items-center gap-3">
						<Link to="/" className="text-gray-400 hover:text-white transition-colors">
							<ArrowLeft className="h-6 w-6" />
						</Link>
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Public Groups</h1>
						<button
							onClick={() => setShowInfoModal(true)}
							className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700/50 rounded-full"
							aria-label="Info"
						>
							<Info className="h-5 w-5" />
						</button>
					</div>

					{/* Search Bar */}
					<div className="relative w-full">
						<input
							type="text"
							placeholder="Search groups..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input pl-12 py-3 w-full rounded-2xl"
						/>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					</div>
				</div>

				{/* Filters */}
				{!isLoading && (
					<div className="mb-6">
						<div className="relative">
							<div className="overflow-x-auto pb-2 hide-scrollbar">
								<div className="flex space-x-2 px-1 min-w-max">
									<button
										onClick={() => setSelectedFilter('all')}
										className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${selectedFilter === 'all'
												? 'bg-slate-600 text-white shadow-lg hover:bg-slate-500'
												: 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
											}`}
									>
										All
									</button>
									<button
										onClick={() => setSelectedFilter('available')}
										className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${selectedFilter === 'available'
												? 'bg-slate-600 text-white shadow-lg hover:bg-slate-500'
												: 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
											}`}
									>
										Available
									</button>
									<button
										onClick={() => setSelectedFilter('popular')}
										className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${selectedFilter === 'popular'
												? 'bg-slate-600 text-white shadow-lg hover:bg-slate-500'
												: 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
											}`}
									>
										Popular
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Groups Grid */}
				{isLoading ? (
					<PublicGroupsSkeleton
						showHeader={true}
						showSearchAndFilters={true}
						groupsCount={12}
					/>
				) : filteredGroups.length === 0 ? (
					<div className="text-center py-12">
						<div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<Users className="h-8 w-8 text-gray-500" />
						</div>
						<h2 className="text-xl font-bold mb-2">No groups found</h2>
						<p className="text-gray-400 text-lg">Try adjusting your search or filters</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredGroups.map((group, index) => {
							const pricePerUser = calculatePricePerUser(group);
							const popularityBadge = getPopularityBadge(group.count);
							const availabilityPercent = Math.round((group.number_of_users / group.share_limit) * 100);
							const spotsLeft = group.share_limit - group.number_of_users;

							return (
								<div
									key={`${group.whatsub_plans.id}-${index}`}
									className="group bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 border border-slate-700/50 hover:border-slate-600 cursor-pointer"
								>
									{/* Header with Service Image */}
									<div className="relative p-4 md:p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/80">
										{popularityBadge && (
											<div className="absolute top-1 right-1 z-10">
												<div className={`${popularityBadge.color} text-white text-[10px] md:text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shadow-md flex items-center gap-1`}>
													<Star className="h-2 w-2 md:h-3 md:w-3 fill-current" />
													{popularityBadge.text}
												</div>
											</div>
										)}

										<div className="flex items-center gap-3">
											<div className="relative h-14 w-14 md:h-16 md:w-16 rounded-lg overflow-hidden bg-slate-700/30 shadow-lg ring-1 ring-slate-600/50 flex-shrink-0 group-hover:ring-slate-500 transition-all duration-300">
												<Image
													src={group.room_dp}
													alt={group.name}
													fill
													className="object-cover transition-transform duration-300 group-hover:scale-105"
													sizes="64px"
												/>
											</div>
											<div className="text-white flex flex-col min-w-0 flex-1">
												<h3 className="font-bold text-base md:text-lg truncate mb-1">{group.name}</h3>
												<div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400">
													<Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
													<span className="truncate">
														{group.whatsub_plans.duration} {group.whatsub_plans.duration_type}
													</span>
												</div>
											</div>
										</div>
									</div>

									{/* Content */}
									<div className="p-4 md:p-5 space-y-3">
										{/* Pricing Section */}
										<div className="flex justify-between items-start gap-2">
											<div className="min-w-0 flex-1">
												<div className="flex items-baseline gap-1.5 mb-1">
													<span className="text-xl md:text-2xl font-bold text-white">
														₹{pricePerUser}
													</span>
													<span className="text-gray-400 text-xs md:text-sm">/device/month</span>
												</div>
												<div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
													<span>Total: ₹{group.whatsub_plans.price}</span>
													<span>•</span>
													<span>Split {group.share_limit} ways</span>
												</div>
											</div>
											<div className="text-right flex-shrink-0">
												<div className="text-xs md:text-sm text-gray-400">Groups</div>
												<div className="text-lg md:text-xl font-bold text-blue-400">{group.count}+</div>
											</div>
										</div>

										{/* Action Button */}
										<button
											onClick={() => handleJoinGroup(group)}
											className="w-full py-2.5 md:py-3 rounded-lg font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base shadow-md hover:shadow-lg active:scale-[0.98]"
										>
											View Groups
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* Info Modal */}
				{showInfoModal && (
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
						<div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-auto shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-bold flex items-center gap-2">
									<Shield className="h-5 w-5 text-blue-400" />
									How Public Groups Work
								</h2>
								<button
									onClick={() => setShowInfoModal(false)}
									className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
							<div className="space-y-6 text-sm text-gray-300">
								<div>
									<h3 className="font-semibold text-white mb-2 text-base">1. Join a Group</h3>
									<p>Browse available groups and join one that matches your subscription needs. Pay only your share of the total cost.</p>
								</div>
								<div>
									<h3 className="font-semibold text-white mb-2 text-base">2. Share Costs</h3>
									<p>Split the subscription cost with other members. Everyone pays their fair share, making premium services affordable.</p>
								</div>
								<div>
									<h3 className="font-semibold text-white mb-2 text-base">3. Enjoy Benefits</h3>
									<p>Get access to premium features at a fraction of the cost. All groups are managed securely through our platform.</p>
								</div>
							</div>
							<button
								onClick={() => setShowInfoModal(false)}
								className="mt-6 w-full py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
							>
								Got it
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PublicGroupsPage;