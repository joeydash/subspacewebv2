'use client';

import React, { useEffect } from "react";

import Navbar from "./navbar";
import Footer from "./footer";

import { connectWebSocket, disconnectWebSocket } from 'vocallabs_agent_web';
import { useAuthStore } from "@/lib/store/auth-store";
import updateUserLastActive from "@/lib/api/auth";
import MobileBottomNav from "../mobile-navbar";


export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { user, isAuthenticated } = useAuthStore();

	useEffect(() => {
		if (!isAuthenticated) return;

		connectWebSocket(user?.id, 'go-fiber-ayft.onrender.com');
		const intervalId = setInterval(() => {
			updateUserLastActive({
				userId: user?.id || '',
				authToken: user?.auth_token || ''
			})
		}, 1000 * 60 * 1.5); // Update every 90 seconds

		return () => {
			clearInterval(intervalId);
			disconnectWebSocket()
		};
	}, [isAuthenticated, user?.id, user?.auth_token]);


	return (
		<div className="flex flex-col min-h-screen">
			<Navbar />
			<main className="grow mt-12">
				{children}
			</main>
			<Footer />
		</div>
	);
}

