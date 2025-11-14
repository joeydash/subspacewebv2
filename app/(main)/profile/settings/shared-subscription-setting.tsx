'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Package, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { usePublicGroupSettings } from '@/lib/hooks/settings/use-public-group-settings';
import { useSubscriptionRooms } from '@/lib/hooks/settings/use-subscription-rooms';
import { useSubscriptionRoomMutation } from '@/lib/hooks/settings/use-subscription-room-mutation';
import { usePublicGroupMutation } from '@/lib/hooks/settings/use-public-group-mutation';

const SharedSubscriptionSettingsComponent: React.FC = () => {
	const { user } = useAuthStore();

	const {
		data: publicGroupSettings,
		isLoading: isLoadingPublicGroup,
	} = usePublicGroupSettings({
		userId: user?.id,
		authToken: user?.auth_token
	});

	const publicGroup = publicGroupSettings?.is_public ?? false;

	const {
		data: rooms = [],
		isLoading: isLoadingRooms,
		error: roomsError,
		isRefetching: isRefetchingRooms
	} = useSubscriptionRooms({
		userId: user?.id,
		authToken: user?.auth_token
	});

	const [isExpanded, setIsExpanded] = useState(false);

	const subscriptionRoomMutation = useSubscriptionRoomMutation({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	const publicGroupMutation = usePublicGroupMutation({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	const handleSharedSubscriptionToggle = () => {
		const newValue = !publicGroup;
		publicGroupMutation.mutate({ isPublic: newValue });
	};

	return (
		<>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-3 sm:p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
			>
				<div className="flex items-center gap-2 sm:gap-3">
					<Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
					<span className="text-sm sm:text-base font-medium">Shared Subscriptions Settings</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
				) : (
					<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
				)}
			</button>

			{isExpanded && (
				(isLoadingPublicGroup || isLoadingRooms) ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
						<p className="text-gray-400 mt-2">Loading settings...</p>
					</div>
				) : (
					<div className="space-y-3 sm:space-y-4 px-2 sm:px-4 mt-3 sm:mt-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-white text-sm sm:text-base">Toggle All Groups Once</h4>
							<button
								onClick={handleSharedSubscriptionToggle}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${publicGroup ? 'bg-indigo-600' : 'bg-gray-600'}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${publicGroup ? 'translate-x-6' : 'translate-x-1'}`}
								/>
							</button>
						</div>

						<p className="text-xs sm:text-sm text-gray-400">
							Groups with toggle &apos;ON&apos; are public and will be shown in the marketplace. Private groups are only visible to members.
						</p>

						{roomsError ? (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
								<p className="text-red-400 text-xs sm:text-sm">{(roomsError as { message?: string })?.message || String(roomsError)}</p>
							</div>
						) : rooms.length === 0 ? (
							<div className="text-center py-6 sm:py-8 px-2">
								<Users className="h-8 w-8 text-gray-500 mx-auto mb-2" />
								<p className="text-gray-400 text-xs sm:text-sm">No subscription groups found</p>
							</div>
						) : (
							<div className="space-y-2 max-h-80 overflow-y-auto hide-scrollbar">
								{rooms.map((room) => (
									<div key={room.id} className="flex items-center justify-between gap-3 rounded-lg p-1">
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white p-1 shrink-0 relative">
												<Image src={room.room_dp} alt={room.name} fill className="object-contain" />
											</div>
											<div className="flex-1 min-w-0 overflow-hidden">
												<h5 className="font-medium text-white text-sm sm:text-base truncate leading-tight">{room.name}</h5>
												<p className="text-xs sm:text-sm text-gray-400 capitalize truncate">{room.status}</p>
											</div>
										</div>
										<div className="shrink-0 ml-2">
											<button
												onClick={() => subscriptionRoomMutation.mutate({ roomId: room.id, isPublic: !room.is_public })}
												disabled={isRefetchingRooms}
												className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${room.is_public ? 'bg-indigo-600' : 'bg-gray-600'}`}
											>
												<span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${room.is_public ? 'translate-x-6' : 'translate-x-1'}`} />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)
			)}
		</>
	);
};

export default SharedSubscriptionSettingsComponent;
