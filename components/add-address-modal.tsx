import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	X,
	MapPin,
	Home,
	Building,
	Hotel,
	CheckCircle,
	Navigation,
	Search
} from 'lucide-react';
import {
	APIProvider,
	Map,
	Marker,
} from '@vis.gl/react-google-maps';
import { useAuthStore } from '@/lib/store/auth-store';
import toast from 'react-hot-toast';

/* ---------- GraphQL mutations (unchanged from your original) ---------- */
const ADD_ADDRESS_MUTATION = `mutation AddAddress(
  $user_id: uuid!
  $name: String
  $full_address: String
  $contact_number: String
  $type: String
  $latitude: String
  $longitude: String
  $fhb_name: String
  $floor: String
  $nearby_landmark: String
) {
  insert_whatsub_addresses_one(object: {
    user_id: $user_id
    name: $name
    full_address: $full_address
    contact_number: $contact_number
    type: $type
    latitude: $latitude
    longitude: $longitude
    fhb_name: $fhb_name
    floor: $floor
    nearby_landmark: $nearby_landmark
  }) {
    id
    user_id
    full_address
    type
    created_at
  }
}
`;

const EDIT_ADDRESS_MUTATION = `mutation UpdateAddress(
  $id: uuid!
  $name: String
  $full_address: String
  $contact_number: String
  $type: String
  $latitude: String
  $longitude: String
  $fhb_name: String
  $floor: String
  $nearby_landmark: String
) {
  update_whatsub_addresses_by_pk(
    pk_columns: { id: $id }
    _set: {
      name: $name
      full_address: $full_address
      contact_number: $contact_number
      type: $type
      latitude: $latitude
      longitude: $longitude
      fhb_name: $fhb_name
      floor: $floor
      nearby_landmark: $nearby_landmark
    }
  ) {
    id
    user_id
    full_address
    updated_at
  }
}
`;

/* ---------- Types ---------- */
interface AddressFormData {
	type: 'home' | 'work' | 'hotel' | 'other';
	name: string;
	phone: string;
	email: string;
	address_line_1: string;
	address_line_2: string;
	city: string;
	state: string;
	pincode: string;
	country: string;
	is_default: boolean;
	latitude?: number;
	longitude?: number;
	display_name?: string;
}

interface Address {
	id: string;
	type: 'home' | 'work' | 'hotel' | 'other';
	name: string;
	phone: string;
	email?: string;
	address_line_1: string;
	address_line_2?: string;
	city: string;
	state: string;
	pincode: string;
	country: string;
	is_default: boolean;
	latitude?: number;
	longitude?: number;
	display_name?: string;
	contact_number?: string;
	fhb_name?: string;
	floor?: string;
	full_address?: string;
}

interface AddAddressModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingAddress?: Address | null;
}

/* ---------- Map config ---------- */
const defaultCenter = { lat: 12.9716, lng: 77.5946 };

/* ---------- Helper to extract area from Google's address_components ---------- */
function extractAreaNameFromGoogle(components: any[] | undefined) {
	if (!components || components.length === 0) return 'Unknown Area';
	const find = (types: string[]) => {
		const c = components.find((comp) => types.every(t => comp.types.includes(t)));
		return c ? c.long_name : null;
	};
	return (
		find(['sublocality', 'sublocality_level_1']) ||
		find(['neighborhood']) ||
		find(['locality']) ||
		find(['administrative_area_level_2']) ||
		find(['administrative_area_level_1']) ||
		'Unknown Area'
	);
}

/* ---------- Inlined fetch functions (client -> your server endpoints) ---------- */
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
			name: p?.displayName?.text ?? p?.shortFormattedAddress ?? p?.formattedAddress ?? '',
			address: p?.formattedAddress ?? p?.shortFormattedAddress ?? '',
			lat: p?.location?.latitude,
			lng: p?.location?.longitude,
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
		return json?.data?.results ?? [];
	} catch (err) {
		console.error('reverseGeoCodeAPI failed', err);
		return [];
	}
}

/* ---------- Component ---------- */
const AddAddressModal: React.FC<AddAddressModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	editingAddress
}) => {
	const { user } = useAuthStore();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGettingLocation, setIsGettingLocation] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
	const [selectedLocation, setSelectedLocation] = useState<{
		latitude: number;
		longitude: number;
		address: string;
	} | null>(null);
	// Change: Use defaultCenter and defaultZoom only for initial state
	const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
	const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);

	const [formData, setFormData] = useState<AddressFormData>({
		type: 'home',
		name: user?.fullname || '',
		phone: user?.phone || '',
		email: user?.email || '',
		address_line_1: '',
		address_line_2: '',
		city: '',
		state: '',
		pincode: '',
		country: 'India',
		is_default: false,
		latitude: undefined,
		longitude: undefined,
		display_name: ''
	});

	const debounceTimerRef = useRef<any>();

	const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

	// fallback extractor for OSM-like objects (kept for compatibility)
	const extractAreaName = (address: any) => {
		if (address && typeof address === 'object' && address.neighbourhood) {
			const areas: string[] = [];
			if (address.neighbourhood && !address.neighbourhood.match(/^\d/)) areas.push(address.neighbourhood);
			if (address.suburb && !address.suburb.match(/^\d/) && address.suburb !== address.neighbourhood) areas.push(address.suburb);
			if (address.village && address.village !== address.suburb && address.village !== address.neighbourhood) areas.push(address.village);
			if (address.city_district && !areas.includes(address.city_district)) areas.push(address.city_district);
			const cityName = address.city || address.town || address.municipality;
			if (cityName && !areas.includes(cityName)) areas.push(cityName);
			const uniqueAreas = [...new Set(areas)].slice(0, 3);
			return uniqueAreas.join(', ') || 'Unknown Area';
		}
		return 'Unknown Area';
	};

	// reverseGeocode wrapper that adapts Google's response into your form fields
	const reverseGeocode = useCallback(async (latitude: number, longitude: number, skipFormUpdate?: boolean) => {
		try {
			const results = await reverseGeoCodeAPI(latitude, longitude);
			const top = results && results.length > 0 ? results[0] : null;
			if (!top) return;

			const formatted_address = top.formatted_address ?? top.formattedAddress ?? '';
			const components = top.address_components ?? [];
			const areaName = extractAreaNameFromGoogle(components) || extractAreaName(top);
			const findComp = (type: string) => {
				const c = components.find((comp: any) => comp.types && comp.types.includes(type));
				return c ? c.long_name : '';
			};
			const state = findComp('administrative_area_level_1') || findComp('administrative_area_level_2') || '';
			const postcode = findComp('postal_code') || (top.plus_code && top.plus_code.compound_code?.split(' ').pop()) || '';

			if (!skipFormUpdate) {
				setFormData(prev => ({
					...prev,
					latitude,
					longitude,
					city: areaName,
					state,
					pincode: postcode,
					display_name: formatted_address || prev.display_name || ''
				}));
			} else {
				setFormData(prev => ({ ...prev, city: areaName }));
			}

			setSelectedLocation({ latitude, longitude, address: formatted_address || '' });
			setSearchQuery(formatted_address || '');
		} catch (error) {
			console.error('Reverse geocoding failed:', error);
		}
	}, []);

	/* Reset / init */
	useEffect(() => {
		if (isOpen) {
			if (editingAddress) {
				const editLat = editingAddress.latitude ? parseFloat(String(editingAddress.latitude)) : undefined;
				const editLng = editingAddress.longitude ? parseFloat(String(editingAddress.longitude)) : undefined;

				setFormData({
					type: editingAddress.type || 'home',
					name: editingAddress.name || '',
					phone: editingAddress.contact_number || editingAddress.phone || '',
					address_line_1: editingAddress.fhb_name || editingAddress.address_line_1 || '',
					address_line_2: editingAddress.floor || editingAddress.address_line_2 || '',
					city: '',
					latitude: editLat,
					longitude: editLng,
					display_name: editingAddress.full_address || editingAddress.display_name || '',
					email: user?.email || '',
					state: '',
					pincode: '',
					country: 'India',
					is_default: false,
				});

				if (editLat && editLng && !isNaN(editLat) && !isNaN(editLng)) {
					setMapCenter({ lat: editLat, lng: editLng });
					setMapZoom(16);
					setSelectedLocation({ latitude: editLat, longitude: editLng, address: editingAddress.full_address || editingAddress.display_name || '' });
					setSearchQuery(editingAddress.full_address || editingAddress.display_name || '');
					reverseGeocode(editLat, editLng, true);
					// Clear center after initial positioning
					setTimeout(() => {
						setMapCenter(undefined);
						setMapZoom(undefined);
					}, 100);
				}
			} else {
				setFormData({
					type: 'home',
					name: user?.fullname || '',
					phone: user?.phone || '',
					email: user?.email || '',
					address_line_1: '',
					address_line_2: '',
					city: '',
					state: '',
					pincode: '',
					country: 'India',
					is_default: false,
					latitude: undefined,
					longitude: undefined,
					display_name: ''
				});
				setSelectedLocation(null);
				setSearchQuery('');
				setSearchSuggestions([]);
				setShowSuggestions(false);
				setMapCenter(undefined);
				setMapZoom(undefined);
			}
		}
	}, [isOpen, editingAddress, user, reverseGeocode]);

	/* Cleanup debounce */
	useEffect(() => () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); }, []);

	/* click outside suggestions */
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.search-container')) setShowSuggestions(false);
		};
		if (showSuggestions) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showSuggestions]);

	/* Suggestions fetch (debounced) */
	const fetchSuggestions = useCallback(async (query: string) => {
		if (query.length < 2) {
			setSearchSuggestions([]);
			setShowSuggestions(false);
			return;
		}
		try {
			const results = await getAddressSuggestionsAPI(query);
			if (results && results.length > 0) {
				setSearchSuggestions(results);
				setShowSuggestions(true);
				setSelectedSuggestionIndex(-1);
			} else {
				setSearchSuggestions([]);
				setShowSuggestions(false);
			}
		} catch (error) {
			console.error('Failed to fetch suggestions:', error);
			setSearchSuggestions([]);
			setShowSuggestions(false);
		}
	}, []);

	const handleSearchInputChange = (value: string) => {
		setSearchQuery(value);
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		debounceTimerRef.current = setTimeout(() => fetchSuggestions(value), 250);
	};

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showSuggestions || searchSuggestions.length === 0) {
			if (e.key === 'Enter') e.preventDefault();
			return;
		}
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setSelectedSuggestionIndex(prev => (prev < searchSuggestions.length - 1 ? prev + 1 : 0));
				break;
			case 'ArrowUp':
				e.preventDefault();
				setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : searchSuggestions.length - 1));
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedSuggestionIndex >= 0) handleSuggestionSelect(searchSuggestions[selectedSuggestionIndex]);
				else if (searchSuggestions.length > 0) handleSuggestionSelect(searchSuggestions[0]);
				break;
			case 'Escape':
				setShowSuggestions(false);
				setSelectedSuggestionIndex(-1);
				break;
		}
	};

	const handleMapClick = useCallback(async (ev: any) => {
		const ll = ev?.detail?.latLng;
		if (!ll) return;
		const lat = ll.lat;
		const lng = ll.lng;
		// Remove these lines - don't set center/zoom on click
		// setMapCenter({ lat, lng });
		// setMapZoom(16);
		await reverseGeocode(lat, lng);
	}, [reverseGeocode]);

	const handleSuggestionSelect = async (suggestion: any) => {
		const lat = Number(suggestion.lat);
		const lng = Number(suggestion.lng);
		setSearchQuery(suggestion.name || suggestion.address || '');
		setShowSuggestions(false);
		setSearchSuggestions([]);
		// Only set center/zoom to move to the selected location
		setMapCenter({ lat, lng });
		setMapZoom(16);
		await reverseGeocode(lat, lng);
		// Clear center after a brief moment to allow user to pan/zoom
		setTimeout(() => {
			setMapCenter(undefined);
			setMapZoom(undefined);
		}, 100);
	};

	const handleSearch = async () => {
		if (!searchQuery.trim()) return;
		setIsSearching(true);
		try {
			const results = await getAddressSuggestionsAPI(searchQuery);
			if (results.length > 0) {
				const r = results[0];
				setMapCenter({ lat: r.lat, lng: r.lng });
				setMapZoom(16);
				setSelectedLocation({ latitude: r.lat, longitude: r.lng, address: r.address || r.name });
				await reverseGeocode(r.lat, r.lng);
				toast.success('Location found');
				// Clear center after moving
				setTimeout(() => {
					setMapCenter(undefined);
					setMapZoom(undefined);
				}, 100);
			} else {
				toast.error('Location not found. Try a different search term.');
			}
		} catch (error) {
			console.error('Search failed', error);
			toast.error('Failed to search location');
		} finally {
			setIsSearching(false);
		}
	};

	const getCurrentLocation = async () => {
		if (!navigator.geolocation) {
			toast.error('Geolocation is not supported by this browser');
			return;
		}
		setIsGettingLocation(true);
		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
			});
			const { latitude, longitude } = position.coords;
			setMapCenter({ lat: latitude, lng: longitude });
			setMapZoom(16);
			await reverseGeocode(latitude, longitude);
			toast.success('Current location detected');
			// Clear center after moving
			setTimeout(() => {
				setMapCenter(undefined);
				setMapZoom(undefined);
			}, 100);
		} catch (error: any) {
			console.error('Geolocation error:', error);
			if (error?.code === 1) toast.error('Location access denied. Please enable location permissions.');
			else if (error?.code === 2) toast.error('Location unavailable. Please try again.');
			else if (error?.code === 3) toast.error('Location request timed out. Please try again.');
			else toast.error('Failed to get current location');
		} finally {
			setIsGettingLocation(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value, type } = e.target;
		setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
	};

	const handleTypeSelect = (type: 'home' | 'work' | 'hotel' | 'other') => setFormData(prev => ({ ...prev, type }));

	const handleSubmitAddress = async () => {
		if (!user?.id || !user?.auth_token) return;
		if (!formData.name.trim() || !formData.phone.trim() || !formData.address_line_1.trim() || !formData.city.trim()) {
			toast.error('Please fill in all required fields');
			return;
		}
		if (formData.phone.length !== 10) {
			toast.error('Please enter a valid 10-digit phone number');
			return;
		}

		setIsSubmitting(true);
		try {
			const mutation = editingAddress ? EDIT_ADDRESS_MUTATION : ADD_ADDRESS_MUTATION;
			const variables = editingAddress ? {
				id: editingAddress.id,
				type: formData.type,
				name: formData.name.trim(),
				contact_number: formData.phone.trim(),
				fhb_name: formData.address_line_1.trim(),
				floor: formData.address_line_2.trim() || null,
				latitude: formData.latitude != null ? String(formData.latitude) : null,
				longitude: formData.longitude != null ? String(formData.longitude) : null,
				full_address: formData.display_name || null
			} : {
				user_id: user.id,
				type: formData.type,
				name: formData.name.trim(),
				contact_number: formData.phone.trim(),
				fhb_name: formData.address_line_1.trim(),
				floor: formData.address_line_2.trim() || null,
				latitude: formData.latitude != null ? String(formData.latitude) : null,
				longitude: formData.longitude != null ? String(formData.longitude) : null,
				full_address: formData.display_name || null
			};

			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.auth_token}` },
				body: JSON.stringify({ query: mutation, variables })
			});
			const data = await response.json();
			if (data.errors) { toast.error(data.errors[0]?.message || 'Failed to save address'); return; }
			const result = editingAddress ? data.data?.update_whatsub_addresses_by_pk : data.data?.insert_whatsub_addresses_one;
			if (result) { toast.success(editingAddress ? 'Address updated successfully' : 'Address added successfully'); onSuccess(); onClose(); }
			else { toast.error('Failed to save address'); }
		} catch (error) { console.error('Error saving address:', error); toast.error('Failed to save address'); }
		finally { setIsSubmitting(false); }
	};

	const isFormValid = () => formData.name.trim() && formData.phone.trim() && formData.address_line_1.trim() && formData.city.trim() && formData.phone.length === 10;

	const getTypeIcon = (type: string) => {
		switch (type) {
			case 'home': return <Home className="h-5 w-5" />;
			case 'work': return <Building className="h-5 w-5" />;
			case 'hotel': return <Hotel className="h-5 w-5" />;
			default: return <MapPin className="h-5 w-5" />;
		}
	};

	if (!isOpen) return null;

	/* Determine whether the Maps JS is already available on the page. If it is not and you do not
	   want to include a client-side API key, you must ensure the script is injected server-side. */

	return (
		<div className="fixed inset-0 top-[-30px] bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
			<div className="bg-dark-500 rounded-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl border border-gray-700 flex flex-col lg:flex-row overflow-hidden">

				{/* Map Section */}
				<div className="w-full lg:w-1/2 h-[40vh] lg:h-auto bg-dark-600 relative order-1">
					<div className="absolute top-2 left-2 right-16 z-1000">
						<div className="relative search-container">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => handleSearchInputChange(e.target.value)}
								onKeyDown={handleSearchKeyDown}
								onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
								placeholder="Search for area, street..."
								className="w-full bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg px-3 sm:px-4 py-2 sm:py-[10px] pl-8 sm:pl-12 pr-14 sm:pr-20 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg"
							/>
							<Search className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
							<button onClick={handleSearch} disabled={isSearching} className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 px-2 sm:px-3 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-md text-xs sm:text-sm transition-colors">
								{isSearching ? '...' : 'Search'}
							</button>

							{/* Suggestions Dropdown */}
							{showSuggestions && searchSuggestions.length > 0 && (
								<div className="absolute top-full mt-1 sm:mt-2 left-0 right-0 bg-white rounded-lg shadow-xl max-h-36 sm:max-h-64 overflow-y-auto z-[1001]">
									{searchSuggestions.map((suggestion, index) => (
										<div
											key={`${suggestion.lat}-${suggestion.lng}-${index}`}
											className={`px-2 sm:px-4 py-2 sm:py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-none transition-colors ${index === selectedSuggestionIndex ? 'bg-indigo-50' : ''}`}
											onClick={() => handleSuggestionSelect(suggestion)}
											onMouseEnter={() => setSelectedSuggestionIndex(index)}
										>
											<div className="flex items-start gap-2 sm:gap-3">
												<MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5 flex-shrink-0" />
												<div className="flex-1">
													<div className="text-gray-800 font-medium text-xs sm:text-sm line-clamp-1">{suggestion.name}</div>
													<div className="text-gray-500 text-xs mt-0.5 line-clamp-2 sm:line-clamp-none">{suggestion.address}</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Map with conditional center/zoom */}
					<div className="w-full h-full">
						<APIProvider apiKey={googleMapsApiKey}>
							<div style={{ width: '100%', height: '100%' }}>
								<Map
									defaultCenter={defaultCenter}
									defaultZoom={13}
									{...(mapCenter && { center: mapCenter })}
									{...(mapZoom && { zoom: mapZoom })}
									gestureHandling="greedy"
									onClick={handleMapClick}
									disableDefaultUI={false}
									mapTypeControl={false}
									streetViewControl={false}
								>
									{selectedLocation && (
										<Marker
											position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
										/>
									)}
								</Map>
							</div>
						</APIProvider>
					</div>

					{/* Current Location Button */}
					<div className="absolute bottom-2 sm:bottom-6 left-2 z-[1000]">
						<button onClick={getCurrentLocation} disabled={isGettingLocation} className="flex items-center gap-1 sm:gap-2 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-400 text-white px-2 py-1.5 sm:py-2 rounded-lg shadow-lg transition-colors font-medium text-sm">
							{isGettingLocation ? (<div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white" />) : (<Navigation className="h-4 w-4" />)}
							<span className="hidden sm:inline">Detect Current Location</span>
							<span className="sm:hidden">Current Location</span>
						</button>
					</div>

					{/* Selected Location Info */}
					{selectedLocation && (
						<div className="absolute bottom-12 sm:bottom-20 left-2 sm:left-4 right-2 sm:right-4 z-[1000]">
							<div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-4 shadow-lg">
								<h4 className="font-medium text-gray-800 text-xs sm:text-base mb-1">Delivering to</h4>
								<div className="flex items-start gap-2 sm:gap-3">
									<div className="w-5 h-5 sm:w-8 sm:h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
										<MapPin className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-white" />
									</div>
									<div className="overflow-hidden flex-1">
										<div className="font-medium text-gray-800 text-xs sm:text-base">Selected</div>
										<div className="text-gray-600 text-xs sm:text-sm truncate">{selectedLocation.address}</div>
										<div className="text-gray-500 text-xs mt-0.5 sm:mt-1">{selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Form Section (keeps your original markup & flow; unchanged behaviorally) */}
				<div className="w-full lg:w-1/2 flex flex-col flex-1 lg:flex-initial order-2">
					<div className="flex items-center justify-between py-2 sm:px-4 border-b border-gray-700 flex-shrink-0">
						<h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">{editingAddress ? 'Edit Address' : 'Enter complete address'}</h3>
						<button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 sm:p-1.5 lg:p-2 hover:bg-dark-400 rounded-lg"><X className="h-4 w-4 sm:h-5 sm:w-5" /></button>
					</div>

					<div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 lg:space-y-6">
						{/* Address Type Selection */}
						<div>
							<label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2 lg:mb-3">Save address as *</label>
							<div className="grid grid-cols-2 sm:flex gap-2 lg:gap-3">
								<button onClick={() => handleTypeSelect('home')} className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg border transition-colors text-xs sm:text-sm lg:text-base ${formData.type === 'home' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-dark-400 border-gray-600 text-gray-400 hover:bg-dark-300'}`}><Home className="h-3 w-3 sm:h-4 sm:w-4" /><span>Home</span></button>
								<button onClick={() => handleTypeSelect('work')} className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg border transition-colors text-xs sm:text-sm lg:text-base ${formData.type === 'work' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-dark-400 border-gray-600 text-gray-400 hover:bg-dark-300'}`}><Building className="h-3 w-3 sm:h-4 sm:w-4" /><span>Work</span></button>
								<button onClick={() => handleTypeSelect('hotel')} className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg border transition-colors text-xs sm:text-sm lg:text-base ${formData.type === 'hotel' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-dark-400 border-gray-600 text-gray-400 hover:bg-dark-300'}`}><Hotel className="h-3 w-3 sm:h-4 sm:w-4" /><span>Hotel</span></button>
								<button onClick={() => handleTypeSelect('other')} className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg border transition-colors text-xs sm:text-sm lg:text-base ${formData.type === 'other' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-dark-400 border-gray-600 text-gray-400 hover:bg-dark-300'}`}><MapPin className="h-3 w-3 sm:h-4 sm:w-4" /><span>Other</span></button>
							</div>
						</div>

						{/* Address Fields */}
						<div className="space-y-3 lg:space-y-4">
							<div>
								<label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-1.5 lg:mb-2">Flat / House no / Building name * </label>
								<input type="text" name="address_line_1" value={formData.address_line_1} onChange={handleInputChange} className="input w-full text-sm lg:text-base py-2 px-3" />
							</div>

							<div>
								<label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-1.5 lg:mb-2">Floor / Nearby landmark (Optional) </label>
								<input type="text" name="address_line_2" value={formData.address_line_2} onChange={handleInputChange} className="input w-full text-sm lg:text-base py-2 px-3" />
							</div>

							<div>
								<label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-1.5 lg:mb-2">Area / Sector / Locality * <span className="text-xs text-green-500">(Auto-filled)</span></label>
								<input type="text" value={formData.city || ''} readOnly placeholder="Select location on map" className="input w-full bg-dark-400/50 text-gray-300 cursor-not-allowed text-sm lg:text-base py-2 px-3" title={formData.city || 'Select location to auto-fill'} />
							</div>

							{formData.display_name && (
								<div className="text-xs text-gray-500 bg-dark-400/30 p-2 sm:p-2.5 lg:p-3 rounded-lg">
									<div className="flex items-start gap-1.5 sm:gap-2">
										<MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mt-0.5 flex-shrink-0" />
										<div>
											<span className="font-medium">Full location:</span>
											<div className="mt-0.5 sm:mt-1 text-gray-400 text-xs break-words">{formData.display_name}</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Delivery Details */}
						<div className="border-t border-gray-700 pt-3 lg:pt-6">
							<p className="text-gray-400 text-xs lg:text-sm mb-2 sm:mb-3 lg:mb-4">Your details for delivery</p>
							<div className="space-y-3 lg:space-y-4">
								<div><input type="text" name="name" value={user?.fullname} readOnly placeholder="Your name *" className="input w-full text-sm lg:text-base py-2 px-3" /></div>
								<div><input type="tel" name="phone" value={user?.phone} readOnly placeholder="Your phone number *" maxLength={10} className="input w-full text-sm lg:text-base py-2 px-3" /></div>
							</div>
						</div>

						{/* Coordinates Info */}
						{formData.latitude && formData.longitude && (
							<div className="text-xs text-gray-500 bg-dark-400 p-2 sm:p-2.5 lg:p-3 rounded-lg">
								<div className="flex items-center gap-1.5 sm:gap-2"><MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" /><span>Coordinates:</span></div>
								<span className="ml-4 sm:ml-5 text-xs">{(formData.latitude || 0).toFixed(6)}, {(formData.longitude || 0).toFixed(6)}</span>
							</div>
						)}

						<button onClick={handleSubmitAddress} disabled={!isFormValid() || isSubmitting} className="w-full py-2.5 sm:py-3 lg:py-4 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm lg:text-base">
							{isSubmitting ? (
								<>
									<div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 border-t-2 border-b-2 border-white" />
									<span>Saving...</span>
								</>
							) : (
								<>
									<CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
									<span>{editingAddress ? 'Update Address' : 'Save Address'}</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AddAddressModal;
