import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
	dest: "public",
	register: true,
	disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
	turbopack: {
		// Empty config to acknowledge Turbopack usage
	},
	typescript: {
		// !! WARN !!
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		// !! WARN !!
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.subspace.money',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'cdn.vocallabs.ai',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'i.postimg.cc',
				pathname: '/**',
			},
			
		],
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "https://api.superflow.run/:path*",
			},
		];
	},
};

export default withPWA(nextConfig);
