"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import SubspaceLoader from './subspace-loader';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();

	useEffect(() => {
		if (!isAuthenticated) {
			router.push('/');
		}
	}, [isAuthenticated, router]);

	// Show nothing while checking auth or if not authenticated
	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[90vh] space-y-4">
				<SubspaceLoader style={{ width: 200, height: 40 }} animationDuration={2.5} />
			</div>
		);
	}

	return <>{children}</>;
}
