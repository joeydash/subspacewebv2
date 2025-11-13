'use client';

import React, { useEffect } from "react";

import Navbar from "./navbar";
import Footer from "./footer";

import { connectWebSocket, disconnectWebSocket } from 'vocallabs_agent_web';
import { useAuthStore } from "@/lib/store/auth-store";


export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { user, isAuthenticated } = useAuthStore();

	useEffect(() => {
		if (!isAuthenticated) return;

		connectWebSocket(user?.id, 'go-fiber-ayft.onrender.com');
		return () => disconnectWebSocket();
	}, [isAuthenticated, user?.id]);


	return (
		<div className="flex flex-col min-h-screen">
			<Navbar />
			<main className="grow mt-16">
				{children}
			</main>
			<Footer />
		</div>
	);
}

