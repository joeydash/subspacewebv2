'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { MoreVertical, Trash2, Loader, SendHorizontal, Circle, Smile, MessageSquare, ExternalLink } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import MakeGroupPublicPrompt from './make-group-public-prompt';
import { useLanguageStore } from '@/lib/store/language-store';

interface Message {
	id: string;
	message: string;
	options: any;
	created_at: string;
	from_user_id: string;
	type: string;
	from_user_fullname: {
		fullname: string;
	};
	click_type: string;
	click_text: string;
	click_data: any;
	is_seen?: boolean;
}

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

interface MessageViewProps {
	selectedChat: ChatRoom | null;
	messages: Message[];
	isLoadingMessages: boolean;
	isConnected: boolean;
	newMessage: string;
	onNewMessageChange: (message: string) => void;
	onSendMessage: () => void;
	isSending: boolean;
	onDeleteRoom: () => void;
	isDeletingRoom: boolean;
	onBackToChats: () => void;
	isMobile: boolean;
	selectedChatOnMobile: string | null;
	userId: string;
	userFullname: string;
	hasUnreadMessages: boolean;
	firstUnreadMessageId: string | null;
	onShowFriendInfo: () => void;
	onShowGroupInfo: () => void;
	userInfo: any;
	userInfoLoading: boolean;
	roomDetails: any;
	onImageUpload: (file: File) => void;
	isUploadingImage: boolean;
	onLoadMoreMessages: () => void;
	isLoadingMoreMessages: boolean;
	hasMoreMessages: boolean;
	onScroll: () => void;
}

const MessageView: React.FC<MessageViewProps> = ({
	selectedChat,
	messages,
	isLoadingMessages,
	isConnected,
	newMessage,
	onNewMessageChange,
	onSendMessage,
	isSending,
	onDeleteRoom,
	isDeletingRoom,
	onBackToChats,
	isMobile,
	selectedChatOnMobile,
	userId,
	userFullname,
	hasUnreadMessages,
	firstUnreadMessageId,
	onShowFriendInfo,
	onShowGroupInfo,
	userInfo,
	userInfoLoading,
	roomDetails,
	onImageUpload,
	isUploadingImage,
	onLoadMoreMessages,
	isLoadingMoreMessages,
	hasMoreMessages,
	onScroll
}) => {

	const { t } = useLanguageStore();
	const [showDeleteMenu, setShowDeleteMenu] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const firstUnreadRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const emojiPickerRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const userSentMessageRef = useRef(false);
	const hasScrolledToUnreadRef = useRef(false);

	// Add refs to track pagination state
	const isLoadingOlderMessagesRef = useRef(false);
	const shouldMaintainScrollRef = useRef(false);
	const isInitialLoadRef = useRef(true);
	const currentChatIdRef = useRef<string | null>(null);

	useLayoutEffect(() => {
		textareaRef.current?.focus();
	}, [selectedChat?.id])

	// Reset refs when chat changes
	useEffect(() => {
		if (selectedChat?.id !== currentChatIdRef.current) {
			isLoadingOlderMessagesRef.current = false;
			shouldMaintainScrollRef.current = false;
			isInitialLoadRef.current = true;
			hasScrolledToUnreadRef.current = false;
			currentChatIdRef.current = selectedChat?.id || null;

			setShowDeleteMenu(false);
			setShowEmojiPicker(false);
		}
	}, [selectedChat?.id]);

	// Close emoji picker when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
				setShowEmojiPicker(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Replace the scroll-to-unread effect with this version that only scrolls the container:
	useEffect(() => {
		if (!hasUnreadMessages || !firstUnreadMessageId || hasScrolledToUnreadRef.current || isLoadingMessages) {
			return;
		}

		// Wait for next frame to ensure layout is complete
		const scrollTimeout = setTimeout(() => {
			requestAnimationFrame(() => {
				const container = messagesContainerRef.current;
				const unreadMarker = firstUnreadRef.current;

				if (container && unreadMarker) {
					// Get the position of the unread marker relative to the container
					const containerRect = container.getBoundingClientRect();
					const markerRect = unreadMarker.getBoundingClientRect();

					// Calculate the scroll position needed to center the unread marker
					// Use offsetTop which gives position relative to the offsetParent (the container)
					const markerOffsetTop = unreadMarker.offsetTop;
					const containerHeight = container.clientHeight;
					const markerHeight = unreadMarker.clientHeight;

					// Calculate scroll position to center the marker
					const targetScrollTop = markerOffsetTop - (containerHeight / 2) + (markerHeight / 2);

					// Scroll the container directly
					container.scrollTop = targetScrollTop;

					// Fine-tune: scroll up a bit to show context
					setTimeout(() => {
						if (container) {
							container.scrollTop = Math.max(0, container.scrollTop - 50);
						}
					}, 100);

					hasScrolledToUnreadRef.current = true;
				}
			});
		}, 200);

		return () => clearTimeout(scrollTimeout);
	}, [messages.length, hasUnreadMessages, firstUnreadMessageId, isLoadingMessages]);

	// UPDATED: Simplified main scroll effect for other scenarios
	useEffect(() => {
		if (shouldMaintainScrollRef.current) {
			shouldMaintainScrollRef.current = false;
			return;
		}

		if (isLoadingOlderMessagesRef.current) {
			return;
		}

		if (messages.length > 0 && !isLoadingMessages) {
			const timer = setTimeout(() => {
				// User sent message - always scroll to bottom
				if (userSentMessageRef.current) {
					if (messagesEndRef.current) {
						messagesEndRef.current.scrollIntoView({
							behavior: 'smooth',
							block: 'end'
						});
					}
					userSentMessageRef.current = false;
				}
				// Initial load without unread - scroll to bottom
				else if (isInitialLoadRef.current && !hasUnreadMessages) {
					if (messagesEndRef.current) {
						messagesEndRef.current.scrollIntoView({
							behavior: 'instant',
							block: 'end'
						});
					}
					isInitialLoadRef.current = false;
				}
				// New messages while viewing - scroll only if near bottom
				else if (!isInitialLoadRef.current && !hasScrolledToUnreadRef.current) {
					const container = messagesContainerRef.current;
					if (container) {
						const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
						if (isNearBottom && messagesEndRef.current) {
							messagesEndRef.current.scrollIntoView({
								behavior: 'smooth',
								block: 'end'
							});
						}
					}
				}

				if (isInitialLoadRef.current) {
					isInitialLoadRef.current = false;
				}
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [messages, isLoadingMessages, hasUnreadMessages]);

	// Keep your existing handleScroll function unchanged - it's working well for pagination
	const handleScroll = async () => {
		const container = messagesContainerRef.current;
		if (!container) return;

		const scrollTop = container.scrollTop;
		const scrollHeight = container.scrollHeight;

		// Check for pagination when scrolled to top
		if (scrollTop <= 100 &&
			hasMoreMessages &&
			!isLoadingMoreMessages &&
			!isLoadingOlderMessagesRef.current &&
			!isInitialLoadRef.current) {

			// Mark that we're loading older messages
			isLoadingOlderMessagesRef.current = true;
			shouldMaintainScrollRef.current = true;

			// Find the first visible message more accurately
			const messages = container.querySelectorAll('[data-message-id]');
			let anchorMessage = null;
			let anchorOffset = 0;

			// Find the first message that's at least partially visible
			for (const message of messages) {
				const rect = message.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();

				// Check if this message is visible in the viewport
				if (rect.top >= containerRect.top && rect.top <= containerRect.bottom) {
					anchorMessage = message;
					// Store the exact distance from the container top to the message top
					anchorOffset = rect.top - containerRect.top;
					break;
				}
			}

			// If no message found, use the first message as fallback
			if (!anchorMessage && messages.length > 0) {
				anchorMessage = messages[0];
				const rect = anchorMessage.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				anchorOffset = rect.top - containerRect.top;
			}

			// Store the message ID for finding it after new messages load
			const anchorMessageId = anchorMessage?.getAttribute('data-message-id');

			try {
				// Load more messages
				await onLoadMoreMessages();

				// After messages are loaded, restore scroll position
				requestAnimationFrame(() => {
					setTimeout(() => {
						if (container && messagesContainerRef.current && anchorMessageId) {
							// Find the anchor message by its ID
							const sameMessage = container.querySelector(`[data-message-id="${anchorMessageId}"]`);

							if (sameMessage) {
								const rect = sameMessage.getBoundingClientRect();
								const containerRect = container.getBoundingClientRect();
								const currentOffset = rect.top - containerRect.top;

								// Calculate how much we need to scroll to restore the position
								const scrollAdjustment = currentOffset - anchorOffset;

								// Apply the scroll adjustment
								container.scrollTop = container.scrollTop + scrollAdjustment;
							} else {
								// Fallback: maintain position based on height difference
								const newScrollHeight = container.scrollHeight;
								const scrollDifference = newScrollHeight - scrollHeight;
								container.scrollTop = scrollTop + scrollDifference;
							}
						}
					}, 50); // Small delay to ensure DOM is updated
				});
			} finally {
				// Always reset the loading flag after a delay
				setTimeout(() => {
					isLoadingOlderMessagesRef.current = false;
				}, 100);
			}
		}

		// Call the parent's scroll handler
		onScroll();
	};

	// Keep all your other functions unchanged
	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		}).toLowerCase();
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
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

	function formatLastActive(timestamp: any) {
		if (!timestamp) return "";

		const lastActiveDate = new Date(timestamp);
		const now = new Date();

		const diffMs = now.getTime() - lastActiveDate.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHours = Math.floor(diffMin / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMin < 2) {
			return "active now";
		} else if (diffMin < 60) {
			return `active ${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
		} else if (diffHours < 24) {
			return `active ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
		} else if (diffDays < 7) {
			return `active ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
		} else {
			return `last seen on ${lastActiveDate.toLocaleDateString()} at ${lastActiveDate.toLocaleTimeString()}`;
		}
	}

	const handleImageIconClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				console.error('Selected file is not an image');
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				console.error('File size exceeds 10MB limit');
				return;
			}

			// Set flag to trigger scroll to bottom
			userSentMessageRef.current = true;
			onImageUpload(file);
		}
		// Reset the input value
		event.target.value = '';
	};

	const handleEmojiClick = (emojiData: EmojiClickData) => {
		onNewMessageChange(newMessage + emojiData.emoji);
		setShowEmojiPicker(false);
	};

	const toggleEmojiPicker = () => {
		setShowEmojiPicker(!showEmojiPicker);
	};

	function renderMessageWithLinks(text: string) {
		// Match URLs like http:// or https://
		const urlRegex = /(https?:\/\/[^\s]+)/g;

		// Split text by URLs, keeping them as separate parts
		const parts = text.split(urlRegex);

		return parts.map((part, i) => {
			if (urlRegex.test(part)) {
				return (
					<a
						key={i}
						href={part}
						target="_blank"
						rel="noopener noreferrer"
						className="text-indigo-400 hover:text-indigo-300 underline break-all"
					>
						{part}
					</a>
				);
			}
			return <span key={i}>{part}</span>;
		});
	}


	if (!selectedChat) {
		return (
			<div className={`${isMobile ? (selectedChatOnMobile ? 'hidden' : 'h-full') : 'col-span-8'} flex flex-col items-center justify-center text-gray-400 bg-dark-600/20 overflow-hidden`}>
				<div className="text-center">
					<MessageSquare className="h-16 w-16 text-gray-500 mx-auto mb-4" />
					<h3 className="text-xl font-semibold mb-2">{t('chat.welcomeTitle')}</h3>
					<p className="text-gray-500 max-w-md">
						{t('chat.welcomeMessage')}
					</p>
				</div>
			</div>
		);
	}



	return (
		<div className={`${isMobile ? (selectedChatOnMobile ? 'h-[calc(100vh-125px)]' : 'hidden') : 'col-span-8'} flex flex-col overflow-hidden`}>
			<div className="relative px-3 py-2 md:px-4 md:py-3 bg-dark-600/40">
				<div className="flex items-center justify-between">
					<div
						className={`flex items-center space-x-2 md:space-x-3 cursor-pointer hover:bg-dark-400/30 rounded-lg p-1 md:p-1.5 -m-1 md:-m-1.5 transition-all duration-200 flex-1 min-w-0 group`}
						onClick={() => {
							if (selectedChat.type === 'private') {
								onShowFriendInfo();
							} else if (selectedChat.type === 'group') {
								onShowGroupInfo();
							}
						}}
					>
						{isMobile && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									onBackToChats();
								}}
								className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 hover:bg-dark-400/50 rounded-lg"
							>
								<svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
							</button>
						)}

						{/* Avatar with enhanced design */}
						<div className="relative flex-shrink-0">
							<div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md ring-1 ring-dark-600/50 group-hover:ring-indigo-500/30 transition-all duration-300">
								<div className="w-full h-full rounded-full overflow-hidden bg-dark-600">
									<img
										src={selectedChat.type === 'group' ? selectedChat.room_dp : selectedChat.whatsub_room_user_mappings[0]?.auth_fullname?.dp}
										alt=""
										className="w-full h-full object-cover"
									/>
								</div>
							</div>
						</div>

						{/* Chat info */}
						<div className="flex-1 min-w-0">
							<h2 className="font-semibold text-sm md:text-base text-white truncate group-hover:text-indigo-300 transition-colors leading-tight">
								{selectedChat.type === 'group' ? selectedChat.name : selectedChat.whatsub_room_user_mappings[0]?.auth_fullname?.fullname}
							</h2>
							{selectedChat.type === 'private' && (
								<div className="flex items-center gap-1 md:gap-1.5 mt-0.5">
									<Circle className={`h-1.5 w-1.5 fill-current flex-shrink-0 ${isConnected ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
									<p className="text-[11px] md:text-xs text-gray-400 truncate leading-tight">
										{userInfoLoading ? 'Loading...' : formatLastActive(userInfo?.last_active)}
									</p>
								</div>
							)}
							{selectedChat.type === 'group' && (
								<p className="text-[11px] md:text-xs text-gray-400 truncate leading-tight mt-0.5">
									{roomDetails?.whatsub_room_user_mappings?.length || 0} members
								</p>
							)}
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center space-x-1 md:space-x-1.5 flex-shrink-0 ml-2">
						<div className="relative">
							<button
								onClick={() => setShowDeleteMenu(!showDeleteMenu)}
								className="w-8 h-8 md:w-9 md:h-9 hover:bg-dark-300/70 rounded-[50%] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm hover:border border-gray-700/30"
							>
								<MoreVertical className="h-4 w-4 text-gray-400" />
							</button>

							{/* Delete Menu Dropdown */}
							{showDeleteMenu && (
								<div className="absolute right-0 top-full mt-1 bg-dark-400/95 backdrop-blur-md border border-gray-600/50 rounded-lg shadow-2xl z-[100] min-w-[130px] overflow-hidden">
									<button
										onClick={() => {
											onDeleteRoom();
											setShowDeleteMenu(false);
										}}
										disabled={isDeletingRoom}
										className="w-full px-3 py-2 md:px-3.5 md:py-2.5 text-left text-red-400 hover:bg-dark-300/70 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
									>
										{isDeletingRoom ? (
											<>
												<div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-red-400"></div>
												<span className="text-xs">{t('common.deleting')}</span>
											</>
										) : (
											<>
												<Trash2 className="h-3.5 w-3.5" />
												<span className="text-xs">{t('common.delete')}</span>
											</>
										)}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Messages */}
			<div
				ref={messagesContainerRef}
				onScroll={handleScroll}
				className="flex-1 overflow-y-auto p-6 space-y-3 hide-scrollbar"
			>
				{isLoadingMessages ? (
					<div className="flex justify-center items-center h-full">
						<Loader className="h-8 w-8 animate-spin text-indigo-500" />
					</div>
				) : selectedChat &&
					selectedChat.type === 'group' &&
					messages.length === 0 &&
					roomDetails &&
					!roomDetails.is_public &&
					roomDetails.user_id === userId &&
					roomDetails.whatsub_room_user_mappings?.some((mapping: any) =>
						mapping.auth_fullname?.id === userId
					) ? (
					<MakeGroupPublicPrompt
						groupName={roomDetails.name || 'Group'}
						groupId={roomDetails.id}
					/>
				) : (
					<>
						{/* Loading indicator for pagination */}
						{isLoadingMoreMessages && (
							<div className="flex justify-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
							</div>
						)}

						{/* Show indicator if no more messages */}
						{!hasMoreMessages && messages.length > 0 && (
							<div className="text-center py-4">
								<span className="text-gray-500 text-sm">No more messages</span>
							</div>
						)}

						{messages.map((message, index) => {
							const isCurrentUser = message.from_user_id === userId;
							const isFirstUnread = message.id === firstUnreadMessageId;
							const showDate = index === 0 ||
								new Date(messages[index - 1].created_at).toDateString() !==
								new Date(message.created_at).toDateString();
							const type = message.type;


							return (
								<div key={message.id} data-message-id={message.id}>
									{showDate && (
										<div className="text-center mb-6">
											<span className="bg-dark-400 text-gray-400 text-sm px-4 py-2 rounded-full">
												{formatDate(message.created_at)}
											</span>
										</div>
									)}

									{/* First unread message marker */}
									{isFirstUnread && (
										<div ref={firstUnreadRef} className="text-center mb-4">
											<div className="inline-flex items-center gap-2 bg-red-500/20 text-red-500 text-xs px-3 py-1 rounded-full border border-red-500/30">
												<span>Unread Messages</span>
											</div>
										</div>
									)}

									{type === 'event' && (
										<div className='flex justify-center'>
											<p className='bg-indigo-700 text-gray-100 text-xs md:text-sm px-4 py-2 rounded-3xl'>{message.message}</p>
										</div>
									)}

									{type !== 'event' && (
										<div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
											<div className={`flex items-end max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
												{/* Avatar */}
												{!isCurrentUser && selectedChat.type === 'group' && (
													<div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5 flex-shrink-0 mr-2">
														<div className="w-full h-full rounded-full overflow-hidden bg-dark-600">
															<img
																src={
																	selectedChat.type === 'group'
																		? selectedChat.room_dp
																		: selectedChat.whatsub_room_user_mappings[0]?.auth_fullname?.dp
																}
																alt=""
																className="w-full h-full object-cover"
															/>
														</div>
													</div>
												)}

												{/* Bubble */}
												<div className="relative">
													<div
														className={`px-4 py-2 rounded-2xl shadow-sm ${isCurrentUser
																? 'bg-indigo-500 text-white rounded-br-md'
																: `bg-dark-400 text-gray-100 rounded-bl-md ${!message.is_seen && !isCurrentUser ? 'ring-2 ring-orange-500/50' : ''
																}`
															}`}
													>
														{/* Sender name inside bubble (WhatsApp style) */}
														{!isCurrentUser && selectedChat?.type === 'group' && (
															<div className="text-xs font-semibold text-indigo-400 mb-1">
																{message?.from_user_fullname?.fullname || 'Anonymous'}
															</div>
														)}

														{/* Message content */}
														{type === 'loading' && (
															<div className="flex items-center space-x-2">
																<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
																<span className="text-sm">{message.message}</span>
															</div>
														)}

														{type === 'error' && (
															<div className="text-red-400 text-sm">{message.message}</div>
														)}

														{type === 'image' && (
															<div className="max-w-xs">
																<img
																	src={message.message}
																	alt="Shared image"
																	className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
																	style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
																	onClick={() => window.open(message.message, '_blank')}
																	onError={(e) => {
																		e.currentTarget.style.display = 'none';
																		e.currentTarget.nextElementSibling?.classList.remove('hidden');
																	}}
																/>
																<div className="hidden bg-red-500/10 border border-red-500/20 rounded p-2 text-red-400 text-xs">
																	Failed to load image
																</div>
															</div>
														)}

														{type === 'text' && (
															<div className="space-y-2">
																<p className="text-sm leading-relaxed break-words">{renderMessageWithLinks(message.message)}</p>

																{/* If message has a clickable link */}
																{message.click_type &&
																	[
																		'internal',
																		'internal_nac',
																		'internal_nab',
																		'internal_nab_nac',
																		'external',
																		'external_nac',
																		'json',
																		'youtube'
																	].includes(message.click_type) &&
																	message.click_data?.url && (
																		<button
																			onClick={() => window.open(message.click_data.url, '_blank')}
																			className="w-full flex items-center justify-center gap-2 bg-dark-500/60 hover:bg-dark-500 text-indigo-400 hover:text-indigo-300 font-medium text-sm py-2 rounded-xl border border-dark-300/40 transition-all"
																		>
																			<ExternalLink className="w-4 h-4" />
																			<span>{message.click_text || 'Open'}</span>
																		</button>
																	)}
															</div>
														)}
													</div>

													{/* Time and status */}
													<div
														className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'
															}`}
													>
														<span className="text-xs text-gray-500">
															{formatTime(message.created_at)}
														</span>
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							);
						})}

						{/* Scroll anchor for latest messages */}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{/* Message Input */}
			<div className="px-2 md:px-4 py-2 flex-shrink-0">
				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileSelect}
					className="hidden"
				/>

				{/* Single input container with all icons inside */}
				<div className="flex items-end bg-dark-400/80 rounded-3xl backdrop-blur-sm border border-gray-700/30 hover:border-gray-600/50 focus-within:border-gray-600/50 transition-all pl-3 pr-2 py-2">
					{/* Plus icon */}
					<button
						onClick={handleImageIconClick}
						disabled={isUploadingImage}
						className="flex-shrink-0 w-6 h-6 mb-1 flex items-center justify-center transition-colors hover:bg-dark-300/50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isUploadingImage ? (
							<div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-gray-400"></div>
						) : (
							<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
						)}
					</button>

					{/* Emoji icon */}
					<div className="relative flex-shrink-0 ml-1 mb-1">
						<button
							onClick={toggleEmojiPicker}
							className="w-6 h-6 flex items-center justify-center transition-colors hover:bg-dark-300/50 rounded-full"
						>
							<Smile className="h-5 w-5 text-gray-400" />
						</button>

						{/* Emoji Picker */}
						{showEmojiPicker && (
							<div
								ref={emojiPickerRef}
								className="absolute bottom-12 left-0 z-50"
							>
								<EmojiPicker
									onEmojiClick={handleEmojiClick}
									theme="dark"
									width={350}
									height={400}
									searchDisabled={false}
									skinTonesDisabled={false}
									previewConfig={{
										showPreview: false
									}}
								/>
							</div>
						)}
					</div>

					{/* Textarea */}
					<textarea
						ref={textareaRef}
						value={newMessage}
						onChange={(e) => onNewMessageChange(e.target.value)}
						autoFocus={true}
						onInput={(e) => {
							const el = e.currentTarget;
							el.style.height = "24px";
							if (el.scrollHeight > 24) {
								el.style.height = Math.min(el.scrollHeight, 100) + "px";
							}
						}}
						onKeyPress={async (e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								userSentMessageRef.current = true;
								await onSendMessage();
							}
						}}
						data-group-info-button
						placeholder={t('chat.typeMessage')}
						className="flex-1 bg-transparent text-white text-sm px-3 py-0 focus:outline-none resize-none overflow-y-auto hide-scrollbar leading-6 mb-1"
						rows={1}
						style={{ minHeight: '24px', maxHeight: '100px' }}
					/>

					{/* Send button (only shows when text is entered) */}

					<button
						onClick={async () => {
							userSentMessageRef.current = true;
							await onSendMessage();
						}}
						disabled={isSending}
						className={`${newMessage.trim() == "" ? 'invisible' : ''} flex-shrink-0 w-8 h-8 mb-0.5 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-1`}
					>
						{isSending ? (
							<div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white"></div>
						) : (
							<SendHorizontal className="h-4 w-4 text-white" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default MessageView;
