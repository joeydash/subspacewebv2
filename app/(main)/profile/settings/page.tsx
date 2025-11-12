'use client';

import React, { useState, useEffect } from 'react';
import { Check, Package, Bell, Globe, MessageSquare, Users, Plus, ChevronUp, ChevronDown, X, Trash2, LockKeyhole } from 'lucide-react';
import { useLanguageStore, languages } from '@/lib/store/language-store';
import QuickRepliesSkeleton from './quick-replies-skeleton';
import { useAuthStore } from '@/lib/store/auth-store';

const SettingsComponent: React.FC = () => {
	const { t } = useLanguageStore();
	const { user } = useAuthStore();
	const [step, setStep] = useState('');
	const { selectedLanguage, setLanguage, isChangingLanguage } = useLanguageStore();
	const [hidePhoneNumber, setHidePhoneNumber] = useState(false);
	const [hideEmailId, setHideEmailId] = useState(false);
	const [isLoadingPrivacySettings, setIsLoadingPrivacySettings] = useState(false);
	const [publicGroup, setPublicGroup] = useState(false);
	const [isLoadingPublicGroup, setIsLoadingPublicGroup] = useState(false);
	const [quickReplyData, setQuickReplyData] = useState({
		shortcut: '',
		message: ''
	});
	const [isSavingQuickReply, setIsSavingQuickReply] = useState(false);
	const [quickReplyError, setQuickReplyError] = useState<string | null>(null);
	const [quickReplySuccess, setQuickReplySuccess] = useState(false);
	const [showQuickReplyForm, setShowQuickReplyForm] = useState(false);
	const [quickReplies, setQuickReplies] = useState<Array<{ message: string, shortcut: string }>>([]);
	const [isLoadingQuickReplies, setIsLoadingQuickReplies] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [quickReplyToDelete, setQuickReplyToDelete] = useState<{ message: string, shortcut: string } | null>(null);
	const [isDeletingQuickReply, setIsDeletingQuickReply] = useState(false);

	// Shared subscriptions state
	const [subscriptions, setSubscriptions] = useState<Array<{
		id: string;
		service_name: string;
		service_image_url: string;
		blurhash: string;
		plan: string;
		is_public: boolean;
		whatsub_service: {
			whatsub_class: {
				name: string;
			};
		};
	}>>([]);
	const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
	const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);

	const fetchRooms = async (showLoading: bool) => {
		if (!user?.id || !user?.auth_token) return;

		if (showLoading) {
			setIsLoadingRooms(true);
		}

		setRoomsError(null);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query MyQuery($user_id: uuid, $limit: Int, $offset: Int) {
							__typename
							whatsub_rooms(
								where: {
									user_id: { _eq: $user_id }
									status: { _eq: "active" }
									type: { _eq: "group" }
								}
								order_by: { created_at: desc }
								limit: $limit
								offset: $offset
							) {
								__typename
								id
								status
								is_public
								name
								room_dp
								blurhash
							}
						}
					`,
					variables: {
						user_id: user.id,
						limit: 50,
						offset: 0
					}
				})
			});

			const data = await response.json();

			console.log('shared subscription settings rooms ', data);

			if (data.errors) {
				console.error('Error fetching rooms:', data.errors);
				setRoomsError('Failed to load subscription groups');
				return;
			}

			setRooms(data.data?.whatsub_rooms || []);
		} catch (error) {
			console.error('Error fetching rooms:', error);
			setRoomsError('Failed to load subscription groups');
		} finally {
			if (showLoading) {
				setIsLoadingRooms(false);
			}
		}
	};

	const handleRoomToggle = async (roomId: string, currentIsPublic: boolean) => {
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
						mutation MyMutation($room_id: uuid = "", $is_public: Boolean = true) {
							__typename
							update_whatsub_rooms(
								where: { id: { _eq: $room_id } }
								_set: { is_public: $is_public }
							) {
								__typename
								affected_rows
							}
						}
					`,
					variables: {
						room_id: roomId,
						is_public: !currentIsPublic
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error updating room public status:', data.errors);
				return;
			}

			if (data.data?.update_whatsub_rooms?.affected_rows > 0) {
				// Update local state
				setRooms(prevRooms =>
					prevRooms.map(room =>
						room.id === roomId
							? { ...room, is_public: !currentIsPublic }
							: room
					)
				);
			}
		} catch (error) {
			console.error('Error updating room public status:', error);
		}
	};

	const fetchSubscriptions = async (showLoading: boolean = true) => {
		if (!user?.id || !user?.auth_token) return;

		if (showLoading) {
			setIsLoadingSubscriptions(true);
		}

		setSubscriptionsError(null);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query checkLimit($user_id: uuid, $limit: Int, $offset: Int) {
							__typename
							whatsub_users_subscription(
								where: {
									user_id: { _eq: $user_id }
									status: { _eq: "active" }
								}
								order_by: { created_at: desc }
								limit: $limit
								offset: $offset
							) {
								__typename
								id
								service_name
								service_image_url
								blurhash
								plan
								is_public
								whatsub_service {
									__typename
									whatsub_class {
										__typename
										name
									}
								}
							}
						}
					`,
					variables: {
						user_id: user.id,
						limit: 50,
						offset: 0
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error fetching subscriptions:', data.errors);
				setSubscriptionsError('Failed to load subscriptions');
				return;
			}

			setSubscriptions(data.data?.whatsub_users_subscription || []);
		} catch (error) {
			console.error('Error fetching subscriptions:', error);
			setSubscriptionsError('Failed to load subscriptions');
		} finally {
			if (showLoading) {
				setIsLoadingSubscriptions(false);
			}
		}
	};

	const handleSubscriptionToggle = async (subscriptionId: string, currentIsPublic: boolean) => {
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
						mutation Mutation($sub_id: uuid, $is_public: Boolean) {
							__typename
							update_whatsub_users_subscription(
								where: { id: { _eq: $sub_id } }
								_set: { is_public: $is_public }
							) {
								__typename
								affected_rows
							}
						}
					`,
					variables: {
						sub_id: subscriptionId,
						is_public: !currentIsPublic
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error updating subscription public status:', data.errors);
				return;
			}

			if (data.data?.update_whatsub_users_subscription?.affected_rows > 0) {
				// Update local state
				setSubscriptions(prevSubscriptions =>
					prevSubscriptions.map(subscription =>
						subscription.id === subscriptionId
							? { ...subscription, is_public: !currentIsPublic }
							: subscription
					)
				);
			}
		} catch (error) {
			console.error('Error updating subscription public status:', error);
		}
	};

	// Rooms state
	const [rooms, setRooms] = useState<Array<{
		id: string;
		status: string;
		is_public: boolean;
		name: string;
		room_dp: string;
		blurhash: string;
	}>>([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const [roomsError, setRoomsError] = useState<string | null>(null);

	const handleDeleteQuickReply = async () => {
		if (!quickReplyToDelete || !user?.id || !user?.auth_token) return;

		setIsDeletingQuickReply(true);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						mutation deleteQuickReply($user_id: uuid, $shortcut: String) {
							__typename
							delete_whatsub_quick_reply(where: {user_id: {_eq: $user_id}, shortcut: {_eq: $shortcut}}) {
								__typename
								affected_rows
							}
						}
					`,
					variables: {
						user_id: user.id,
						shortcut: quickReplyToDelete.shortcut
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error deleting quick reply:', data.errors);
				return;
			}

			if (data.data?.delete_whatsub_quick_reply?.affected_rows > 0) {
				// Successfully deleted, refresh the list
				fetchQuickReplies();
				closeDeleteConfirmation();
			}
		} catch (error) {
			console.error('Error deleting quick reply:', error);
		} finally {
			setIsDeletingQuickReply(false);
		}
	};

	const closeDeleteConfirmation = () => {
		setShowDeleteConfirmation(false);
		setQuickReplyToDelete(null);
	};

	const [notificationSettings, setNotificationSettings] = useState({
		message: false,
		subscription_expiry: false,
		coupon_expiry: false,
		promotional: false
	});
	const [isLoadingNotificationSettings, setIsLoadingNotificationSettings] = useState(false);

	const handleLanguageChange = (languageCode: string) => {
		if (languageCode !== selectedLanguage && !isChangingLanguage) {
			setLanguage(languageCode);
			setStep(''); // Go back to main settings after language change
		}
	};

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchPrivacySettings();
			fetchPublicGroupSettings();
			fetchNotificationSettings();
			fetchRooms(true);
			fetchSubscriptions(true);
		}
	}, [user?.id, user?.auth_token]);

	const fetchPublicGroupSettings = async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoadingPublicGroup(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query Query($user_id: uuid) {
							__typename
							whatsub_store_public_groups(where: {user_id: {_eq: $user_id}}) {
								__typename
								is_public
							}
						}
					`,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();


			if (data.data?.whatsub_store_public_groups?.[0]) {
				const settings = data.data.whatsub_store_public_groups[0];
				setPublicGroup(settings.is_public || false);
			}
		} catch (error) {
			console.error('Error fetching public group settings:', error);
		} finally {
			setIsLoadingPublicGroup(false);
		}
	};

	const fetchPrivacySettings = async () => {
		if (!user?.id || !user?.auth_token) return;


		setIsLoadingPrivacySettings(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query Query($user_id: uuid) {
              __typename
              whatsub_privacy_settings(where: {user_id: {_eq: $user_id}}) {
                __typename
                hide_phone_number
                hide_email_id
              }
            }
          `,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.data?.whatsub_privacy_settings?.[0]) {
				const settings = data.data.whatsub_privacy_settings[0];
				setHidePhoneNumber(settings.hide_phone_number || false);
				setHideEmailId(settings.hide_email_id || false);
			}
		} catch (error) {
			console.error('Error fetching privacy settings:', error);
		} finally {
			setIsLoadingPrivacySettings(false);
		}
	};

	const fetchNotificationSettings = async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoadingNotificationSettings(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query Query2($user_id: uuid) {
							__typename
							whatsub_notification_settings(where: {user_id: {_eq: $user_id}}) {
								__typename
								message
								coupon_expiry
								subscription_expiry
								promotional
							}
						}
					`,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.data?.whatsub_notification_settings?.[0]) {
				const settings = data.data.whatsub_notification_settings[0];
				setNotificationSettings({
					message: settings.message || false,
					subscription_expiry: settings.subscription_expiry || false,
					coupon_expiry: settings.coupon_expiry || false,
					promotional: settings.promotional || false
				});
			}
		} catch (error) {
			console.error('Error fetching notification settings:', error);
		} finally {
			setIsLoadingNotificationSettings(false);
		}
	};

	const updatePrivacySetting = async (setting: 'hide_phone_number' | 'hide_email_id', value: boolean) => {
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
            mutation UpdatePrivacySettings($user_id: uuid!, $hide_phone_number: Boolean, $hide_email_id: Boolean) {
              __typename
              insert_whatsub_privacy_settings(
                objects: {
                  user_id: $user_id, 
                  hide_phone_number: $hide_phone_number, 
                  hide_email_id: $hide_email_id
                },
                on_conflict: {
                  constraint: whatsub_privacy_settings_user_id_key,
                  update_columns: [hide_phone_number, hide_email_id]
                }
              ) {
                __typename
                affected_rows
              }
            }
          `,
					variables: {
						user_id: user.id,
						hide_phone_number: setting === 'hide_phone_number' ? value : hidePhoneNumber,
						hide_email_id: setting === 'hide_email_id' ? value : hideEmailId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error updating privacy settings:', data.errors);
				// Revert the toggle if update failed
				if (setting === 'hide_phone_number') {
					setHidePhoneNumber(!value);
				} else {
					setHideEmailId(!value);
				}
			}
		} catch (error) {
			console.error('Error updating privacy settings:', error);
			// Revert the toggle if update failed
			if (setting === 'hide_phone_number') {
				setHidePhoneNumber(!value);
			} else {
				setHideEmailId(!value);
			}
		}
	};

	const handlePhoneNumberToggle = () => {
		const newValue = !hidePhoneNumber;
		setHidePhoneNumber(newValue);
		updatePrivacySetting('hide_phone_number', newValue);
	};

	const handleEmailToggle = () => {
		const newValue = !hideEmailId;
		setHideEmailId(newValue);
		updatePrivacySetting('hide_email_id', newValue);
	};

	const handleSharedSubscriptionToggle = () => {
		const newValue = !publicGroup;
		setPublicGroup(newValue);
		updatePublicGroupSetting(newValue);
	};

	const handleNotificationSettingsToggle = (newSettings) => {
		setNotificationSettings(newSettings);
		updateNotificationSettings(newSettings);
	}

	const updateNotificationSettings = async (settings: typeof notificationSettings) => {
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
						mutation Mutation1($user_id: uuid, $message: Boolean, $coupon_expiry: Boolean, $promotional: Boolean, $subscription_expiry: Boolean) {
							__typename
							insert_whatsub_notification_settings(objects: {user_id: $user_id, message: $message, coupon_expiry: $coupon_expiry, promotional: $promotional, subscription_expiry: $subscription_expiry}, on_conflict: {constraint: whatsub_notification_settings_user_id_key, update_columns: [message, coupon_expiry, promotional, subscription_expiry]}) {
								__typename
								affected_rows
							}
						}
					`,
					variables: {
						user_id: user.id,
						message: settings.message,
						coupon_expiry: settings.coupon_expiry,
						promotional: settings.promotional,
						subscription_expiry: settings.subscription_expiry
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error updating notification settings:', data.errors);
				// Revert the settings if update failed
				fetchNotificationSettings();
			}
		} catch (error) {
			console.error('Error updating notification settings:', error);
			// Revert the settings if update failed
			fetchNotificationSettings();
		}
	};

	const updatePublicGroupSetting = async (value: boolean) => {
		if (!user?.id || !user?.auth_token) return;

		try {
			if (value) {
				// Use the unpublic mutation when setting to off
				const response = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${user.auth_token}`
					},
					body: JSON.stringify({
						query: `
							mutation publicAllGroups($user_id: uuid!) {
								__typename
								w_publicAllGroups(request: {user_id: $user_id}) {
									__typename
									affected_rows
								}
							}
						`,
						variables: {
							user_id: user.id
						}
					})
				});

				const data = await response.json();


				if (data.errors) {
					console.error('Error updating public group settings:', data.errors);
					// Revert the toggle if update failed
					setPublicGroup(!value);
				} else {
					// Refetch rooms to get updated public status
					fetchRooms(false);
				}
			} else {
				// Use the public mutation when setting to on
				const response = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${user.auth_token}`
					},
					body: JSON.stringify({
						query: `
							mutation publicAllGroups($user_id: uuid!) {
								__typename
								w_unpublicAllGroups(request: {user_id: $user_id}) {
									__typename
									affected_rows
								}
							}
						`,
						variables: {
							user_id: user.id
						}
					})
				});

				const data = await response.json();
				if (data.errors) {
					console.error('Error updating public group settings:', data.errors);
					// Revert the toggle if update failed
					setPublicGroup(!value);
				} else {
					// Refetch rooms to get updated public status
					fetchRooms(false);
				}
			}
		} catch (error) {
			console.error('Error updating public group settings:', error);
			// Revert the toggle if update failed
			setPublicGroup(!value);
		}
	};

	const handleQuickReplyInputChange = (field: 'shortcut' | 'message', value: string) => {
		setQuickReplyData(prev => ({
			...prev,
			[field]: value
		}));
		// Clear any previous errors when user starts typing
		if (quickReplyError) {
			setQuickReplyError(null);
		}
		if (quickReplySuccess) {
			setQuickReplySuccess(false);
		}
	};

	const handleSaveQuickReply = async () => {
		if (!user?.id || !user?.auth_token) return;

		// Validation
		if (!quickReplyData.shortcut.trim()) {
			setQuickReplyError('Shortcut is required');
			return;
		}
		if (!quickReplyData.message.trim()) {
			setQuickReplyError('Reply message is required');
			return;
		}

		setIsSavingQuickReply(true);
		setQuickReplyError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						mutation addQuickReply($user_id: uuid, $message: String, $shortcut: String) {
							__typename
							insert_whatsub_quick_reply_one(object: {user_id: $user_id, message: $message, shortcut: $shortcut}, on_conflict: {constraint: whatsub_quick_reply_user_id_shortcut_key, update_columns: [message]}) {
								__typename
								user_id
							}
						}
					`,
					variables: {
						user_id: user.id,
						message: quickReplyData.message.trim(),
						shortcut: quickReplyData.shortcut.trim()
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setQuickReplyError(data.errors[0]?.message || 'Failed to save quick reply');
				return;
			}

			if (data.data?.insert_whatsub_quick_reply_one?.user_id) {
				setQuickReplySuccess(true);
				// Clear the form after successful save
				setQuickReplyData({
					shortcut: '',
					message: ''
				});
				// Refresh the quick replies list
				fetchQuickReplies();
				// Hide success message after 3 seconds
				setTimeout(() => {
					setQuickReplySuccess(false);
				}, 3000);
			} else {
				setQuickReplyError('Failed to save quick reply');
			}
		} catch (error) {
			console.error('Error saving quick reply:', error);
			setQuickReplyError('Failed to save quick reply');
		} finally {
			setIsSavingQuickReply(false);
		}
	};

	const fetchQuickReplies = async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoadingQuickReplies(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query getQuickReply($user_id: uuid) {
							__typename
							whatsub_quick_reply(where: {user_id: {_eq: $user_id}}) {
								__typename
								message
								shortcut
							}
						}
					`,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error fetching quick replies:', data.errors);
				return;
			}

			setQuickReplies(data.data?.whatsub_quick_reply || []);
		} catch (error) {
			console.error('Error fetching quick replies:', error);
		} finally {
			setIsLoadingQuickReplies(false);
		}
	};
	return (
		<div>
			<h2 className="text-xl md:text-2xl font-bold mb-6">Settings</h2>
			<div className="space-y-4">
				<button
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
					onClick={() => {
						if (step == 'privacy-settings') {
							setStep('');
						} else {
							setStep('privacy-settings');
						}
					}}
				>
					<div className="flex items-center gap-3">
						<LockKeyhole className="h-5 w-5 text-gray-400 group-hover:text-white" />
						<span className="font-medium">Privacy Settings</span>
					</div>
					{step === 'privacy-settings' ? (
						<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
					) : (
						<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
					)}
				</button>
				{step == 'privacy-settings' && (
					<div>
						{isLoadingPrivacySettings ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
								<p className="text-gray-400 mt-2">Loading privacy settings...</p>
							</div>
						) : (
							<div className="space-y-6">
								{/* Hide Phone Number */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<h4 className="font-medium text-white text-base">Hide Phone Number</h4>
										<button
											onClick={handlePhoneNumberToggle}
											className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${hidePhoneNumber ? 'bg-indigo-600' : 'bg-gray-600'}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hidePhoneNumber ? 'translate-x-6' : 'translate-x-1'}`}
											/>
										</button>
									</div>
									<p className="text-sm text-gray-400">When enabled, your phone number is hidden from others.</p>
								</div>

								{/* Hide Email Id */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<h4 className="font-medium text-white text-base">Hide Email Id</h4>
										<button
											onClick={handleEmailToggle}
											className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${hideEmailId ? 'bg-indigo-600' : 'bg-gray-600'}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideEmailId ? 'translate-x-6' : 'translate-x-1'}`}
											/>
										</button>
									</div>
									<p className="text-sm text-gray-400">When enabled, your email is hidden from others.</p>
								</div>
							</div>
						)}
					</div>
				)}
				<button
					onClick={() => {
						if (step == 'shared-subscription-settings') {
							setStep('')
						} else {
							setStep('shared-subscription-settings')
						}
					}}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
				>
					<div className="flex items-center gap-3">
						<Package className="h-5 w-5 text-gray-400 group-hover:text-white" />
						<span className="font-medium">Shared Subscriptions Settings</span>
					</div>
					{step === 'shared-subscription-settings' ? (
						<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
					) : (
						<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
					)}
				</button>
				{step == 'shared-subscription-settings' && (
					isLoadingPublicGroup || isLoadingRooms ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
							<p className="text-gray-400 mt-2">Loading settings...</p>
						</div>
					) : (
						<div className="space-y-6">
							{/* Global Public Group Toggle */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h4 className="font-medium text-white text-base">Toggle All Groups Once</h4>
									<button
										onClick={handleSharedSubscriptionToggle}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${publicGroup ? 'bg-indigo-600' : 'bg-gray-600'}`}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${publicGroup ? 'translate-x-6' : 'translate-x-1'}`}
										/>
									</button>
								</div>
								<p className="text-sm text-gray-400 mt-3">
									Groups with toggle 'ON' are public and will be shown in the marketplace. Private groups are only visible to members.
								</p>
							</div>

							{/* Individual Rooms */}
							<div>
								<h4 className="font-medium text-white text-base mb-4 flex items-center gap-2">
									<Users className="h-5 w-5 text-indigo-400" />
									Your Subscription Groups ({rooms.length})
								</h4>

								{roomsError ? (
									<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
										<p className="text-red-400 text-sm">{roomsError}</p>
									</div>
								) : rooms.length === 0 ? (
									<div className="bg-dark-400 rounded-lg p-6 text-center">
										<Users className="h-8 w-8 text-gray-500 mx-auto mb-2" />
										<p className="text-gray-400 text-sm">No subscription groups found</p>
									</div>
								) : (
									<div className="bg-dark-400 rounded-lg p-4 max-h-80 overflow-y-scroll hide-scrollbar">
										<div className="space-y-3">
											{rooms.map((room) => (
												<div key={room.id} className="flex items-center gap-3 p-4 bg-dark-500 rounded-lg">
													<div className="flex items-center gap-3 flex-1 min-w-0">
														<div className="w-12 h-12 rounded-lg overflow-hidden bg-white p-1 flex-shrink-0">
															<img
																src={room.room_dp}
																alt={room.name}
																className="w-full h-full object-contain"
															/>
														</div>
														<div className="flex-1 min-w-0 overflow-hidden">
															<h5 className="font-medium text-white text-sm sm:text-base truncate leading-tight">{room.name}</h5>
															<p className="text-xs sm:text-sm text-gray-400 capitalize truncate">{room.status}</p>
														</div>
													</div>
													<div className="flex-shrink-0 ml-2">
														<button
															onClick={() => handleRoomToggle(room.id, room.is_public)}
															className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${room.is_public ? 'bg-indigo-600' : 'bg-gray-600'}`}
														>
															<span
																className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${room.is_public ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`}
															/>
														</button>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)
				)}
				<button
					onClick={() => {
						if (step === 'shared-subscriptions') {
							setStep('');
						} else {
							setStep('shared-subscriptions');
						}
					}}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
				>
					<div className="flex items-center gap-3">
						<Package className="h-5 w-5 text-gray-400 group-hover:text-white" />
						<span className="font-medium">{t('explore.sharedSubscriptions')}</span>
					</div>
					{step === 'shared-subscriptions' ? (
						<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
					) : (
						<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
					)}
				</button>
				{step === 'shared-subscriptions' && (
					<div className="bg-dark-400 rounded-lg p-6">
						<div className="mb-4">
							<p className="text-sm text-gray-400">
								Subscriptions with toggle 'ON' are public, switch toggle to 'OFF' to private. Private subscriptions will not be shown to your friends.
							</p>
						</div>

						{isLoadingSubscriptions ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
								<p className="text-gray-400 mt-2">Loading subscriptions...</p>
							</div>
						) : subscriptionsError ? (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
								<p className="text-red-400 text-sm">{subscriptionsError}</p>
							</div>
						) : subscriptions.length === 0 ? (
							<div className="bg-dark-500 rounded-lg p-6 text-center">
								<Package className="h-8 w-8 text-gray-500 mx-auto mb-2" />
								<p className="text-gray-400 text-sm">No active subscriptions found</p>
							</div>
						) : (
							<div className="max-h-80 overflow-y-auto hide-scrollbar pr-2">
								<div className="space-y-3">
									{subscriptions.map((subscription) => (
										<div key={subscription.id} className="flex items-center gap-3 p-4 bg-dark-500 rounded-lg">
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<div className="w-12 h-12 rounded-lg overflow-hidden bg-white p-1 flex-shrink-0">
													<img
														src={subscription.service_image_url}
														alt={subscription.service_name}
														className="w-full h-full object-contain"
													/>
												</div>
												<div className="flex-1 min-w-0 overflow-hidden">
													<h5 className="font-medium text-white text-sm sm:text-base truncate leading-tight">{subscription.service_name}</h5>
													<p className="text-xs sm:text-sm text-gray-400 truncate">{subscription.plan}</p>
												</div>
											</div>
											<div className="flex-shrink-0 ml-2">
												<button
													onClick={() => handleSubscriptionToggle(subscription.id, subscription.is_public)}
													className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${subscription.is_public ? 'bg-indigo-600' : 'bg-gray-600'}`}
												>
													<span
														className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${subscription.is_public ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`}
													/>
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				<button
					onClick={() => {
						if (step == 'notification-screen') {
							setStep('');
						} else {
							setStep('notification-screen');
						}
					}}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
				>
					<div className="flex items-center gap-3">
						<Bell className="h-5 w-5 text-gray-400 group-hover:text-white" />
						<span className="font-medium">Notification Screen</span>
					</div>
					{step === 'notification-screen' ? (
						<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
					) : (
						<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
					)}
				</button>
				{step == 'notification-screen' && (
					isLoadingNotificationSettings ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
							<p className="text-gray-400 mt-2">Loading notification settings...</p>
						</div>
					) : (
						<div className='space-y-6'>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h4 className="font-medium text-white text-base">Message Notification</h4>
									<button
										onClick={() => {
											const newSettings = {
												...notificationSettings,
												message: !notificationSettings.message
											}

											handleNotificationSettingsToggle(newSettings)
										}}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings.message ? 'bg-indigo-600' : 'bg-gray-600'}`}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.message ? 'translate-x-6' : 'translate-x-1'}`}
										/>
									</button>
								</div>
								<p className="text-sm text-gray-400">When turned off, you won't receive any message notification.</p>
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h4 className="font-medium text-white text-base">Subscription Expiry Notification</h4>
									<button
										onClick={() => {
											const newSettings = {
												...notificationSettings,
												subscription_expiry: !notificationSettings.subscription_expiry
											}

											handleNotificationSettingsToggle(newSettings)
										}}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings.subscription_expiry ? 'bg-indigo-600' : 'bg-gray-600'}`}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.subscription_expiry ? 'translate-x-6' : 'translate-x-1'}`}
										/>
									</button>
								</div>
								<p className="text-sm text-gray-400">When turned off, you won't receive any subscription expiry notification.</p>
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h4 className="font-medium text-white text-base">Coupon Expiry Notification</h4>
									<button
										onClick={() => {
											const newSettings = {
												...notificationSettings,
												coupon_expiry: !notificationSettings.coupon_expiry
											}

											handleNotificationSettingsToggle(newSettings)
										}}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings.coupon_expiry ? 'bg-indigo-600' : 'bg-gray-600'}`}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.coupon_expiry ? 'translate-x-6' : 'translate-x-1'}`}
										/>
									</button>
								</div>
								<p className="text-sm text-gray-400">When turned off, you won't receive any coupon expiry notification.</p>
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h4 className="font-medium text-white text-base">Promotional Notification</h4>
									<button
										onClick={() => {
											const newSettings = {
												...notificationSettings,
												promotional: !notificationSettings.promotional
											}

											handleNotificationSettingsToggle(newSettings)
										}}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings.promotional ? 'bg-indigo-600' : 'bg-gray-600'}`}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.promotional ? 'translate-x-6' : 'translate-x-1'}`}
										/>
									</button>
								</div>
								<p className="text-sm text-gray-400">When turned off, you won't receive any promotional notification.</p>
							</div>
						</div>
					)
				)}

				<button
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
					onClick={() => {
						if (step === 'quick-reply') {
							setStep('');
						} else {
							setStep('quick-reply');
							fetchQuickReplies();
						}
					}}
				>
					<div className="flex items-center gap-3">
						<MessageSquare className="h-5 w-5 text-gray-400 group-hover:text-white" />
						<span className="font-medium">Quick Reply</span>
					</div>
					{step === 'quick-reply' ? (
						<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
					) : (
						<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
					)}
				</button>
				{step === 'quick-reply' && (
					<div className="bg-dark-400 rounded-lg p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-base font-bold text-white">Add Quick Reply</h3>
							<button
								onClick={() => {
									setShowQuickReplyForm(!showQuickReplyForm);
									if (!showQuickReplyForm) {
										// Clear form when opening
										setQuickReplyData({ shortcut: '', message: '' });
										setQuickReplyError(null);
										setQuickReplySuccess(false);
									}
								}}
								className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
							>
								{showQuickReplyForm ? (
									<X className="h-5 w-5 text-white" />
								) : (
									<Plus className="h-5 w-5 text-white" />
								)}
							</button>
						</div>

						{/* Existing Quick Replies List */}
						{!showQuickReplyForm && (
							<div className="mb-6">
								{isLoadingQuickReplies ? (
									<QuickRepliesSkeleton count={4} />
								) : quickReplies.length === 0 ? (
									<div className="text-center py-8 text-gray-400">
										<MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No quick replies yet. Click + to add your first one!</p>
									</div>
								) : (
									<div className="space-y-3 max-h-[500px] overflow-y-scroll hide-scrollbar">
										{quickReplies.map((reply, index) => (
											<div key={index} className="bg-dark-500 rounded-lg p-4 border border-gray-600">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-2">
															<span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-sm font-medium">
																{reply.shortcut}
															</span>
														</div>
														<p className="text-gray-300 text-sm leading-relaxed">
															{reply.message}
														</p>
													</div>
													<button
														onClick={() => {
															setQuickReplyToDelete(reply);
															setShowDeleteConfirmation(true);
														}}
														className="ml-2 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{showQuickReplyForm && (
							<div className="space-y-6">
								{/* Shortcut Input */}
								<div>
									<label className="block text-white font-medium mb-2 text-sm">Shortcut</label>
									<input
										type="text"
										value={quickReplyData.shortcut}
										onChange={(e) => handleQuickReplyInputChange('shortcut', e.target.value)}
										placeholder="A word that will quickly retrieve this reply"
										className="w-full bg-dark-500 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									/>
								</div>

								{/* Reply Message Input */}
								<div>
									<label className="block text-white font-medium mb-2 text-sm">Reply Message</label>
									<textarea
										value={quickReplyData.message}
										onChange={(e) => handleQuickReplyInputChange('message', e.target.value)}
										placeholder="Enter text or select media"
										rows={4}
										className="w-full bg-dark-500 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
									/>
								</div>

								{/* Error Message */}
								{quickReplyError && (
									<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
										<p className="text-red-400 text-sm">{quickReplyError}</p>
									</div>
								)}

								{/* Success Message */}
								{quickReplySuccess && (
									<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
										<p className="text-green-400 text-sm">Quick reply saved successfully!</p>
									</div>
								)}

								{/* Save Button */}
								<div className="flex justify-end">
									<button
										onClick={handleSaveQuickReply}
										disabled={isSavingQuickReply || !quickReplyData.shortcut.trim() || !quickReplyData.message.trim()}
										className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
									>
										{isSavingQuickReply && (
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
										)}
										{isSavingQuickReply ? 'Saving...' : 'Save'}
									</button>
								</div>
							</div>
						)}
					</div>
				)}

				<button
					onClick={() => {
						if (step == 'language-selection') {
							setStep('');
						} else {
							setStep('language-selection');
						}
					}}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group">
					<div className="flex items-center gap-3">
						<Globe className="h-5 w-5 text-gray-400 group-hover:text-white" />
						<span className="font-medium">{t('nav.language')}</span>
					</div>
					{step === 'language-selection' ? (
						<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
					) : (
						<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
					)}
				</button>
				{step === 'language-selection' && (
					<div className="bg-dark-400 rounded-lg p-4">
						{/* Header */}
						<div className="flex items-center gap-3 mb-6">
							<h3 className="text-base font-bold text-white">Change Language</h3>
						</div>

						{/* Language List */}
						<div className="space-y-2 max-h-64 overflow-y-auto hide-scrollbar">
							{Object.entries(languages).map(([code, language]) => (
								<button
									key={code}
									onClick={() => handleLanguageChange(code)}
									disabled={isChangingLanguage}
									className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${selectedLanguage === code
										? 'bg-indigo-500 text-white'
										: 'bg-dark-500 text-gray-300 hover:bg-dark-300 hover:text-white'
										} ${isChangingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
								>
									{/* Language Code Circle */}
									<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedLanguage === code
										? 'bg-white text-indigo-500'
										: 'bg-indigo-500 text-white'
										}`}>
										{code.toUpperCase()}
									</div>

									{/* Language Name */}
									<div className="flex-1 text-left">
										<div className="font-medium text-base">{language.nativeName}</div>
									</div>

									{/* Check Icon for Selected Language */}
									{selectedLanguage === code && (
										<div className="flex items-center">
											{isChangingLanguage ? (
												<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
											) : (
												<Check className="h-5 w-5 text-white" />
											)}
										</div>
									)}
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirmation && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-dark-500 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-gray-700">
							<h3 className="text-xl font-bold text-white">Delete Quick Reply</h3>
							<button
								onClick={closeDeleteConfirmation}
								className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Content */}
						<div className="p-6">
							<div className="mb-6">
								<p className="text-gray-300 mb-4">
									Are you sure you want to delete this quick reply?
								</p>
								{quickReplyToDelete && (
									<div className="bg-dark-400 rounded-lg p-4 border border-gray-600">
										<div className="flex items-center gap-2 mb-2">
											<span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-sm font-medium">
												{quickReplyToDelete.shortcut}
											</span>
										</div>
										<p className="text-gray-300 text-sm">
											{quickReplyToDelete.message}
										</p>
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={closeDeleteConfirmation}
									disabled={isDeletingQuickReply}
									className="flex-1 px-4 py-2 bg-dark-400 hover:bg-dark-300 disabled:bg-gray-600 text-white rounded-lg transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleDeleteQuickReply}
									disabled={isDeletingQuickReply}
									className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									{isDeletingQuickReply ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
											Deleting...
										</>
									) : (
										<>
											<Trash2 className="h-4 w-4" />
											Delete
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SettingsComponent;