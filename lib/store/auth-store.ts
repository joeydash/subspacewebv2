"use client";

import { useSyncExternalStore } from 'react';

interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	phoneNumber: string;
	requestId: string | null;
	isLoading: boolean;
	error: string | null;
	setPhoneNumber: (phone: string) => void;
	setRequestId: (id: string) => void;
	login: (user: User) => void;
	logout: () => void;
	updateUser: (data: Partial<User>) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
}

interface User {
	id: string;
	phone: string;
	name?: string;
	email?: string;
	username?: string;
	dp?: string;
	auth_token?: string;
	fullname?: string;
	walletBalance?: number;
	locked_amount?: number;
	unlocked_amount?: number;
	kycStatus?: string;
	isBlocked?: boolean;
	blockedTitle?: string;
	blockedDetails?: string;
	isMarketRandomOn?: boolean;
	transactionChargesPercentage?: number;
	transactionChargesPrices?: number;
	mailPrefix?: string;

}

// Local storage key
const STORAGE_KEY = 'auth-storage';

// Helper function to get stored auth data
const getStoredAuthData = (): Partial<{ isAuthenticated: boolean; user: User | null; phoneNumber: string; requestId: string | null }> => {
	if (typeof window === 'undefined') return {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.state || {};
		}
	} catch (error) {
		console.error('Error reading auth storage:', error);
	}
	return {};
};

// Helper function to save auth data
const saveAuthData = (data: Partial<{ isAuthenticated: boolean; user: User | null; phoneNumber: string; requestId: string | null }>) => {
	if (typeof window === 'undefined') return;
	try {
		const existing = getStoredAuthData();
		const updated = { ...existing, ...data };
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: updated }));
	} catch (error) {
		console.error('Error saving auth storage:', error);
	}
};

// Function to fetch user profile data after authentication
export const fetchUserProfile = async (authToken: string) => {
	try {
		const response = await fetch('https://db.subspace.money/v1/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({
				query: `
          query MyQuery($lang: String = "", $version: Int = 10) {
            __typename
            wGetInfoV3(request: {lang: $lang, version: $version}) {
              __typename
              blockedDetails
              blockedTitle
              dp
              fullname
              internal_amount
              isBlocked
              isMarketRandomOn
              isWhatsappAuthOn
              kycStatus
              locked_amount
              mailPrefix
              paymentErrorMessage
              paymentGateway
              pgintentType
              poolFeature
              referAmount
              referPercentage
              sharedFee
              showCollectionSection
              transactionChargesPercentage
              transactionChargesPrices
              whatsappAuthLink
              walletMultiplier
              updateTitle
              walletBalance
              updateMinBuildNumber
              updateDetails
              unlocked_amount
              showSpinMachine
              showGames
              showQuizzes
            }
          }
        `,
				variables: {
					lang: 'en',
					version: 10,
				},
			}),
		});

		const data = await response.json();
		return data.data?.wGetInfoV3;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}
};

// State management using custom event system for reactivity
class AuthStore {
	private listeners: Set<() => void> = new Set();
	private state: {
		isAuthenticated: boolean;
		user: User | null;
		phoneNumber: string;
		requestId: string | null;
		isLoading: boolean;
		error: string | null;
	};
	private hasHydrated = false;

	constructor() {
		const stored = getStoredAuthData();
		this.state = {
			isAuthenticated: stored.isAuthenticated || false,
			user: stored.user || null,
			phoneNumber: stored.phoneNumber || '',
			requestId: stored.requestId || null,
			isLoading: false,
			error: null,
		};

		// Initialize rehydration
		this.rehydrate();
	}

	private async rehydrate() {
		if (this.hasHydrated) return;
		this.hasHydrated = true;

		const user = this.state.user;
		if (user?.auth_token) {
			try {
				// Fetch fresh profile after rehydration
				const profileData = await fetchUserProfile(user.auth_token);
				if (profileData) {
					this.updateUser({
						fullname: profileData.fullname,
						dp: profileData.dp,
						walletBalance: profileData.walletBalance,
						locked_amount: profileData.locked_amount,
						unlocked_amount: profileData.unlocked_amount,
						kycStatus: profileData.kycStatus,
						isBlocked: profileData.isBlocked,
						blockedTitle: profileData.blockedTitle,
						blockedDetails: profileData.blockedDetails,
						isMarketRandomOn: profileData?.isMarketRandomOn,
						transactionChargesPrices: profileData?.transactionChargesPrices,
						transactionChargesPercentage: profileData?.transactionChargesPercentage,
						mailPrefix: profileData?.mailPrefix
					});
				}
			} catch (err) {
				console.error('Error refreshing profile on rehydrate:', err);
			}
		}
	}

	getState = () => {
		return this.state;
	};

	subscribe = (listener: () => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	private notify() {
		this.listeners.forEach(listener => listener());
	}

	private updateState(newState: Partial<typeof this.state>, persist = true) {
		const hasChanges = Object.keys(newState).some(
			key => this.state[key as keyof typeof this.state] !== newState[key as keyof typeof newState]
		);

		if (!hasChanges) return;

		this.state = { ...this.state, ...newState };

		// Only persist auth-related state
		if (persist) {
			saveAuthData({
				isAuthenticated: this.state.isAuthenticated,
				user: this.state.user,
				phoneNumber: this.state.phoneNumber,
				requestId: this.state.requestId,
			});
		}

		this.notify();
	}

	setPhoneNumber = (phone: string) => {
		this.updateState({ phoneNumber: phone });
	};

	setRequestId = (id: string) => {
		this.updateState({ requestId: id });
	};

	login = (user: User) => {
		this.updateState({ isAuthenticated: true, user });
	};

	logout = () => {
		this.updateState({
			isAuthenticated: false,
			user: null,
			phoneNumber: '',
			requestId: null,
			isLoading: false,
			error: null,
		});

		if (typeof window !== 'undefined') {
			const keepKey = "address";
			const keepValue = localStorage.getItem(keepKey);
			localStorage.clear();

			if (keepValue !== null) {
				localStorage.setItem(keepKey, keepValue);
			}
		}
	};

	updateUser = (data: Partial<User>) => {
		if (this.state.user) {
			this.updateState({
				user: { ...this.state.user, ...data }
			});
		}
	};

	setLoading = (loading: boolean) => {
		this.updateState({ isLoading: loading }, false); // Don't persist loading state
	};

	setError = (error: string | null) => {
		this.updateState({ error }, false); // Don't persist error state
	};
}

// Create singleton store instance
const authStoreInstance = new AuthStore();

// ------------------- STORE -------------------
export const useAuthStore = (): AuthState => {
	const state = useSyncExternalStore(
		authStoreInstance.subscribe,
		authStoreInstance.getState,
		authStoreInstance.getState
	);

	return {
		...state,
		setPhoneNumber: authStoreInstance.setPhoneNumber,
		setRequestId: authStoreInstance.setRequestId,
		login: authStoreInstance.login,
		logout: authStoreInstance.logout,
		updateUser: authStoreInstance.updateUser,
		setLoading: authStoreInstance.setLoading,
		setError: authStoreInstance.setError,
	};
};

// Helper to get state outside of React components (for backward compatibility)
useAuthStore.getState = () => authStoreInstance.getState();

// ------------------- HELPERS -------------------


export const updateProfile = async () => {
	const { user } = authStoreInstance.getState();
	if (!user?.auth_token) return false;

	try {
		const response = await fetch('https://db.subspace.money/v1/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${user.auth_token}`
			},
			body: JSON.stringify({
				query: `
        mutation Mutate($user_id: uuid, $time: timestamptz) {
          __typename
          update_auth(
            where: { id: { _eq: $user_id } }
            _set: { last_active: $time }
          ) {
            __typename
            affected_rows
          }
        }
        `,
				variables: {
					user_id: user?.id,
					time: new Date().toISOString()
				},
			}),
		});

		const result = await response.json();
		return result.data?.update_auth?.affected_rows > 0;
	} catch (error) {
		console.error('Error updating profile:', error);
		return false;
	}
};

export const updateProfilePicture = async (userId: string, image: string) => {
	const { user } = authStoreInstance.getState();
	if (!user?.auth_token) return null;

	try {
		const response = await fetch('https://db.subspace.money/v1/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${user.auth_token}`
			},
			body: JSON.stringify({
				query: `
          mutation MyMutation($image: String = "", $user_id: String = "") {
            changeDp(request: {image: $image, user_id: $user_id}) {
              dp
            }
          }
        `,
				variables: {
					user_id: userId,
					image
				},
			}),
		});

		const result = await response.json();
		return result.data?.changeDp?.dp;
	} catch (error) {
		console.error('Error updating profile picture:', error);
		return null;
	}
};

export const fetchUserInfo = async (id: string) => {
	const { user } = authStoreInstance.getState();
	if (!user?.auth_token) return null;

	try {
		const response = await fetch('https://db.subspace.money/v1/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${user.auth_token}`
			},
			body: JSON.stringify({
				query: `
          query MyQuery($id: uuid = "") {
            auth(where: {id: {_eq: $id}}) {
              dp
              fullname
              email
              blurhash
              username
            }
          }
        `,
				variables: { id },
			}),
		});

		const result = await response.json();
		return result.data?.auth[0];
	} catch (error) {
		console.error('Error fetching user info:', error);
		return null;
	}
};

// Function to handle phone authentication
export const initiatePhoneAuth = async (phone: string) => {
	// Check if user is online
	if (typeof window !== 'undefined' && !navigator.onLine) {
		authStoreInstance.setError('No internet connection. Please check your network and try again.');
		return false;
	}

	authStoreInstance.setLoading(true);
	authStoreInstance.setError(null);

	try {
		const response = await fetch('https://db.subspace.money/v1/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: `
          mutation MyMutation($phone: String = "") {
            __typename
            register_without_password(credentials: {phone: $phone}) {
              __typename
              request_id
              type
            }
          }
        `,
				variables: {
					phone,
				},
			}),
		});

		const data = await response.json();

		if (data.errors) {
			authStoreInstance.setError(data.errors[0]?.message || 'Authentication failed');
			return false;
		}

		if (data.data?.register_without_password?.type === 'success') {
			authStoreInstance.setRequestId(data.data.register_without_password.request_id);
			authStoreInstance.setPhoneNumber(phone);
			return true;
		} else {
			authStoreInstance.setError('Authentication failed');
			return false;
		}
	} catch {
		authStoreInstance.setError('Network error. Please try again.');
		return false;
	} finally {
		authStoreInstance.setLoading(false);
	}
};

export const verifyOTP = async (phone: string, otp: string) => {
	const errorReturnValue = {
		success: false,
		id: null,
		auth_token: null,
		fullname: null
	};


	if (typeof window !== 'undefined' && !navigator.onLine) {
		authStoreInstance.setError('No internet connection. Please check your network and try again.');
		return errorReturnValue;
	}

	authStoreInstance.setLoading(true);
	authStoreInstance.setError(null);

	try {
		const response = await fetch('https://db.subspace.money/v1/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: `
          mutation MyMutation($phone: String = "", $otp: String = "", $ip_address: String = "", $device_id: String = "", $device_data: jsonb = "", $lang: String = "en", $version: Int = 0) {
            __typename
            verify_otp(request: {otp: $otp, phone: $phone, ip_address: $ip_address, device_id: $device_id, device_data: $device_data, lang: $lang, version: $version}) {
              __typename
              auth_token
              id
              type
              refresh_token
              deviceInfoSaved
            }
          }
        `,
				variables: {
					phone,
					otp,
					ip_address: "",
					device_id: "",
					device_data: {},
					lang: "en",
					version: 0
				},
			}),
		});

		const data = await response.json();

		if (data.errors) {
			authStoreInstance.setError(data.errors[0]?.message || 'Verification failed');
			return errorReturnValue;
		}

		if (data.data?.verify_otp?.type === 'success') {
			const { id, auth_token } = data.data.verify_otp;
			const profileData = await fetchUserProfile(auth_token);

			authStoreInstance.login({
				id,
				phone,
				auth_token,
				name: profileData?.fullname,
				fullname: profileData?.fullname,
				dp: profileData?.dp,
				walletBalance: profileData?.walletBalance,
				locked_amount: profileData?.locked_amount,
				unlocked_amount: profileData?.unlocked_amount,
				kycStatus: profileData?.kycStatus,
				isBlocked: profileData?.isBlocked,
				blockedTitle: profileData?.blockedTitle,
				blockedDetails: profileData?.blockedDetails,
				isMarketRandomOn: profileData?.isMarketRandomOn,
				transactionChargesPrices: profileData?.transactionChargesPrices,
				transactionChargesPercentage: profileData?.transactionChargesPercentage,
				mailPrefix: profileData?.mailPrefix
			});


			return errorReturnValue;
		} else {
			authStoreInstance.setError('Verification failed');
			return errorReturnValue;
		}
	} catch (e: unknown) {
		authStoreInstance.setError((e as Error).message || 'Network error. Please try again.');
		return errorReturnValue;
	} finally {
		authStoreInstance.setLoading(false);
	}
};