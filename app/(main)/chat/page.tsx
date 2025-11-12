'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { X } from 'lucide-react';
import GroupInfoModal from './group-info-modal';
import GroupInfoView from './group-info-view';
import FriendInfoModal from '@/components/friend-info-modal';
import ChatList from './chat-list';
import MessageView from './message-view';
import { io, Socket } from 'socket.io-client';

import { useQueryClient } from "@tanstack/react-query";
import { UNREAD_CHATS_COUNT_BASE_KEY } from '@/lib/hooks/chat/use-unread-chats-count';
import ProtectedRoute from '@/components/protected-route';

// Your existing query constants
const GET_ROOM_DETAILS = `
  query getRoomsDetails($room_id: uuid!) {
    __typename
    whatsub_rooms(where: { id: { _eq: $room_id } }) {
      __typename
      id
      name
      type
      is_public
      user_id
      room_dp
      details
      whatsub_users_subscriptions(where: { type: { _eq: "admin" } }) {
        __typename
        id
        expiry_image
        whatsub_plan {
          __typename
          admin_conditions
        }
      }
      whatsub_room_user_mappings {
        __typename
        id
        isGroupInfoRead
        auth_fullname {
          __typename
          fullname
          dp
          id
          last_active
          whatsub_public_key {
            __typename
            public_key
          }
        }
        whatsub_group_credential {
          __typename
          credentials
        }
      }
    }
  }
`;

// Your existing interfaces
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

const ChatPage = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();

	// All your existing state variables
	const selectedChatRef = useRef<ChatRoom | null>(null);
	const hasScrolledUpRef = useRef<boolean>(false);

	const [chats, setChats] = useState<ChatRoom[]>([]);
	const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
	const [activeTab, setActiveTab] = useState<'All' | 'group' | 'private' | 'anonymous'>('All');
	const [isLoading, setIsLoading] = useState(false);
	const [newMessage, setNewMessage] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [isDeletingRoom, setIsDeletingRoom] = useState(false);

	const [showFriendInfoModal, setShowFriendInfoModal] = useState(false);
	const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
	const [showAdminGroupInfoModal, setShowAdminGroupInfoModal] = useState(false);
	const [currentUserMapping, setCurrentUserMapping] = useState<any>(null);
	const [roomDetails, setRoomDetails] = useState<any>(null);

	const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
	const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [selectedChatOnMobile, setSelectedChatOnMobile] = useState<string | null>(null);
	const [isMobile, setIsMobile] = useState(false);
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const [userInfo, setUserInfo] = useState(null);
	const [userInfoLoading, setUserInfoLoading] = useState(false);

	// Message pagination state variables
	const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
	const [messageOffset, setMessageOffset] = useState(0);
	const [hasMoreMessages, setHasMoreMessages] = useState(true);
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const MESSAGES_PER_PAGE = 20;

	// Chat pagination state variables
	const [chatOffset, setChatOffset] = useState(0);
	const [hasMoreChats, setHasMoreChats] = useState(true);
	const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false);
	const CHATS_PER_PAGE = 20;

	const searchParams = useSearchParams();
	const groupId = searchParams.get('groupId');

	// Add a previous chat ID ref to properly track changes
	const previousChatIdRef = useRef<string | null>(null);

	const queryClient = useQueryClient();

	// Check if screen is mobile size
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
			queryClient.invalidateQueries([UNREAD_CHATS_COUNT_BASE_KEY]);
		};
	}, []);


	// Initialize WebSocket only once
	useEffect(() => {
		initializeSocket();

		return () => {
			if (socket) {
				socket.disconnect();
			}
		};
	}, [user?.id, user?.auth_token]);

	// Handle tab changes separately - only fetch chat list
	useEffect(() => {
		setChatOffset(0);
		setHasMoreChats(true);
		fetchChats(true, true);
	}, [activeTab]);


	// Keep selectedChatRef in sync
	useEffect(() => {
		selectedChatRef.current = selectedChat;
	}, [selectedChat]);
	// Updated useEffect to handle pagination reset when switching chats

	// Handle selected chat changes with proper tracking
	useEffect(() => {
		if (selectedChat && socket && isConnected) {
			// Check if this is actually a new chat selection
			const isNewChat = previousChatIdRef.current !== selectedChat.id;

			if (isNewChat) {
				// Update the previous chat ID
				previousChatIdRef.current = selectedChat.id;

				// Reset pagination state when switching chats
				setMessageOffset(0);
				setHasMoreMessages(true);
				setIsInitialLoad(true);

				// Fetch messages for the new chat
				fetchMessages(selectedChat.id, true, true);
			}

			// Always mark chat as seen and join room
			markChatAsSeen(selectedChat.id);

			if (selectedChat.unseen_messages?.[0]?.unseen_messages_count > 0) {
				const unseenChatsCountData = queryClient.getQueryData([UNREAD_CHATS_COUNT_BASE_KEY]);
				queryClient.setQueryData([UNREAD_CHATS_COUNT_BASE_KEY, user?.id], unseenChatsCountData - 1);
			}

			socket.emit('join_room', selectedChat.id);
		}
	}, [selectedChat?.id, isConnected]);

	useEffect(() => {
		if (!selectedChat) {
			return;
		}

		const getUserInfo = async () => {
			setUserInfoLoading(true);

			try {
				const res = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${user.auth_token}`
					},
					body: JSON.stringify({
						query: `
              query MyQuery($user_id: uuid = "", $friends_user_id: uuid = "") {
                getUserInfo(request: { friends_user_id: $friends_user_id, user_id: $user_id }) {
                  __typename
                  dp
                  email
                  fullname
                  last_active
                  phone
                }
              }
            `,
						variables: {
							friends_user_id: selectedChat?.whatsub_room_user_mappings?.[0]?.user_id,
							user_id: user?.id
						}
					})
				});

				const data = await res.json();
				setUserInfo(data?.data?.getUserInfo);
			} catch (error) {
				console.log('Failed to fetch user info ', error);
			} finally {
				setUserInfoLoading(false);
			}
		};

		getUserInfo();
	}, [selectedChat?.id]);

	useEffect(() => {
		if (!groupId || !chats || chats.length == 0) {
			return;
		}

		const groupSelected = chats.find(chat => chat.id === groupId);

		if (groupSelected) {
			setSelectedChat(groupSelected);

			if (isMobile) {
				setSelectedChatOnMobile(groupId);
			}

			// Add this line to fetch room details when selecting via query params
			fetchRoomDetails(groupSelected.id);

			router.replace(pathname);
		}

		setShowFriendInfoModal(false);
		setShowGroupInfoModal(false);

	}, [chats, groupId, isMobile, pathname, router]);

	// All your existing functions
	const markChatAsSeen = async (roomId: string) => {
		if (!user?.id || !user?.auth_token) return;

		try {
			await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MarkChatAsSeen($user_id: uuid!, $room_id: uuid!) {
              __typename
              update_whatsub_room_user_mapping(
                where: {user_id: {_eq: $user_id}, room_id: {_eq: $room_id}}, 
                _set: {unseen_message_count: 0}
              ) {
                __typename
                affected_rows
              }
            }
          `,
					variables: {
						user_id: user.id,
						room_id: roomId
					}
				})
			});

			// Update local state to reflect the change immediately
			setChats(prevChats =>
				prevChats.map(chat =>
					chat.id === roomId
						? {
							...chat,
							unseen_messages: [{ unseen_message_count: 0 }]
						}
						: chat
				)
			);
		} catch (error) {
			console.error('Error marking chat as seen:', error);
		}
	};

	const initializeSocket = () => {
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
				setIsConnected(true);
			});

			// Updated socket message handler to handle individual messages properly
			newSocket.on('message', (data: string) => {
				const roomId = data.toString();

				const currentSelectedChat = selectedChatRef.current;

				if (currentSelectedChat && currentSelectedChat.id === roomId) {
					// Use the new handler that replaces optimistic messages
					handleWebSocketMessage(roomId);
					markChatAsSeen(currentSelectedChat.id);
				} else {
					queryClient.invalidateQueries([UNREAD_CHATS_COUNT_BASE_KEY]);
				}

				// Refresh chats without resetting pagination
				fetchChats(false, true);
			});

			newSocket.on('error', (error: any) => {
				console.error('WebSocket error:', error);
			});

			newSocket.on('disconnect', () => {
				setIsConnected(false);
			});

			setSocket(newSocket);
		} catch (error) {
			console.error('Error initializing WebSocket:', error);
		}
	};

	const fetchMessages = async (roomId: string, showLoading: boolean = true, reset: boolean = true) => {
		if (!user?.id || !user?.auth_token) return;

		const currentOffset = reset ? 0 : messageOffset;

		if (showLoading && reset) {
			setIsLoadingMessages(true);
			setHasUnreadMessages(false);
			setFirstUnreadMessageId(null);
		}

		try {
			// First, get the unseen message count for this room
			const unseenCount = selectedChat?.unseen_messages[0]?.unseen_message_count || 0;

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
						room_id: roomId,
						limit: MESSAGES_PER_PAGE,
						offset: currentOffset
					}
				})
			});

			const data = await response.json();

			if (data.data?.whatsub_message) {
				const fetchedMessages = data.data.whatsub_message.reverse();

				// Check if we have more messages to load
				setHasMoreMessages(fetchedMessages.length === MESSAGES_PER_PAGE);

				if (reset) {
					// First load - replace all messages
					setMessageOffset(MESSAGES_PER_PAGE);

					// Mark messages as read/unread based on unseen count
					const messagesWithReadStatus = fetchedMessages.map((message: Message, index: number) => {
						const isUnread = index >= (fetchedMessages.length - unseenCount) && message.from_user_id !== user.id;
						return {
							...message,
							is_seen: !isUnread
						};
					});

					setMessages(messagesWithReadStatus);

					// Set unread message tracking
					if (unseenCount > 0) {
						setHasUnreadMessages(true);
						const firstUnreadIndex = messagesWithReadStatus.length - unseenCount;
						const firstUnread = messagesWithReadStatus.find((msg, idx) => idx >= firstUnreadIndex && msg.from_user_id !== user.id);
						if (firstUnread) {
							setFirstUnreadMessageId(firstUnread.id);
						}
					}
				} else {
					// Pagination load - prepend to existing messages
					setMessageOffset(prev => prev + MESSAGES_PER_PAGE);

					// All older messages are considered read
					const olderMessagesWithReadStatus = fetchedMessages.map((message: Message) => ({
						...message,
						is_seen: true
					}));

					setMessages(prev => [...olderMessagesWithReadStatus, ...prev]);
				}
			}
		} catch (error) {
			console.error('Error fetching messages:', error);
		} finally {
			if (showLoading && reset) {
				setIsLoadingMessages(false);
			}
		}
	};

	const loadMoreMessages = async () => {
		if (!selectedChat || isLoadingMoreMessages || !hasMoreMessages) return;

		setIsLoadingMoreMessages(true);

		try {
			await fetchMessages(selectedChat.id, false, false);
		} catch (error) {
			console.error('Error loading more messages:', error);
		} finally {
			setIsLoadingMoreMessages(false);
		}
	};

	const handleScroll = () => {
		// Tracking scroll position for auto-scroll behavior
		if (!hasScrolledUpRef.current) {
			hasScrolledUpRef.current = true;
		}
	};

	const loadMoreChats = async () => {
		if (isLoadingMoreChats || !hasMoreChats) return;

		setIsLoadingMoreChats(true);
		try {
			await fetchChats(false, false);
		} catch (error) {
			console.error('Error loading more chats:', error);
		} finally {
			setIsLoadingMoreChats(false);
		}
	};

	const fetchChats = async (showLoading: boolean, reset: boolean = true) => {
		if (!user?.id || !user?.auth_token) return;

		const currentOffset = reset ? 0 : chatOffset;

		if (showLoading && reset) {
			setIsLoading(true);
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
            query MyQuery($user_id: uuid, $limit: Int, $offset: Int, $type: [String!]) {
              __typename
              whatsub_rooms(
                where: {
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
                  where: {
                    whatsub_room: { type: { _nin: ["group", "pool"] } }
                    user_id: { _neq: $user_id }
                  }
                ) {
                  __typename
                  user_id
                  auth_fullname {
                    __typename
                    dp
                    fullname
                  }
                }
                unseen_messages: whatsub_room_user_mappings(
                  where: { user_id: { _eq: $user_id } }
                ) {
                  __typename
                  unseen_message_count
                }
              }
            }
          `,
					variables: {
						user_id: user.id,
						limit: CHATS_PER_PAGE,
						offset: currentOffset,
						type: (activeTab == 'All') ? ['group', 'private', 'anonymous'] : [activeTab]
					}
				})
			});

			const data = await response.json();
			const fetchedChats = data.data?.whatsub_rooms || [];

			// Check if we have more chats to load
			setHasMoreChats(fetchedChats.length === CHATS_PER_PAGE);

			if (reset) {
				// First load or filter change - replace all chats
				setChatOffset(CHATS_PER_PAGE);

				// Sort chats: unread messages first, then by latest message time
				const sortedChats = fetchedChats.sort((a: ChatRoom, b: ChatRoom) => {
					const aTime = new Date(a.latest_message_created_at).getTime();
					const bTime = new Date(b.latest_message_created_at).getTime();

					if (aTime != bTime) {
						return bTime - aTime;
					}

					const aUnreadCount = a.unseen_messages[0]?.unseen_message_count || 0;
					const bUnreadCount = b.unseen_messages[0]?.unseen_message_count || 0;

					return bUnreadCount - aUnreadCount;
				});

				setChats(sortedChats);
			} else {
				// Pagination load - append to existing chats
				setChatOffset(prev => prev + CHATS_PER_PAGE);

				// Sort new chats and append
				const sortedNewChats = fetchedChats.sort((a: ChatRoom, b: ChatRoom) => {
					const aTime = new Date(a.latest_message_created_at).getTime();
					const bTime = new Date(b.latest_message_created_at).getTime();
					return bTime - aTime;
				});

				setChats(prev => [...prev, ...sortedNewChats]);
			}
		} catch (error) {
			console.error('Error fetching chats:', error);
		} finally {
			if (showLoading && reset) {
				setIsLoading(false);
			}
		}
	};

	const fetchRoomDetails = async (roomId: string) => {
		if (!user?.id || !user?.auth_token) return;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: GET_ROOM_DETAILS,
					variables: {
						room_id: roomId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error fetching room details:', data.errors);
				return;
			}

			const room = data.data?.whatsub_rooms?.[0];
			if (room) {
				setRoomDetails(room);

				// Find current user's mapping in the room
				const userMapping = room.whatsub_room_user_mappings?.find((mapping: any) =>
					mapping.auth_fullname?.id === user?.id
				);
				setCurrentUserMapping(userMapping);

				// Check if admin hasn't read group info and show modal
				if (room.type === 'group' &&
					room.user_id === user?.id &&
					userMapping &&
					!userMapping.isGroupInfoRead) {
					setShowAdminGroupInfoModal(true);
				}
			}
		} catch (error) {
			console.error('Error fetching room details:', error);
		}
	};

	const handleGroupDetailsUpdated = (name: string, image: string) => {
		// Update selectedChat state
		setSelectedChat(prev => prev ? {
			...prev,
			name: name,
			room_dp: image
		} : null);

		// Also update roomDetails if it exists
		setRoomDetails(prev => prev ? {
			...prev,
			name: name,
			room_dp: image
		} : null);
	};

	const handleImageUpload = async (file: File) => {
		if (!user?.id || !user?.auth_token || !selectedChat) return;
		setIsUploadingImage(true);

		// Create loading message instead of optimistic image
		const loadingMessage: Message = {
			id: `loading-img-${Date.now()}`,
			message: 'Uploading image...',
			options: null,
			created_at: new Date().toISOString(),
			from_user_id: user.id,
			type: 'loading', // Special type for loading messages
			from_user_fullname: {
				fullname: user.fullname || 'You'
			},
			click_type: '',
			click_text: '',
			click_data: null,
			is_seen: true
		};

		// Add loading message
		setMessages(prev => [...prev, loadingMessage]);

		try {
			// Convert file to base64 data URL
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

			// Send image message with the base64 image data
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
						room_id: selectedChat.id,
						image: base64Image,
					}
				})
			});

			const data = await response.json();

			if (data.data?.whatsubSendImageAsMessage?.message) {
				fetchChats(false, true);
			} else {
				console.error('Unexpected response structure:', data);
				// Replace loading message with error message
				setMessages(prev => prev.map(msg =>
					msg.id === loadingMessage.id
						? { ...msg, message: 'Failed to upload image', type: 'error' }
						: msg
				));
			}
		} catch (error) {
			console.error('Error uploading image:', error);
			// Replace loading message with error message
			setMessages(prev => prev.map(msg =>
				msg.id === loadingMessage.id
					? { ...msg, message: 'Failed to upload image', type: 'error' }
					: msg
			));
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleWebSocketMessage = async (roomId: string) => {
		if (!user?.id || !user?.auth_token) return;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
					query getLatestMessages($room_id: uuid!, $limit: Int) {
						__typename
						whatsub_message(where: {room_id: {_eq: $room_id}}, order_by: {created_at: desc}, limit: $limit) {
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
						room_id: roomId,
						limit: 5
					}
				})
			});

			const data = await response.json();

			if (data.data?.whatsub_message) {
				const latestMessages = data.data.whatsub_message.reverse();

				setMessages(prev => {
					let updatedMessages = [...prev];

					latestMessages.forEach(newMessage => {
						let optimisticIndex = -1;

						if (newMessage.type === 'image') {
							// For image messages, look for loading messages or optimistic image messages
							optimisticIndex = updatedMessages.findIndex(msg =>
								(msg.id.startsWith('loading-img-') || msg.id.startsWith('temp-img-')) &&
								msg.from_user_id === newMessage.from_user_id &&
								Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 15000 // 15 seconds for image upload
							);
						} else {
							// For text messages, use the existing logic
							optimisticIndex = updatedMessages.findIndex(msg =>
								msg.id.startsWith('temp-') &&
								msg.message === newMessage.message &&
								msg.from_user_id === newMessage.from_user_id &&
								Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000
							);
						}

						if (optimisticIndex !== -1) {
							// Replace optimistic/loading message with real one
							updatedMessages[optimisticIndex] = {
								...newMessage,
								is_seen: true
							};
						} else {
							// Check if we already have this message (prevent duplicates)
							const existingMessage = updatedMessages.find(msg =>
								msg.id === newMessage.id ||
								(msg.message === newMessage.message &&
									msg.from_user_id === newMessage.from_user_id &&
									Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000)
							);

							if (!existingMessage) {
								// Only add if it's newer than our latest message
								const lastMessageTime = updatedMessages.length > 0 ?
									new Date(updatedMessages[updatedMessages.length - 1].created_at).getTime() : 0;

								if (new Date(newMessage.created_at).getTime() > lastMessageTime) {
									// Add new message
									updatedMessages.push({
										...newMessage,
										is_seen: true
									});
								}
							}
						}
					});

					return updatedMessages;
				});
			}
		} catch (error) {
			console.error('Error handling WebSocket message:', error);
		}
	};

	const handleSendMessage = async () => {
		if (!user?.id || !user?.auth_token || !selectedChat || !newMessage.trim()) return;

		const messageText = newMessage.trim();
		setIsSending(true);

		// Add optimistic message - show message immediately
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

		// Add message optimistically
		setMessages(prev => [...prev, optimisticMessage]);
		setNewMessage('');

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
						room_id: selectedChat.id
					}
				})
			});

			const data = await response.json();
			if (data.data?.sendMessage?.affected_rows > 0) {
				fetchChats(false, true);
			} else {
				// If send failed, remove the optimistic message
				setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
				setNewMessage(messageText); // Restore the message
			}
		} catch (error) {
			console.error('Error sending message:', error);
			// Remove optimistic message on error
			setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
			setNewMessage(messageText); // Restore the message
		} finally {
			setIsSending(false);
		}
	};

	const handleDeleteRoom = async () => {
		if (!user?.id || !user?.auth_token || !selectedChat) return;

		setIsDeletingRoom(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation2($room_id: uuid = "", $user_id: uuid = "") {
              __typename
              deletePrivateAnonymousRoom(request: {room_id: $room_id, user_id: $user_id}) {
                __typename
                message
              }
            }
          `,
					variables: {
						room_id: selectedChat.id,
						user_id: user.id
					}
				})
			});

			const data = await response.json();
			if (data.data?.deletePrivateAnonymousRoom?.message) {
				// Successfully deleted, refetch chats and clear selected chat
				setSelectedChat(null);
				await fetchChats(false, true);
			}
		} catch (error) {
			console.error('Error deleting room:', error);
		} finally {
			setIsDeletingRoom(false);
		}
	};

	// Also modify handleChatSelect to be simpler
	const handleChatSelect = (chat: ChatRoom) => {
		// Still prevent unnecessary re-selections
		if (selectedChat?.id === chat.id) {
			return;
		}

		setSelectedChat(chat);
		if (isMobile) {
			setSelectedChatOnMobile(chat.id);
		}

		// Fetch comprehensive room details
		fetchRoomDetails(chat.id);
	};

	const handleBackToChats = () => {
		if (isMobile) {
			setSelectedChatOnMobile(null);
			setSelectedChat(null);
			return;
		}
		setSelectedChat(null);
	};

	const handleGroupInfoMarkAsRead = () => {
		// Update local state and close modal
		setCurrentUserMapping(prev => ({ ...prev, isGroupInfoRead: true }));
		setShowAdminGroupInfoModal(false);
	};

	return (
		<div className="pt-20 md:pt-4">
			<div className="max-w-[2000px] mx-auto bg-dark-500 overflow-hidden">
				<div className={`${isMobile ? 'h-[90vh]' : 'grid grid-cols-12 h-[91vh]'}`}>
					{/* Chat List Component */}
					<ChatList
						chats={chats}
						selectedChat={selectedChat}
						onChatSelect={handleChatSelect}
						isLoading={isLoading}
						isConnected={isConnected}
						activeTab={activeTab}
						onTabChange={setActiveTab}
						isMobile={isMobile}
						selectedChatOnMobile={selectedChatOnMobile}
						onLoadMoreChats={loadMoreChats}
						hasMoreChats={hasMoreChats}
						isLoadingMoreChats={isLoadingMoreChats}
						CHATS_PER_PAGE={CHATS_PER_PAGE}
					/>

					{/* Message View Component */}
					<MessageView
						selectedChat={selectedChat}
						messages={messages}
						isLoadingMessages={isLoadingMessages}
						isConnected={isConnected}
						newMessage={newMessage}
						onNewMessageChange={setNewMessage}
						onSendMessage={handleSendMessage}
						isSending={isSending}
						onDeleteRoom={handleDeleteRoom}
						isDeletingRoom={isDeletingRoom}
						onBackToChats={handleBackToChats}
						isMobile={isMobile}
						selectedChatOnMobile={selectedChatOnMobile}
						userId={user?.id || ''}
						userFullname={user?.fullname || ''}
						hasUnreadMessages={hasUnreadMessages}
						firstUnreadMessageId={firstUnreadMessageId}
						onShowFriendInfo={() => setShowFriendInfoModal(true)}
						onShowGroupInfo={() => setShowGroupInfoModal(true)}
						userInfo={userInfo}
						userInfoLoading={userInfoLoading}
						roomDetails={roomDetails}
						onImageUpload={handleImageUpload}
						isUploadingImage={isUploadingImage}
						onLoadMoreMessages={loadMoreMessages}
						isLoadingMoreMessages={isLoadingMoreMessages}
						hasMoreMessages={hasMoreMessages}
						onScroll={handleScroll}
					/>
				</div>

				{/* Modals remain in the parent component */}
				{/* Group Info Modal */}
				<GroupInfoModal
					isOpen={showGroupInfoModal}
					onClose={() => setShowGroupInfoModal(false)}
					groupId={selectedChat?.id || ''}
					groupName={selectedChat?.name || ''}
					groupImage={selectedChat?.room_dp}
					onRefetchChats={fetchChats}
					onGroupDetailsUpdated={handleGroupDetailsUpdated}
				/>

				{/* Friend Profile Modal */}
				{showFriendInfoModal && (
					<FriendInfoModal
						friendId={selectedChat?.whatsub_room_user_mappings?.[0]?.user_id || ''}
						friendName={selectedChat?.whatsub_room_user_mappings?.[0]?.auth_fullname?.fullname || ''}
						userId={user?.id || ''}
						userAuthToken={user?.auth_token || ''}
						closeModal={() => setShowFriendInfoModal(false)}
						onGroupDetailsUpdated={handleGroupDetailsUpdated}
					/>
				)}

				{/* Admin Group Info Modal */}
				{showAdminGroupInfoModal && currentUserMapping && (
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
						<div className="bg-dark-500 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
							{/* Header */}
							<div className="p-6 border-b border-gray-700">
								<div className="flex items-center justify-between">
									<h3 className="text-xl font-bold text-white">Group Information</h3>
									<button
										onClick={() => setShowAdminGroupInfoModal(false)}
										className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
									>
										<X className="h-5 w-5" />
									</button>
								</div>
							</div>

							{/* Content */}
							<div className="p-6">
								<GroupInfoView
									currentUserMapping={currentUserMapping}
									onMarkAsRead={handleGroupInfoMarkAsRead}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

const ProtectedChatPage: React.FC = () => {
	return (
		<ProtectedRoute>	
			<ChatPage />
		</ProtectedRoute>
	);
};

export default ProtectedChatPage;