"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LocationData {
	latitude: string;
	longitude: string;
	full_address?: string;
	name?: string;
	id?: string;
	type?: 'home' | 'work' | 'hotel' | 'other' | 'current-location' | 'search';
}

interface LocationContextType {
	location: LocationData | null;
	setLocation: (location: LocationData | null) => void;
	clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = 'address';

export const LocationProvider = ({ children }: { children: ReactNode }) => {
	const [location, setLocationState] = useState<LocationData | null>(null);

	useEffect(() => {
		try {
			const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
			if (storedLocation) {
				const parsed = JSON.parse(storedLocation);
				setLocationState(parsed);
			}
		} catch (error) {
			console.error('Error loading location from localStorage:', error);
			localStorage.removeItem(LOCATION_STORAGE_KEY);
		}
	}, []);

	const setLocation = (newLocation: LocationData | null) => {
		setLocationState(newLocation);
		try {
			if (newLocation) {
				localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
			} else {
				localStorage.removeItem(LOCATION_STORAGE_KEY);
			}
		} catch (error) {
			console.error('Error saving location to localStorage:', error);
		}
	};

	const clearLocation = () => {
		setLocationState(null);
		try {
			localStorage.removeItem(LOCATION_STORAGE_KEY);
		} catch (error) {
			console.error('Error clearing location from localStorage:', error);
		}
	};

	return (
		<LocationContext.Provider value={{ location, setLocation, clearLocation }}>
			{children}
		</LocationContext.Provider>
	);
};

export const useCurrentLocation = () => {
	const context = useContext(LocationContext);
	if (context === undefined) {
		throw new Error('useCurrentLocation must be used within a LocationProvider');
	}
	return context;
};