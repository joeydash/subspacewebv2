import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./preloader.css";
import { Providers } from "./providers";
import GraphQLErrorHandler from "@/components/graphql-error-handler";
import Loader from "@/components/loader";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
	title: "Subspace | Subscription Management Platform",
	description: "Manage subscriptions, share costs, and discover new services",
	icons: {
		icon: "/favicon.svg",
	},
	manifest: "/manifest.json",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${inter.variable} font-sans antialiased`}
			>
				<Loader />				
				<Providers>
					<GraphQLErrorHandler />
					{children}
				</Providers>
				<ReactQueryDevtools initialIsOpen={false} position="bottom" />
			</body>
		</html>
	);
}

