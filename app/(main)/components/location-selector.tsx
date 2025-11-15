import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, X, Edit, Trash2, Search, Navigation } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'react-hot-toast';
import AddAddressModal from '@/components/add-address-modal';
import { useCurrentLocation } from '@/lib/context/location-context';

interface SavedAddress {
	id: string;
	type: 'home' | 'work' | 'hotel' | 'other';
	name: string;
	full_address: string;
	contact_number: string;
	latitude: string;
	longitude: string;
	fhb_name: string;
	floor?: string;
	nearby_landmark?: string;
	toSave?: boolean;
}

interface LocationSelectorProps {
	onLocationChange?: (address: SavedAddress | null) => void;
	onAddAddress?: () => void;
	onEditAddress?: (address: SavedAddress) => void;
	setShowLogin: () => void;
}

const GET_ADDRESSES_QUERY = `
  query GetAddresses($user_id: uuid!) {
    whatsub_addresses(
      where: { user_id: { _eq: $user_id } }
      order_by: { created_at: desc }
    ) {
      id
      name
      full_address
      contact_number
      type
      latitude
      longitude
      fhb_name
      floor
      nearby_landmark
      created_at
      updated_at
    }
  }
`;

const DELETE_ADDRESS_MUTATION = `
  mutation DeleteAddress($id: uuid!) {
    delete_whatsub_addresses_by_pk(id: $id) {
      id
    }
  }
`;

/* ---------- Google Maps API functions ---------- */
async function getAddressSuggestionsAPI(query: string) {
	if (!query) return [];
	try {
		const res = await fetch('/api/getAddressSuggestions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ input: { request: { textQuery: query } } })
		});
		const json = await res.json();
		const places = json?.data?.places ?? [];
		return places.map((p: any) => ({
			place_id: p?.id,
			name: p?.displayName?.text ?? p?.shortFormattedAddress ?? p?.formattedAddress ?? '',
			display_name: p?.formattedAddress ?? p?.shortFormattedAddress ?? '',
			address: p?.formattedAddress ?? p?.shortFormattedAddress ?? '',
			lat: String(p?.location?.latitude),
			lon: String(p?.location?.longitude),
			raw: p
		}));
	} catch (err) {
		console.error('getAddressSuggestionsAPI failed', err);
		return [];
	}
}

async function reverseGeoCodeAPI(lat: number, lng: number) {
	try {
		const res = await fetch('/api/reverseGeoCode', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ input: { request: { latitude: String(lat), longitude: String(lng) } } })
		});
		const json = await res.json();
		const results = json?.data?.results ?? [];

		if (results.length > 0) {
			const result = results[0];
			const components = result.address_components || [];

			// Helper function to find address component by type
			const findComponent = (types: string[]) => {
				return components.find((c: any) =>
					types.some(type => c.types?.includes(type))
				);
			};

			// Extract address components
			const streetNumber = findComponent(['street_number'])?.long_name || '';
			const route = findComponent(['route'])?.long_name || '';
			const neighborhood = findComponent(['neighborhood'])?.long_name || '';
			const sublocality3 = findComponent(['sublocality_level_3'])?.long_name || '';
			const sublocality2 = findComponent(['sublocality_level_2'])?.long_name || '';
			const sublocality1 = findComponent(['sublocality_level_1'])?.long_name || '';
			const locality = findComponent(['locality'])?.long_name || '';
			const state = findComponent(['administrative_area_level_1'])?.long_name || '';
			const country = findComponent(['country'])?.long_name || '';
			const postalCode = findComponent(['postal_code'])?.long_name || '';

			// Build road name (street number + route)
			const road = [streetNumber, route].filter(Boolean).join(', ') ||
				neighborhood ||
				sublocality3 ||
				'';

			// Build city (prefer locality, fallback to sublocality)
			const city = locality || sublocality1 || sublocality2 || '';

			return {
				display_name: result.formatted_address,
				address: {
					road: road,
					neighborhood: neighborhood,
					suburb: sublocality3 || sublocality2,
					city: city,
					state: state,
					postcode: postalCode,
					country: country,
				}
			};
		}
		return null;
	} catch (err) {
		console.error('reverseGeoCodeAPI failed', err);
		return null;
	}
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
	onLocationChange,
	onAddAddress,
	onEditAddress,
	setShowLogin
}) => {
	const { user, isAuthenticated } = useAuthStore();
	const { location: contextLocation, setLocation: setContextLocation } = useCurrentLocation(); // Add context hook
	const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [isDetectingLocation, setIsDetectingLocation] = useState(false);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
	const modalRef = useRef<HTMLDivElement>(null);
	const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

	const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	// Helper function to sync address to context
	const syncAddressToContext = (address: SavedAddress | null) => {
		if (address) {
			setContextLocation({
				latitude: String(address.latitude),
				longitude: String(address.longitude),
				full_address: address.full_address,
				name: address.name,
				id: address.id,
				type: address.type === 'home' || address.type === 'work' || address.type === 'hotel' || address.type === 'other'
					? address.type
					: 'other'
			});
		} else {
			setContextLocation(null);
		}
	};

	// Load saved addresses
	const loadAddresses = async () => {
		if (!user?.id || !user?.auth_token || !isModalOpen) return;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: GET_ADDRESSES_QUERY,
					variables: { user_id: user.id }
				})
			});

			const data = await response.json();
			if (data.data?.whatsub_addresses) {
				setSavedAddresses(data.data.whatsub_addresses);
			}
		} catch (error) {
			console.error('Error loading addresses:', error);
		}
	};

	// Load addresses on mount
	useEffect(() => {
		loadAddresses();
	}, [user?.id, isModalOpen]);

	// Initialize from localStorage on mount
	useEffect(() => {
		const storedAddress = localStorage.getItem('address');

		if (storedAddress) {
			try {
				const address = JSON.parse(storedAddress);
				setSelectedAddress(address);
				// Sync to context on initial load
				syncAddressToContext(address);
			} catch (error) {
				console.error('Error parsing stored address:', error);
				setIsModalOpen(true);
			}
		} else {
			setIsModalOpen(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Sync selectedAddress changes to both localStorage and context
	useEffect(() => {
		if (selectedAddress) {
			localStorage.setItem('address', JSON.stringify(selectedAddress));
			syncAddressToContext(selectedAddress);
		}
	}, [selectedAddress]);

	// Listen for storage changes from other tabs/windows
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'address') {
				if (e.newValue) {
					try {
						const address = JSON.parse(e.newValue);
						setSelectedAddress(address);
						syncAddressToContext(address);
					} catch (error) {
						console.error('Error parsing storage event:', error);
					}
				} else {
					setSelectedAddress(null);
					setContextLocation(null);
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	// Close modal on outside click - ONLY if selectedAddress exists
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (selectedAddress && modalRef.current && !modalRef.current.contains(event.target as Node)) {
				setIsModalOpen(false);
			}
		};

		if (isModalOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	}, [isModalOpen, selectedAddress]);

	useEffect(() => {
		loadAddresses();
	}, [isModalOpen]);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (searchTimerRef.current) {
				clearTimeout(searchTimerRef.current);
			}
		};
	}, []);

	// Format address for display
	const formatAddressDisplay = (address: SavedAddress) => {
		if (address.fhb_name) {
			const parts = address.full_address.split(',');
			if (parts.length > 2) {
				return `${address.fhb_name}, ${parts[2].trim()}`;
			}
			return address.fhb_name;
		} else {
			const parts = address.full_address.split(',');
			return parts.slice(0, 2).join(', ');
		}
	};

	// Format full address for list display
	const formatFullAddress = (address: SavedAddress) => {
		const parts = [];

		if (address.name) {
			parts.push(address.name);
		}

		if (address.fhb_name) {
			parts.push(address.fhb_name);
		}

		if (address.floor) {
			parts.push(address.floor);
		}

		const addressParts = address.full_address.split(',');
		if (addressParts.length > 2) {
			parts.push(addressParts.slice(1, 4).join(',').trim());
		}

		return parts.join(', ');
	};

	// Detect current location
	const detectLocation = async () => {
		if (!navigator.geolocation) {
			toast.error('Geolocation is not supported by your browser');
			return;
		}

		setIsDetectingLocation(true);

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(
					resolve,
					reject,
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 0
					}
				);
			});

			const { latitude, longitude } = position.coords;

			const data = await reverseGeoCodeAPI(latitude, longitude);

			if (data && data.display_name) {
				const tempAddress: SavedAddress = {
					id: 'current-location',
					type: 'other',
					name: 'Current Location',
					full_address: data.display_name,
					contact_number: '',
					latitude: String(latitude),
					longitude: String(longitude),
					fhb_name: data.address?.road || '',
					floor: '',
					nearby_landmark: '',
					toSave: !isAuthenticated
				};

				setSelectedAddress(tempAddress);
				onLocationChange?.(tempAddress);
				setIsModalOpen(false);
				toast.success('Location detected successfully');

				if (isAuthenticated) {
					saveQuickAddess({ latitude, longitude, full_address: data?.display_name });
				}
			} else {
				toast.error('Could not retrieve address for this location');
			}
		} catch (error: any) {
			console.error('Geolocation error:', error);

			if (error.code === 1) {
				toast.error('Location access denied. Please enable location permissions in your browser settings.');
			} else if (error.code === 2) {
				toast.error('Location unavailable. Please try again.');
			} else if (error.code === 3) {
				toast.error('Location request timed out. Please try again.');
			} else {
				toast.error('Failed to detect location');
			}
		} finally {
			setIsDetectingLocation(false);
		}
	};

	const saveQuickAddess = async ({ latitude, longitude, full_address }: { latitude: number; longitude: number; full_address: string }) => {
		try {
			const res = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user?.auth_token}`
				},
				body: JSON.stringify({
					query: `mutation InsertQuickAddress(
									$user_id: uuid!,
									$name: String!,
									$full_address: String!,
									$latitude: String!,
									$longitude: String!
								) {
									insert_whatsub_quick_addresses_one(
										object: {
											user_id: $user_id
											name: $name
											full_address: $full_address
											latitude: $latitude
											longitude: $longitude
										}
									) {
										id
										user_id
										name
										full_address
										latitude
										longitude
										created_at
										updated_at
									}
								}
							`,
					variables: {
						user_id: user?.id,
						name: user?.fullname,
						full_address,
						latitude: String(latitude),
						longitude: String(longitude),
					}
				})
			});

			const data = await res.json();
		} catch (e) {
			console.log('Failed to save quick address: ', e.message);
		}
	}

	// Search for locations using Google Maps API
	const searchLocations = async (query: string) => {
		if (query.length < 3) {
			setSearchSuggestions([]);
			setShowSuggestions(false);
			return;
		}

		setIsSearching(true);
		try {
			const data = await getAddressSuggestionsAPI(query);

			if (data && data.length > 0) {
				setSearchSuggestions(data);
				setShowSuggestions(true);
				setSelectedSuggestionIndex(-1);
			} else {
				setSearchSuggestions([]);
				setShowSuggestions(false);
			}
		} catch (error) {
			console.error('Search failed:', error);
			setSearchSuggestions([]);
			setShowSuggestions(false);
		} finally {
			setIsSearching(false);
		}
	};

	// Handle search input change with debouncing
	const handleSearchInputChange = (value: string) => {
		setSearchQuery(value);

		if (value.length === 0) {
			setShowSuggestions(false);
			setSearchSuggestions([]);
			return;
		}

		if (searchTimerRef.current) {
			clearTimeout(searchTimerRef.current);
		}

		searchTimerRef.current = setTimeout(() => {
			searchLocations(value);
		}, 300);
	};

	// Handle suggestion selection
	const handleSuggestionSelect = (suggestion: any) => {
		const tempAddress: SavedAddress = {
			id: `search-${Date.now()}`,
			type: 'other',
			name: 'Search Location',
			full_address: suggestion.display_name,
			contact_number: '',
			latitude: suggestion.lat,
			longitude: suggestion.lon,
			fhb_name: suggestion.address?.road || suggestion.name || '',
			floor: '',
			nearby_landmark: '',
			toSave: !isAuthenticated
		};

		setSelectedAddress(tempAddress);
		onLocationChange?.(tempAddress);
		setIsModalOpen(false);
		setSearchQuery('');
		setShowSuggestions(false);
		toast.success('Location selected');

		if (isAuthenticated) {
			saveQuickAddess({ latitude: suggestion?.lat, longitude: suggestion?.lon, full_address: suggestion?.display_name });
		}
	};

	// Handle keyboard navigation
	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showSuggestions || searchSuggestions.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setSelectedSuggestionIndex(prev =>
					prev < searchSuggestions.length - 1 ? prev + 1 : 0
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setSelectedSuggestionIndex(prev =>
					prev > 0 ? prev - 1 : searchSuggestions.length - 1
				);
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedSuggestionIndex >= 0) {
					handleSuggestionSelect(searchSuggestions[selectedSuggestionIndex]);
				}
				break;
			case 'Escape':
				setShowSuggestions(false);
				setSelectedSuggestionIndex(-1);
				break;
		}
	};

	// Handle address selection
	const handleAddressSelect = (address: SavedAddress) => {
		setSelectedAddress(address);
		onLocationChange?.(address);
		setIsModalOpen(false);
	};

	// Handle address deletion
	const handleDeleteAddress = async (addressId: string, e: React.MouseEvent) => {
		e.stopPropagation();

		if (!user?.auth_token) return;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: DELETE_ADDRESS_MUTATION,
					variables: { id: addressId }
				})
			});

			const data = await response.json();

			if (data.data?.delete_whatsub_addresses_by_pk) {
				toast.success('Address deleted successfully');

				loadAddresses();

				if (selectedAddress?.id === addressId) {
					setSelectedAddress(null);
					setContextLocation(null); // Also clear context
					localStorage.removeItem('address'); // Clear localStorage
					onLocationChange?.(null);
				}
			} else {
				toast.error('Failed to delete address');
			}
		} catch (error) {
			console.error('Error deleting address:', error);
			toast.error('Failed to delete address');
		}
	};

	// Get icon for address type
	const getAddressIcon = (type: string) => {
		switch (type) {
			case 'home':
				return '🏠';
			case 'work':
				return '🏢';
			case 'hotel':
				return '🏨';
			default:
				return '📍';
		}
	};

	// Handle navbar click
	const handleNavbarClick = () => {
		if (selectedAddress) {
			setIsModalOpen(true);
		}
	};

	return (
		<>
			{/* Navbar Display */}
			<div
				className="flex items-center gap-2 cursor-pointer hover:bg-dark-400 rounded-lg py-1 px-0.5 md:p-2 transition-colors md:max-w-xs"
				onClick={handleNavbarClick}
			>
				<div className="text-left flex-1 min-w-0">
					<div className="text-xs text-gray-400 font-semibold max-md:mb-1">Delivery in minutes</div>
					<div className="flex items-center gap-1">
						<span className="flex-1 text-xs text-white font-medium truncate overflow-hidden text-ellipsis md:whitespace-nowrap md:max-w-[250px] max-md:w-full">
							{selectedAddress ? selectedAddress.full_address : 'Select Location'}
						</span>

						<ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
					</div>
				</div>
			</div>

			{/* Location Modal - Dark Theme */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div
						ref={modalRef}
						className="bg-dark-500 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
					>
						{/* Modal Header */}
						<div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-700">
							<h2 className="text-lg md:text-xl font-semibold text-white">
								{selectedAddress ? 'Change Location' : 'Select Location'}
							</h2>
							{selectedAddress && (
								<button
									onClick={() => setIsModalOpen(false)}
									className="p-2 hover:bg-dark-400 rounded-lg transition-colors"
								>
									<X className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
								</button>
							)}
						</div>

						{/* Modal Content */}
						<div className="p-4 md:p-5">
							{/* Action Buttons */}
							<div className="flex max-md:flex-col gap-3 mb-4 md:mb-6">
								<button
									onClick={detectLocation}
									disabled={isDetectingLocation}
									className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-400 text-white py-2.5 md:py-3 px-3 md:px-4 rounded-xl text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-2"
								>
									{isDetectingLocation ? (
										<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
									) : (
										<Navigation className="h-4 w-4" />
									)}
									Detect my location
								</button>

								<div className="text-gray-500 flex items-center max-md:mx-auto px-3 text-sm md:text-base">OR</div>

								<div className="flex-1 relative">
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => handleSearchInputChange(e.target.value)}
										onKeyDown={handleSearchKeyDown}
										placeholder="search delivery location"
										className="w-full py-2.5 md:py-3 px-3 md:px-4 pr-10 bg-dark-400 border border-gray-500 text-white text-sm md:text-base placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
									/>
									<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
								</div>
							</div>

							{/* Content Area - Scrollable */}
							<div className="max-h-[50vh] overflow-y-auto">
								{showSuggestions && searchSuggestions.length > 0 ? (
									<div className="space-y-2">
										<h3 className="text-xs md:text-sm font-medium text-gray-400 mb-2 md:mb-3">Search Results</h3>
										{searchSuggestions.map((suggestion, index) => (
											<div
												key={suggestion.place_id}
												className={`p-3 md:p-4 bg-dark-400 rounded-lg cursor-pointer transition-all hover:bg-dark-300 ${index === selectedSuggestionIndex ? 'ring-2 ring-green-500' : ''
													}`}
												onClick={() => handleSuggestionSelect(suggestion)
												}
											>
												<div className="flex items-start gap-2 md:gap-3">
													<MapPin className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
													<div className="flex-1 min-w-0">
														<div className="text-white font-medium text-sm md:text-base break-words">
															{suggestion.name}
														</div>
														<div className="text-gray-500 text-xs md:text-sm mt-1 break-words">
															{suggestion.display_name}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<>
										{isAuthenticated && savedAddresses.length > 0 && (
											<div className="space-y-2">
												<h3 className="text-xs md:text-sm font-medium text-gray-400 mb-2 md:mb-3">Your saved addresses</h3>
												{savedAddresses.map((address) => (
													<div
														key={address.id}
														className={`relative p-3 md:p-4 bg-dark-400 rounded-lg cursor-pointer transition-all hover:bg-dark-300}`}
														onClick={() => handleAddressSelect(address)}
													>
														{selectedAddress?.id === address.id && <div className='absolute text-[8px] md:text-[9px] text-white rounded-lg md:rounded-xl bg-violet-700 px-1.5 py-0.5 md:px-2 md:py-1 top-0 left-0'>Selected</div>}
														<div className="flex items-start justify-between gap-2">
															<div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
																<span className="text-xl md:text-2xl mt-0.5 md:mt-1 flex-shrink-0">{getAddressIcon(address.type)}</span>
																<div className="flex-1 min-w-0">
																	<h4 className="font-semibold capitalize text-white text-sm md:text-base">{address.type}</h4>
																	<p className="hidden md:block text-xs md:text-sm text-gray-400 mt-0.5 md:mt-1 break-words">
																		{formatFullAddress(address)}
																	</p>
																</div>
															</div>
															<div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		setEditingAddress(address);
																		setIsOpen(true);
																		setIsModalOpen(false);
																	}}
																	className="p-1.5 hover:bg-dark-500 rounded transition-colors"
																>
																	<Edit className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
																</button>
																<button
																	onClick={(e) => handleDeleteAddress(address.id, e)}
																	className="p-1.5 hover:bg-red-900/30 rounded transition-colors"
																>
																	<Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-400" />
																</button>
															</div>
														</div>
														<p className="md:hidden text-xs md:text-sm text-gray-400 mt-0.5 md:mt-1 break-words">
															{formatFullAddress(address)}
														</p>
													</div>
												))}
											</div>
										)}

										{isAuthenticated && (
											<div className="mt-4 md:mt-6">
												<button
													onClick={() => {
														setIsModalOpen(false);
														setIsOpen(true)
													}}
													className="w-full py-2.5 md:py-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 text-sm md:text-base hover:border-gray-500 hover:text-gray-300 transition-colors font-medium bg-dark-400/50"
												>
													+ Add New Address
												</button>
											</div>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			<AddAddressModal
				isOpen={isOpen}
				onClose={() => {
					setIsOpen(false);
					setEditingAddress(null);
					setIsModalOpen(true)
				}}
				onSuccess={() => {
					setIsModalOpen(true);
					setIsOpen(false);
					setEditingAddress(null);
					loadAddresses();
				}}
				editingAddress={editingAddress}
			/>
		</>
	);
};

export default LocationSelector;