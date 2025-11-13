'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Send, Loader, Smile, Image as ImageIcon, ChevronUp, MoreVertical, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useLanguageStore } from '@/lib/store/language-store';
import { handleSupportChat } from '@/lib/utils/support-chat';
import { io, Socket } from 'socket.io-client';
import FriendInfoModal from '@/components/friend-info-modal';

const GET_SUPPORT_CHAT = `
query MyQuery(
  $user_id: uuid,
  $limit: Int,
  $offset: Int,
  $type: [String!],
  $room_id: uuid!
) {
  __typename
  whatsub_rooms(
    where: {
      id: { _eq: $room_id }
      whatsub_room_user_mappings: { user_id: { _eq: $user_id } }
      status: { _eq: "active" }
      type: { _in: $type }
    }
    limit: $limit
    offset: $offset
    order_by: { latest_message_created_at: desc }
  ) {
    __typename
    name
    id
    type
    room_dp
    blurhash
    latest_message
    latest_message_created_at
    latest_message_created_by
    auth_fullname {
      __typename
      fullname
    }
    whatsub_room_user_mappings(
      where: { whatsub_room: { type: { _nin: ["group", "pool"] } }, user_id: { _neq: $user_id } }
    ) {
      __typename
      user_id
      auth_fullname {
        __typename
        dp
        fullname
      }
    }
    unseen_messages: whatsub_room_user_mappings(where: { user_id: { _eq: $user_id } }) {
      __typename
      unseen_message_count
    }
  }
}
`

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

const MESSAGES_PER_PAGE = 50;

const SupportChatPage = () => {
	const { user } = useAuthStore();
	const isBlocked = user?.isBlocked;
	const { t } = useLanguageStore();

	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const hasScrolledUpRef = useRef<boolean>(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const firstUnreadRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const emojiPickerRef = useRef<HTMLDivElement>(null);
	const loadMoreButtonRef = useRef<HTMLButtonElement>(null);

	const [isMobile, setIsMobile] = useState(false);
	const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMoreMessages, setHasMoreMessages] = useState(true);
	const [currentOffset, setCurrentOffset] = useState(0);
	const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [newMessage, setNewMessage] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [socket, setSocket] = useState<Socket | null>(null);

	const [supportRoomId, setSupportRoomId] = useState('');
	const [supportRoomDetails, setSupportRoomDetails] = useState(null);
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const [showFriendInfoModal, setShowFriendInfoModal] = useState(false);
	const [selectedFriendId, setSelectedFriendId] = useState<string>('');
	const [selectedFriendName, setSelectedFriendName] = useState<string>('');
	const [isDeletingChat, setIsDeletingChat] = useState(false);

	const router = useRouter();

	const fetchMessages = async (roomId: string, showLoading: boolean = true, loadMore: boolean = false) => {
		if (!user?.id || !user?.auth_token) return;

		const offset = loadMore ? currentOffset : 0;

		if (showLoading && !loadMore) {
			setIsLoadingMessages(true);
			setHasUnreadMessages(false);
			setFirstUnreadMessageId(null);
		} else if (loadMore) {
			setIsLoadingMore(true);
		}

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query getMessages($room_id: uuid!, $limit: Int, $offset: Int) {
						__typename
						whatsub_message(where: {room_id: {_eq: $room_id}}, order_by: {created_at: desc}, limit: $limit, offset: $offset) {
							__typename
							id
							message
							options
							created_at
							from_user_id
							type
							from_user_fullname {
							__typename
							fullname
							}
							click_type
							click_text
							click_data
						}
						}
          `,
					variables: {
						room_id: supportRoomId,
						limit: MESSAGES_PER_PAGE,
						offset: offset
					}
				})
			});

			const data = await response.json();

			if (data.data?.whatsub_message) {
				const fetchedMessages = data.data.whatsub_message.reverse();

				// Check if we have more messages to load
				const hasMore = fetchedMessages.length === MESSAGES_PER_PAGE;
				setHasMoreMessages(hasMore);

				const unseenCount = 0;

				// Mark messages as read/unread based on unseen count
				const messagesWithReadStatus = fetchedMessages.map((message: Message, index: number) => {
					const isUnread = index >= (fetchedMessages.length - unseenCount) && message.from_user_id !== user.id;
					return {
						...message,
						is_seen: !isUnread
					};
				});

				if (loadMore) {
					// Prepend older messages to the beginning of the array
					setMessages(prev => [...messagesWithReadStatus, ...prev]);
					setCurrentOffset(prev => prev + MESSAGES_PER_PAGE);
				} else {
					// Initial load or refresh - replace all messages
					setMessages(messagesWithReadStatus);
					setCurrentOffset(MESSAGES_PER_PAGE);

					// Set unread message tracking
					if (unseenCount > 0) {
						setHasUnreadMessages(true);
						const firstUnreadIndex = messagesWithReadStatus.length - unseenCount;
						const firstUnread = messagesWithReadStatus.find((msg, idx) => idx >= firstUnreadIndex && msg.from_user_id !== user.id);
						if (firstUnread) {
							setFirstUnreadMessageId(firstUnread.id);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error fetching messages:', error);
		} finally {
			if (showLoading && !loadMore) {
				setIsLoadingMessages(false);
			} else if (loadMore) {
				setIsLoadingMore(false);
			}
		}
	};

	const handleLoadMore = async () => {
		if (!hasMoreMessages || isLoadingMore) return;

		// Store the current scroll position
		const container = messagesContainerRef.current;
		if (!container) return;

		const scrollHeightBefore = container.scrollHeight;
		const scrollTopBefore = container.scrollTop;

		await fetchMessages(supportRoomId, false, true);

		// Restore scroll position after new messages are loaded
		setTimeout(() => {
			if (container) {
				const scrollHeightAfter = container.scrollHeight;
				const heightDiff = scrollHeightAfter - scrollHeightBefore;
				container.scrollTop = scrollTopBefore + heightDiff;
			}
		}, 50);
	};

	const fetchSupportChat = async (supportRoomId: string) => {
		if (!supportRoomId) return;

		try {
			const res = await fetch("https://db.subspace.money/v1/graphql", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${user?.auth_token}`,
				},
				body: JSON.stringify({
					query: GET_SUPPORT_CHAT,
					variables: {
						user_id: user?.id,
						limit: 20,
						offset: 0,
						type: ["private"],
						room_id: supportRoomId,
					},
				}),
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`);
			}

			const data = await res.json();

			if (data.errors && data.errors.length > 0) {
				console.error("GraphQL Errors:", data.errors);
				throw new Error(data.errors.map((err: any) => err.message).join(", "));
			}

			const supportRoomDetails = data?.data?.whatsub_rooms?.[0];
			setSupportRoomDetails(supportRoomDetails);
		} catch (e) {
			if (e instanceof Error) {
				console.error("Failed to fetch support chat:", e.message);
			} else {
				console.error("Unknown error while fetching support chat:", e);
			}
			return null;
		}
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

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		}).toLowerCase();
	};

	const handleImageIconClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleImageUpload = async (file: File) => {
		if (!user?.id || !user?.auth_token) return;
		setIsUploadingImage(true);
		try {
			const base64Image = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					if (typeof reader.result === 'string') {
						resolve(reader.result);
					} else {
						reject(new Error('Failed to convert file to base64'));
					}
				};
				reader.onerror = () => reject(new Error('Failed to read file'));
				reader.readAsDataURL(file);
			});

			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
					mutation MyMutation($from_user_id: uuid = "", $room_id: uuid = "", $image: String = "") {
						__typename
						whatsubSendImageAsMessage(
							request: {
								from_user_id: $from_user_id
								room_id: $room_id
								image: $image
							}
						) {
							__typename
							message
						}
					}
				`,
					variables: {
						from_user_id: user.id,
						room_id: supportRoomId,
						image: base64Image,
					}
				})
			});

			const data = await response.json();

			if (data.data?.whatsubSendImageAsMessage?.message) {
				fetchMessages('', false);
			} else {
				console.error('Unexpected response structure:', data);
			}
		} catch (error) {
			console.error('Error uploading image:', error);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				console.error('Selected file is not an image');
				return;
			}

			if (file.size > 10 * 1024 * 1024) {
				console.error('File size exceeds 10MB limit');
				return;
			}

			handleImageUpload(file);
		}
		event.target.value = '';
	};

	const handleSendMessage = async () => {
		if (!user?.id || !user?.auth_token || !newMessage.trim()) return;

		const messageText = newMessage.trim();
		setIsSending(true);

		const optimisticMessage: Message = {
			id: `temp-${Date.now()}`,
			message: messageText,
			options: null,
			created_at: new Date().toISOString(),
			from_user_id: user.id,
			type: 'text',
			from_user_fullname: {
				fullname: user.fullname || 'You'
			},
			click_type: '',
			click_text: '',
			click_data: null,
			is_seen: true
		};

		setMessages(prev => [...prev, optimisticMessage]);
		setNewMessage('');

		setTimeout(() => {
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollIntoView({
					behavior: 'smooth',
					block: 'end'
				});
			}
		}, 50);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation SendMessage($message: String!, $user_id: uuid!, $room_id: uuid!) {
              __typename
              sendMessage(request: {message: $message, user_id: $user_id, room_id: $room_id}) {
                __typename
                affected_rows
              }
            }
          `,
					variables: {
						message: messageText,
						user_id: user.id,
						room_id: supportRoomId
					}
				})
			});

			const data = await response.json();
			if (data.data?.sendMessage?.affected_rows === 0) {
				setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
				setNewMessage(messageText);
			}
		} catch (error) {
			console.error('Error sending message:', error);
			setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
			setNewMessage(messageText);
		} finally {
			setIsSending(false);
		}
	};

	const toggleEmojiPicker = () => {
		setShowEmojiPicker(!showEmojiPicker);
	};

	const handleEmojiClick = (emojiData: EmojiClickData) => {
		setNewMessage(prev => prev + emojiData.emoji);
		setShowEmojiPicker(false);
	};

	const initializeSocket = async () => {
		if (!user?.id || !user?.auth_token) return;

		try {
			const newSocket = io('https://socket.subspace.money', {
				transports: ['websocket'],
				query: {
					id: user.id,
					token: `Bearer ${user.auth_token}`
				}
			});

			newSocket.on('connect', () => {
				console.log('WebSocket connected');
				setIsConnected(true);
			});

			newSocket.on('message', (data: string) => {
				console.log('New message received:', data);
				// Reset pagination when new message arrives
				setCurrentOffset(0);
				setHasMoreMessages(true);
				fetchMessages(supportRoomId, false);
			});

			newSocket.on('error', (error: any) => {
				console.error('WebSocket error:', error);
			});

			newSocket.on('disconnect', () => {
				console.log('WebSocket disconnected');
				setIsConnected(false);
			});

			setSocket(newSocket);
		} catch (error) {
			console.error('Error initializing WebSocket:', error);
		}
	};

	const handleBackClick = () => {
		router.push('/blocked');
	};

	const handleLogout = () => {
		const { logout } = useAuthStore.getState();
		logout();
		router.push('/auth');
	};

	const handleProfileClick = () => {
		const supportAgent = supportRoomDetails?.whatsub_room_user_mappings?.[0];
		if (supportAgent) {
			setSelectedFriendId(supportAgent.user_id);
			setSelectedFriendName(supportAgent.auth_fullname.fullname);
			setShowFriendInfoModal(true);
		}
	};

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowMenu(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	useEffect(() => {
		if (messages.length > 0 && !isLoadingMessages) {
			const timer = setTimeout(() => {
				if (hasUnreadMessages && firstUnreadRef.current) {
					firstUnreadRef.current.scrollIntoView({
						behavior: 'smooth',
						block: 'center'
					});
				} else if (messagesEndRef.current && !hasScrolledUpRef.current) {
					messagesEndRef.current.scrollIntoView({
						behavior: 'smooth',
						block: 'end'
					});
				}
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [messages, isLoadingMessages, hasUnreadMessages]);

	useEffect(() => {
		const fetchSupportRoom = async () => {
			const supportRoomId = await handleSupportChat(user?.id || '', user?.auth_token || '');
			setSupportRoomId(supportRoomId);
		};

		fetchSupportRoom();
	}, []);

	useEffect(() => {
		if (!supportRoomId) return;
		fetchSupportChat(supportRoomId);
	}, [supportRoomId]);

	useEffect(() => {
		initializeSocket();
		fetchMessages('', true);

		return () => {
			if (socket) {
				socket.disconnect();
			}
		};
	}, [user?.id, user?.auth_token, supportRoomId]);

	useEffect(() => {
		if (!isBlocked) router.push('/');
	}, [isBlocked, router]);

	if (!isBlocked) {
		return null;
	}


	return (
		<div className={`flex flex-col h-screen max-w-4xl mx-auto`}>
			{/* Chat Header - Fixed at top */}
			<div className="shrink-0 p-6 border-b border-gray-700/50 bg-dark-600/30">
				<div className="flex items-center justify-between">
					<div
						onClick={handleProfileClick}
						className={`flex items-center space-x-4 cursor-pointer hover:bg-dark-400/50 rounded-xl p-2 -m-2 transition-colors}`}
					>
						<button
							className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-dark-400 rounded"
							onClick={(e) => {
								e.stopPropagation();
								handleBackClick();
							}}
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<div
							className="relative cursor-pointer"
						>
							<div className="w-12 h-12 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-500 p-0.5">
								<div className="w-full h-full rounded-full overflow-hidden bg-dark-600">
									<Image
										src={supportRoomDetails?.whatsub_room_user_mappings?.[0]?.auth_fullname?.dp || '/placeholder.png'}
										alt=""
										width={48}
										height={48}
										className="w-full h-full object-cover"
									/>
								</div>
							</div>
							<div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-dark-600 ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
						</div>

						<div>
							<h2 className="font-semibold text-lg text-white">
								{supportRoomDetails?.whatsub_room_user_mappings[0]?.auth_fullname?.fullname}
							</h2>
						</div>
					</div>

					{/* Three Dots Menu */}
					<div className="relative" ref={menuRef}>
						<button
							onClick={() => setShowMenu(!showMenu)}
							className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
						>
							<MoreVertical className="h-5 w-5" />
						</button>

						{/* Dropdown Menu */}
						{showMenu && (
							<div className="absolute right-0 top-full mt-2 bg-dark-400 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[140px]">
								<button
									onClick={() => {
										setShowMenu(false);
										handleLogout();
									}}
									className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-b-lg flex items-center gap-2"
								>
									<LogOut className="h-4 w-4" />
									<span>Logout</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Messages - Scrollable middle section */}
			<div
				ref={messagesContainerRef}
				onScroll={() => {
					const scrollTop = messagesContainerRef.current?.scrollTop || 0;
					const scrollHeight = messagesContainerRef.current?.scrollHeight || 0;

					if (scrollHeight - scrollTop > 500) {
						hasScrolledUpRef.current = true;
					} else {
						hasScrolledUpRef.current = false;
					}
				}}
				className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar min-h-0"
			>
				{isLoadingMessages ? (
					<div className="flex justify-center items-center h-full">
						<Loader className="h-8 w-8 animate-spin text-indigo-500" />
					</div>
				) : (
					<>
						{/* Load More Button */}
						{hasMoreMessages && messages.length > 0 && (
							<div className="text-center mb-4">
								<button
									ref={loadMoreButtonRef}
									onClick={handleLoadMore}
									disabled={isLoadingMore}
									className="inline-flex items-center gap-2 bg-dark-400 hover:bg-dark-300 text-gray-300 text-sm px-4 py-2 rounded-full border border-gray-600/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoadingMore ? (
										<>
											<Loader className="h-4 w-4 animate-spin" />
											<span>Loading older messages...</span>
										</>
									) : (
										<>
											<ChevronUp className="h-4 w-4" />
											<span>Load older messages</span>
										</>
									)}
								</button>
							</div>
						)}

						{/* Unread messages indicator */}
						{hasUnreadMessages && (
							<div className="text-center mb-4">
								<div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 text-sm px-4 py-2 rounded-full border border-orange-500/30">
									<div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
									<span>{t('chat.unreadMessages')}</span>
								</div>
							</div>
						)}

						{messages.map((message, index) => {
							const isCurrentUser = message.from_user_id === user?.id;
							const isFirstUnread = message.id === firstUnreadMessageId;
							const showDate = index === 0 ||
								new Date(messages[index - 1].created_at).toDateString() !==
								new Date(message.created_at).toDateString();

							return (
								<div key={message.id}>
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
											<div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/30">
												<div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
												<span>{t('chat.firstUnread')}</span>
											</div>
										</div>
									)}

									<div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
										<div className={`flex items-end max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
											{!isCurrentUser && (
												<div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-500 p-0.5 shrink-0 mr-2">
													<div className="w-full h-full rounded-full overflow-hidden bg-dark-600">
														<Image
															src={supportRoomDetails?.whatsub_room_user_mappings?.[0]?.auth_fullname?.dp || '/placeholder.png'}
															alt=""
															width={32}
															height={32}
															className="w-full h-full object-cover"
														/>
													</div>
												</div>
											)}

											<div className="relative">
												<div className={`px-4 py-2 rounded-2xl shadow-sm ${isCurrentUser
													? 'bg-indigo-500 text-white rounded-br-md'
													: `bg-dark-400 text-gray-100 rounded-bl-md ${!message.is_seen && !isCurrentUser ? 'ring-2 ring-orange-500/50' : ''}`
													}`}>
													{message.type === 'image' ? (
														<div className="max-w-xs">
															<Image
																src={message.message}
																alt="Shared image"
																width={300}
																height={300}
																className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
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
													) : (
														<p className="text-sm leading-relaxed break-words">{message.message}</p>
													)}
												</div>

												{/* Time and status */}
												<div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
													<span className="text-xs text-gray-500">
														{formatTime(message.created_at)}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}

						{/* Scroll anchor for latest messages */}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{/* Message Input - Fixed at bottom */}
			<div className="shrink-0 p-6 border-t border-gray-700/50 bg-dark-600/30">
				<div className="flex items-center space-x-3">
					<button
						onClick={handleImageIconClick}
						disabled={isUploadingImage}
						className="w-10 h-10 bg-dark-400 hover:bg-dark-300 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isUploadingImage ? (
							<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
						) : (
							<ImageIcon className="h-5 w-5 text-gray-400" />
						)}
					</button>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileSelect}
						className="hidden"
					/>

					<div className="inherit flex-1 relative flex items-center">
						<textarea
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							onKeyPress={async (e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									await handleSendMessage();
								}
							}}
							placeholder={t('chat.typeMessage')}
							className="h-[40px] inherit w-full bg-dark-400 text-white rounded-2xl px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-32 transition-all"
							rows={1}
						/>
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
							<button
								onClick={toggleEmojiPicker}
								className="w-8 h-8 bg-dark-300 hover:bg-dark-200 rounded-lg flex items-center justify-center transition-colors"
							>
								<Smile className="h-4 w-4 text-gray-400" />
							</button>

							{/* Emoji Picker */}
							{showEmojiPicker && (
								<div
									ref={emojiPickerRef}
									className="absolute bottom-12 right-0 z-50"
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
					</div>

					<button
						onClick={handleSendMessage}
						disabled={!newMessage.trim() || isSending}
						className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${newMessage.trim() && !isSending
							? 'bg-indigo-500 hover:bg-indigo-600 text-white'
							: 'bg-dark-400 text-gray-500 cursor-not-allowed'
							}`}
					>
						{isSending ? (
							<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
						) : (
							<Send className="h-5 w-5" />
						)}
					</button>
				</div>
			</div>

			{/* Friend Info Modal */}
			{showFriendInfoModal && selectedFriendId && (
				<FriendInfoModal
					friendId={selectedFriendId}
					friendName={selectedFriendName}
					userId={user?.id || ''}
					userAuthToken={user?.auth_token || ''}
					closeModal={() => {
						setShowFriendInfoModal(false);
						setSelectedFriendId('');
						setSelectedFriendName('');
					}}
				/>
			)}
		</div>
	);
};

export default SupportChatPage;