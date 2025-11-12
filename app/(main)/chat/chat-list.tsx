'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, MessageSquare } from 'lucide-react';
import ChatsSkeleton from './chats-skeleton';
import { useLanguageStore } from '@/lib/store/language-store';
import { useAuthStore } from '@/lib/store/auth-store';

interface ChatRoom {
	name: string;
	id: string;
	type: string;
	room_dp: string;
	blurhash: string;
	latest_message: string;
	latest_message_created_at: string;
	latest_message_created_by: string;
	auth_fullname: {
		fullname: string;
	};
	whatsub_room_user_mappings: Array<{
		user_id: string;
		auth_fullname: {
			dp: string;
			fullname: string;
		};
	}>;
	unseen_messages: Array<{
		unseen_message_count: number;
	}>;
}

interface SearchResult {
	room_id: string;
	name: string;
	fullname: string;
	type: string;
	dp?: string;
	room_dp?: string;
	blurhash?: string;
	latest_message_created_at: string;
}

interface ChatListProps {
	chats: ChatRoom[];
	selectedChat: ChatRoom | null;
	onChatSelect: (chat: ChatRoom) => void;
	isLoading: boolean;
	isConnected: boolean;
	activeTab: 'All' | 'group' | 'private' | 'anonymous';
	onTabChange: (tab: 'All' | 'group' | 'private' | 'anonymous') => void;
	isMobile: boolean;
	selectedChatOnMobile: string | null;
	onLoadMoreChats: () => void;
	hasMoreChats: boolean;
	isLoadingMoreChats: boolean;
	CHATS_PER_PAGE: number;
}

// Custom debounce hook
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const debouncedCallback = useCallback(
		(...args: any[]) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		},
		[callback, delay]
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debouncedCallback;
};

const ChatList: React.FC<ChatListProps> = ({
	chats,
	selectedChat,
	onChatSelect,
	isLoading,
	isConnected,
	activeTab,
	onTabChange,
	isMobile,
	selectedChatOnMobile,
	onLoadMoreChats,
	hasMoreChats,
	isLoadingMoreChats,
	CHATS_PER_PAGE
}) => {
	const { t } = useLanguageStore();
	const { user } = useAuthStore();
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const chatsContainerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);


	// Search function
	const performSearch = useCallback(async (query: string) => {
		if (!user?.id || !user?.auth_token || query.trim().length < 2) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query SearchUsers($user_id: uuid!, $name: String!) {
							searchUser: whatsub_room_users_mapping(
								where: {
									u_id: { _eq: $user_id }
									user_id: { _neq: $user_id }
									fullname: { _ilike: $name }
								}
							) {
								__typename
								room_id
								name
								fullname
								type
								dp
								blurhash
								latest_message_created_at
							}
							searchGroup: whatsub_room_users_mapping(
								where: {
									u_id: { _eq: $user_id }
									name: { _ilike: $name }
									type: { _in: ["group", "pool"] }
								}
							) {
								__typename
								room_id
								name
								fullname
								type
								room_dp
								blurhash
								latest_message_created_at
							}
						}
					`,
					variables: {
						user_id: user.id,
						name: `%${query}%`
					}
				})
			});

			const data = await response.json();

			if (data.data) {
				const userResults = data.data.searchUser || [];
				const groupResults = data.data.searchGroup || [];

				// Combine and deduplicate results
				const allResults = [...userResults, ...groupResults];
				const uniqueResults = allResults.filter((item, index, self) =>
					index === self.findIndex((t) => t.room_id === item.room_id)
				);

				setSearchResults(uniqueResults);
			}
		} catch (error) {
			console.error('Error searching:', error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	}, [user?.id, user?.auth_token]);

	// Create debounced search function
	const debouncedSearch = useDebounce(performSearch, 300);

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);

		if (query.trim()) {
			debouncedSearch(query);
		} else {
			setSearchResults([]);
		}
	};

	// Handle selecting a search result
	const handleSelectSearchResult = (result: SearchResult) => {
		// Find the chat in existing chats
		const existingChat = chats.find(chat => chat.id === result.room_id);

		if (existingChat) {
			// If chat exists in the list, select it
			onChatSelect(existingChat);
		} else {
			// If chat doesn't exist in current list, create a temporary chat object
			// This might happen if the chat is filtered out by the current tab
			const tempChat: ChatRoom = {
				id: result.room_id,
				name: result.type === 'group' || result.type === 'pool' ? result.name : result.fullname,
				type: result.type,
				room_dp: result.room_dp || '',
				blurhash: result.blurhash || '',
				latest_message: '',
				latest_message_created_at: result.latest_message_created_at || new Date().toISOString(),
				latest_message_created_by: '',
				auth_fullname: {
					fullname: result.fullname || result.name
				},
				whatsub_room_user_mappings: result.type !== 'group' && result.type !== 'pool' ? [{
					user_id: '',
					auth_fullname: {
						dp: result.dp || '',
						fullname: result.fullname
					}
				}] : [],
				unseen_messages: [{
					unseen_message_count: 0
				}]
			};

			onChatSelect(tempChat);
		}

		// Clear search after selection
		setSearchQuery('');
		setSearchResults([]);
	};

	const handleChatScroll = () => {
		const container = chatsContainerRef.current;
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;

		// Check if user scrolled to bottom (with 10px threshold)
		if (scrollHeight - scrollTop <= clientHeight + 10 && hasMoreChats && !isLoadingMoreChats) {
			onLoadMoreChats();
		}
	};

	const getLastMessageTime = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return 'now';
		if (diffInMinutes < 60) return `${diffInMinutes}m`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;

		// Format date
		const today = new Date();
		if (date.toDateString() === today.toDateString()) {
			return t('common.today');
		}

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		if (date.toDateString() === yesterday.toDateString()) {
			return t('common.yesterday');
		}

		return date.toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
		});
	};

	const getUnseenCount = (chat: ChatRoom) => {
		return chat.unseen_messages[0]?.unseen_message_count || 0;
	};

	const getChatTypeIcon = (type: string) => {
		switch (type) {
			case 'group':
			case 'pool':
				return <div className="w-2 h-2 bg-blue-400 border-1 border-white rounded-full"></div>;
			case 'private':
				return <div className="w-2 h-2 bg-green-400 rounded-full border-1 border-white "></div>;
			case 'anonymous':
				return <div className="w-2 h-2 bg-purple-400 rounded-full border-6 border-white "></div>;
			default:
				return <div className="w-2 h-2 bg-gray-400 rounded-full border-1 border-white "></div>;
		}
	};


	return (
		<div className={`${isMobile ? (selectedChatOnMobile ? 'hidden' : 'h-full') : 'col-span-4'} border-r border-gray-700/50 flex flex-col bg-dark-600/50 overflow-hidden`}>
			{/* Header */}
			<div className="px-2 py-4">
				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<input
							ref={searchInputRef}
							type="text"
							placeholder={t('chat.searchConversations') || 'Search conversations...'}
							value={searchQuery}
							onChange={handleSearchChange}
							className="w-full bg-dark-400 text-white rounded-2xl px-4 py-[10px] pl-10 focus:outline-none focus:ring-1 focus:ring-indigo-00"
						/>
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

						{/* Search Results Dropdown */}
						{(searchResults.length > 0 || (isSearching && searchQuery.trim())) && (
							<div className="absolute top-full left-0 right-0 mt-2 bg-dark-400 rounded-2xl shadow-lg z-50 max-h-64 overflow-y-auto">
								{isSearching ? (
									<div className="p-4 text-center text-gray-400">
										<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
									</div>
								) : searchResults.length > 0 ? (
									<div>
										{searchResults.map((result) => {
											const isGroup = result.type === 'group';
											const displayName = isGroup ? result.name : result.fullname;
											const displayImage = isGroup ? result.room_dp : result.dp;

											return (
												<div
													key={result.room_id}
													className="px-4 py-3 hover:bg-dark-500/50 cursor-pointer transition-colors flex items-center space-x-3"
													onClick={() => handleSelectSearchResult(result)}
												>
													<div className="relative">
														<div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
															<div className="w-full h-full rounded-full overflow-hidden bg-dark-600 relative">
																{displayImage ? (
																	<Image
																		src={displayImage}
																		alt={displayName || ''}
																		fill
																		className="object-cover"
																		sizes="40px"
																	/>
																) : (
																	<div className="w-full h-full flex items-center justify-center text-gray-400">
																		{displayName?.charAt(0)?.toUpperCase()}
																	</div>
																)}
															</div>
														</div>
													</div>
													<div className="flex-1 min-w-0">
														<h4 className="text-white font-medium truncate">{displayName}</h4>
                            {result.type === 'group' && <p className="text-xs text-gray-500">has {result.fullname}</p>}
													</div>
												</div>
											);
										})}
									</div>
								) : searchQuery.trim().length >= 2 ? (
									<div className="p-4 text-center text-gray-400">
										No results found
									</div>
								) : null}
							</div>
						)}
					</div>

					{/* Plus Button */}
					<Link
						href="/friends"
						className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 rounded-[50%] flex items-center justify-center transition-colors flex-shrink-0"
					>
						<Plus className="h-5 w-5 text-white" />
					</Link>
				</div>

				{/* Tabs */}
				<div className="mt-4">
					<div className="relative rounded-2xl">
						<div className="overflow-x-auto hide-scrollbar">
							<div className="flex space-x-2 min-w-max">
								{(['All', 'group', 'private', 'anonymous'] as const).map((tab) => (
									<button
										key={tab}
										onClick={() => onTabChange(tab)}
										className={`relative flex-shrink-0 px-4 py-2 rounded-3xl text-sm font-semibold transition-all duration-300 whitespace-nowrap overflow-hidden ${
											activeTab === tab
												? 'bg-indigo-500 text-white'
												: 'text-gray-400 hover:text-white hover:bg-dark-300/50'
										}`}
									>
										<span className="relative z-10">
											{tab === 'All' ? t('common.all') : t(`chat.${tab}`)}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			
			<div
				ref={chatsContainerRef}
				onScroll={handleChatScroll}
				className="flex-1 overflow-y-auto small-scrollbar"
			>
				{isLoading && chats.length == 0? (
					<div className="p-4">
						<ChatsSkeleton count={8} />
					</div>
				) : chats.length === 0 ? (
					<div className="text-center py-12 px-6">
						<MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
						<p className="text-gray-400">{t('chat.noConversations')}</p>
					</div>
				) : (
					<>
						<div className="space-y-1 px-2">
							{chats.map((chat) => {
								const unseenCount = getUnseenCount(chat);
								const isSelected = selectedChat?.id === chat.id;
								const type = chat.type;

								let name;
								let dp;

								if (type === 'group' || type === 'pool') {
									name = chat.name;
									dp = chat.room_dp;
								} else {
									name = chat.whatsub_room_user_mappings[0]?.auth_fullname?.fullname;
									dp = chat.whatsub_room_user_mappings[0]?.auth_fullname?.dp;
								}

								return (
									<div
										key={chat.id}
										className={`px-2 py-4 rounded-xl cursor-pointer group ${isSelected
												? `bg-dark-400/50`
												: 'hover:bg-dark-400/50'
											}`}
										onClick={() => onChatSelect(chat)}
									>
										<div className="flex items-start space-x-3">
											<div className="relative">
												<div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
													<div className="w-full h-full rounded-full overflow-hidden bg-dark-600 relative">
														{dp ? (
															<Image
																src={dp}
																alt={name || ''}
																fill
																className="object-cover"
																sizes="48px"
															/>
														) : (
															<div className="w-full h-full flex items-center justify-center text-gray-400">
																{name?.charAt(0)?.toUpperCase()}
															</div>
														)}
													</div>
												</div>
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex justify-between items-start mb-1">
													<h3 className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
														{name}
													</h3>
													<div className="flex items-center gap-2 flex-shrink-0 ml-2">
														<span className="text-xs text-gray-400">
															{getLastMessageTime(chat.latest_message_created_at)}
														</span>
														{/* Unread badge */}
														{unseenCount > 0 && selectedChat?.id !== chat.id && (
															<div className={`w-5 h-5 rounded-full flex items-center justify-center ${unseenCount > 5
																	? 'bg-red-500 animate-pulse'
																	: 'bg-indigo-500'
																}`}>
																<span className="text-xs text-white font-medium">
																	{unseenCount > 9 ? '9+' : unseenCount}
																</span>
															</div>
														)}
													</div>
												</div>

												<p className={`text-sm truncate ${unseenCount > 0 ? 'text-white font-medium' : 'text-gray-400'
													}`}>
													{chat.latest_message || t('chat.noMessages')}
												</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* Loading indicator for more chats */}
						{isLoadingMoreChats && (
							<div className="flex justify-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
							</div>
						)}

						{/* End indicator */}
						{!hasMoreChats && chats.length >= CHATS_PER_PAGE && (
							<div className="text-center py-4">
								<span className="text-gray-500 text-sm">No more chats</span>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default ChatList;