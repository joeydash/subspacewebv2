'use client';

import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle, Video, Shield, Users, MessageSquare } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { useAuthStore } from '@/lib/store/auth-store';

interface HelpWidgetData {
	title: string;
	details: string;
	anim_url: string;
	type: string;
	data: any;
}

interface ChatMailBoxProps {
	onBack: () => void;
	roomDetails?: any;
}

const ChatMailBox: React.FC<ChatMailBoxProps> = ({ onBack, roomDetails }) => {
	const { user } = useAuthStore();
	const [copied, setCopied] = useState(false);
	const [copiedShort, setCopiedShort] = useState(false);
	const [helpWidgetData, setHelpWidgetData] = useState<HelpWidgetData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const groupMail = roomDetails?.id ? `${roomDetails.id}@rylo.club` : null;
	const shortMail = roomDetails?.short_mail_id ? `${roomDetails.short_mail_id}@rylo.club` : null;

	useEffect(() => {
		if (user?.auth_token) {
			fetchHelpWidgetDetails();
		}
	}, [user?.auth_token]);

	const fetchHelpWidgetDetails = async () => {
		if (!user?.auth_token) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query GetHelpWidgetDetails($key: String) {
              __typename
              whatsub_help_widget(where: { key: { _eq: $key } }) {
                __typename
                title
                details
                anim_url
                type
                data
              }
            }
          `,
					variables: {
						key: "mailbox"
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch mailbox details');
				return;
			}

			const widgetData = data.data?.whatsub_help_widget?.[0];
			if (widgetData) {
				setHelpWidgetData(widgetData);
			} else {
				setError('No mailbox data found');
			}
		} catch (error) {
			console.error('Error fetching help widget details:', error);
			setError('Failed to fetch mailbox details');
		} finally {
			setIsLoading(false);
		}
	};
	const handleCopyEmail = async () => {
		if (!groupMail) return;

		try {
			await navigator.clipboard.writeText(groupMail);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy email:', error);
		}
	};

	const handleCopyShortEmail = async () => {
		if (!shortMail) return;

		try {
			await navigator.clipboard.writeText(shortMail);
			setCopiedShort(true);
			setTimeout(() => setCopiedShort(false), 2000);
		} catch (error) {
			console.error('Failed to copy email:', error);
		}
	};

	const handleTutorialClick = () => {
		const url = helpWidgetData?.data?.url;
		if (url) {
			window.open('https://www.youtube.com/watch?v=' + url, '_blank');
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<h3 className="text-xl font-bold text-white">Mailbox</h3>
				</div>
				<div className="flex justify-center items-center h-48">
					<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<h3 className="text-xl font-bold text-white">Mailbox</h3>
				</div>
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
					{error}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<h3 className="text-xl font-bold text-white">
					{helpWidgetData?.title || 'Mailbox'}
				</h3>
			</div>

			{/* Mail Animation */}
			<div className="flex justify-center">
				<div className="w-32 h-32 rounded-2xl overflow-hidden bg-dark-400">
					<Player
						autoplay
						loop
						src="/mail-animation.json"
						style={{ height: '128px', width: '128px' }}
					/>
				</div>
			</div>

			{/* Features List */}
			<div className="space-y-4">
				<div className="flex items-center gap-4 p-4 bg-dark-400/50 rounded-lg">
					<div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
						<Shield className="h-4 w-4 text-green-400" />
					</div>
					<div>
						<h3 className="font-medium text-white">99% effective in blocking marketing and spam.</h3>
					</div>
				</div>

				<div className="flex items-center gap-4 p-4 bg-dark-400/50 rounded-lg">
					<div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
						<Users className="h-4 w-4 text-blue-400" />
					</div>
					<div>
						<h3 className="font-medium text-white">Only permitting transactional emails.</h3>
					</div>
				</div>

				<div className="flex items-center gap-4 p-4 bg-dark-400/50 rounded-lg">
					<div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
						<MessageSquare className="h-4 w-4 text-purple-400" />
					</div>
					<div>
						<h3 className="font-medium text-white">Your mail will arrive in the group chat.</h3>
					</div>
				</div>
			</div>

			{/* Tutorial Section */}
			<div className="bg-linear-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-6">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h3 className="text-lg font-bold text-white mb-2">
							{helpWidgetData?.type === 'tutorial' ? helpWidgetData.title : 'How to use Subspace Mail?'}
						</h3>
						<p className="text-yellow-400 text-sm">
							{helpWidgetData?.details || 'Takes a minute to understand how it works.'}
						</p>
					</div>
					<button
						onClick={handleTutorialClick}
						className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center hover:bg-purple-500/30 transition-colors shrink-0"
					>
						{helpWidgetData?.anim_url ? (
							<Player autoplay loop src={helpWidgetData.anim_url} style={{ height: '32px', width: '32px' }} />
						) : (
							<Video className="h-6 w-6 text-purple-400" />
						)}
					</button>
				</div>
			</div>

			{/* Email Addresses Section */}
			<div className="space-y-4">
				{/* Group Email */}
				{groupMail && (
					<div className="border-2 border-dashed border-gray-600 rounded-xl p-6">
						<div className="mb-3">
							<h4 className="text-sm font-medium text-gray-400 mb-1">Group Email Address</h4>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="font-mono text-sm text-indigo-400 break-all">
									{groupMail}
								</div>
							</div>
							<button
								onClick={handleCopyEmail}
								disabled={!groupMail}
								className={`ml-4 p-3 rounded-lg transition-all duration-200 ${copied
										? 'bg-green-500/20 text-green-400 border border-green-500/30'
										: 'bg-dark-400 hover:bg-dark-300 text-gray-400 hover:text-white border border-gray-600'
									}`}
							>
								{copied ? (
									<CheckCircle className="h-5 w-5" />
								) : (
									<Copy className="h-5 w-5" />
								)}
							</button>
						</div>

						{copied && (
							<div className="mt-3 text-sm text-green-400 flex items-center gap-2">
								<CheckCircle className="h-4 w-4" />
								Group email copied to clipboard!
							</div>
						)}
					</div>
				)}

				{/* Short Email */}
				{shortMail && (
					<div className="border-2 border-dashed border-gray-600 rounded-xl p-6">
						<div className="mb-3">
							<h4 className="text-sm font-medium text-gray-400 mb-1">Short Email Address</h4>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="font-mono text-sm text-purple-400 break-all">
									{shortMail}
								</div>
							</div>
							<button
								onClick={handleCopyShortEmail}
								disabled={!shortMail}
								className={`ml-4 p-3 rounded-lg transition-all duration-200 ${copiedShort
										? 'bg-green-500/20 text-green-400 border border-green-500/30'
										: 'bg-dark-400 hover:bg-dark-300 text-gray-400 hover:text-white border border-gray-600'
									}`}
							>
								{copiedShort ? (
									<CheckCircle className="h-5 w-5" />
								) : (
									<Copy className="h-5 w-5" />
								)}
							</button>
						</div>

						{copiedShort && (
							<div className="mt-3 text-sm text-green-400 flex items-center gap-2">
								<CheckCircle className="h-4 w-4" />
								Short email copied to clipboard!
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatMailBox;