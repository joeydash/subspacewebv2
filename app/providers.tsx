'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/react-query-client';
import ToastConfig from '@/config/toast-config';
import { SkeletonTheme } from 'react-loading-skeleton';
import { LocationProvider } from '@/lib/context/location-context';
import 'react-loading-skeleton/dist/skeleton.css';

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<SkeletonTheme baseColor="#2a2a2a" highlightColor="#3a3a3a" duration={1.5}>
				<LocationProvider>
					{children}
					<ToastConfig />
				</LocationProvider>
			</SkeletonTheme>
		</QueryClientProvider>
	);
}
