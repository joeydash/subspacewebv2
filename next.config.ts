import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
	dest: "public",
	register: true,
	disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
	transpilePackages: ["vocallabs_agent_web"],

	turbopack: {
		// Empty config to acknowledge Turbopack usage
	},

	typescript: {
		ignoreBuildErrors: true,
	},

	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.subspace.money",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "cdn.vocallabs.ai",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "i.postimg.cc",
				pathname: "/**",
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
