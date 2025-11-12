'use client';

import React, { useState } from 'react';
import { Mail, Shield, Users, MessageSquare, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { useAuthStore } from '@/lib/store/auth-store';
import MailboxSkeleton from './mailbox-skeleton';
import { useMailbox } from '@/lib/hooks/mailbox/use-mailbox';

const MailboxComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [copied, setCopied] = useState(false);

	const { data: helpWidgetData, isLoading, error, refetch } = useMailbox(user?.auth_token, 'mailbox');

	const subspaceMail = (user?.phone || '') + (user?.mailPrefix || '');

	const handleRefresh = () => {
		refetch();
	};

	const handleCopyEmail = async () => {
		if (!subspaceMail) return;

		try {
			await navigator.clipboard.writeText(subspaceMail);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy email:', error);
		}
	};

	const handleTutorialClick = () => {
		const url = helpWidgetData?.data?.url
		window.open('https://www.youtube.com/watch?v=' + url);
	};


	if (isLoading) {
		return <MailboxSkeleton />;
	}

	if (error) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-bold mb-1 flex items-center gap-2">
							<Mail className="h-5 w-5 text-indigo-400" />
							AI-powered Mailbox
						</h2>
						<p className="text-sm text-gray-400">Smart email filtering and management</p>
					</div>
					<button
						onClick={handleRefresh}
						className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
					>
						<RefreshCw className="h-4 w-4" />
					</button>
				</div>
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
					<p className="text-sm text-red-400">{error.message || 'Failed to fetch mailbox details'}</p>
					<button
						onClick={handleRefresh}
						className="mt-3 btn btn-primary text-sm"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-bold mb-1 flex items-center gap-2">
						<Mail className="h-5 w-5 text-indigo-400" />
						{helpWidgetData?.title || 'AI-powered Mailbox'}
					</h2>
					<p className="text-sm text-gray-400">Smart email filtering and management</p>
				</div>
			</div>

			{/* Mail Animation */}
			<div className="flex justify-center">
				<div className="w-24 h-24 rounded-xl overflow-hidden bg-dark-400/50">
					<Player
						autoplay
						loop
						src="/mail-animation.json"
						style={{ height: '96px', width: '96px' }}
					/>
				</div>
			</div>

			{/* Features List */}
			<div className="space-y-2.5">
				<div className="flex items-center gap-3 p-3 bg-dark-400/50 rounded-lg">
					<div className="w-7 h-7 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
						<Shield className="h-3.5 w-3.5 text-green-400" />
					</div>
					<div>
						<p className="text-sm text-white">99% effective in blocking marketing and spam.</p>
					</div>
				</div>

				<div className="flex items-center gap-3 p-3 bg-dark-400/50 rounded-lg">
					<div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
						<Users className="h-3.5 w-3.5 text-blue-400" />
					</div>
					<div>
						<p className="text-sm text-white">Only permitting transactional emails.</p>
					</div>
				</div>

				<div className="flex items-center gap-3 p-3 bg-dark-400/50 rounded-lg">
					<div className="w-7 h-7 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
						<MessageSquare className="h-3.5 w-3.5 text-purple-400" />
					</div>
					<div>
						<p className="text-sm text-white">Your mail will arrive in the group chat.</p>
					</div>
				</div>
			</div>

			{/* Tutorial Section */}
			<div className="bg-linear-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex-1">
						<h3 className="text-base font-semibold text-white mb-1">
							{helpWidgetData?.type === 'tutorial' ? helpWidgetData.title : 'How to use Subspace Mail?'}
						</h3>
						<p className="text-yellow-400 text-xs">
							Takes a minute to understand how it works.
						</p>
					</div>
					<button
						onClick={handleTutorialClick}
						className="w-12 h-12 flex items-center justify-center bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors shrink-0"
					>
						<Player
							autoplay
							loop
							src={helpWidgetData?.anim_url}
							style={{ height: '40px', width: '40px' }}
						/>
					</button>
				</div>
			</div>

			{/* Email Address Section */}
			<div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex-1 min-w-0">
						<div className="font-mono text-base text-indigo-400 break-all">
							{subspaceMail}
						</div>
					</div>
					<button
						onClick={handleCopyEmail}
						disabled={!subspaceMail}
						className={`p-2.5 rounded-lg transition-all duration-200 shrink-0 ${copied
							? 'bg-green-500/20 text-green-400 border border-green-500/30'
							: 'bg-dark-400 hover:bg-dark-300 text-gray-400 hover:text-white border border-gray-600'
							}`}
					>
						{copied ? (
							<CheckCircle className="h-4 w-4" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default MailboxComponent;