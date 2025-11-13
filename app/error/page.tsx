'use client';

import { useState, useEffect, Suspense } from 'react';
import { RefreshCw, Wifi, WifiOff, Server, AlertTriangle, Home, ArrowLeft, Globe } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguageStore } from '@/lib/store/language-store';

interface ServerErrorPageProps {
	errorType?: 'server' | 'network' | 'timeout' | 'graphql' | 'unknown';
	message?: string;
	onRetry?: () => void;
	showBackButton?: boolean;
}

const ServerErrorPageContent: React.FC<ServerErrorPageProps> = ({
	errorType: propErrorType,
	message: propMessage,
	onRetry,
	showBackButton = true
}) => {
	const { t } = useLanguageStore();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isRetrying, setIsRetrying] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

	// Get error details from URL params if available
	const stateErrorType = searchParams.get('errorType') as any || propErrorType || 'unknown';
	const stateMessage = searchParams.get('message') || propMessage;
	const canRetry = searchParams.get('canRetry') !== 'false';

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	const handleRetry = async () => {
		if (!canRetry) return;

		setIsRetrying(true);
		setRetryCount(prev => prev + 1);

			try {
			if (onRetry) {
				await onRetry();
			} else {
				// Default retry behavior - reload the page
				if (typeof window !== 'undefined' && window.history.length > 1) {
					router.back();
				} else if (typeof window !== 'undefined') {
					window.location.reload();
				}
			}
		} catch (error) {
			console.error('Retry failed:', error);
		} finally {
			setTimeout(() => {
				setIsRetrying(false);
			}, 1000);
		}
	};

	const getErrorConfig = () => {
		switch (stateErrorType) {
			case 'network':
				return {
					icon: <WifiOff className="h-16 w-16 text-red-400" />,
					title: t('error.networkTitle') || 'Network Error',
					description: stateMessage || t('error.networkDescription') || 'Unable to connect to the internet. Please check your network connection and try again.',
					color: 'red',
					gradient: 'from-red-500/20 to-pink-500/20',
					border: 'border-red-500/30',
					suggestions: [
						t('error.networkSuggestion1') || 'Check your internet connection',
						t('error.networkSuggestion2') || 'Try switching between WiFi and mobile data',
						t('error.networkSuggestion3') || 'Restart your router or modem',
						t('error.networkSuggestion4') || 'Contact your internet service provider'
					]
				};

			case 'timeout':
				return {
					icon: <AlertTriangle className="h-16 w-16 text-orange-400" />,
					title: t('error.timeoutTitle') || 'Request Timeout',
					description: stateMessage || t('error.timeoutDescription') || 'The request took too long to complete. This might be due to a slow connection or server issues.',
					color: 'orange',
					gradient: 'from-orange-500/20 to-yellow-500/20',
					border: 'border-orange-500/30',
					suggestions: [
						t('error.timeoutSuggestion1') || 'Check your internet speed',
						t('error.timeoutSuggestion2') || 'Try again in a few moments',
						t('error.timeoutSuggestion3') || 'Switch to a faster connection if available'
					]
				};

			case 'graphql':
				return {
					icon: <Globe className="h-16 w-16 text-purple-400" />,
					title: t('error.dataTitle') || 'Data Error',
					description: stateMessage || t('error.dataDescription') || 'There was an issue loading your data. This might be a temporary problem.',
					color: 'purple',
					gradient: 'from-purple-500/20 to-pink-500/20',
					border: 'border-purple-500/30',
					suggestions: [
						t('error.dataSuggestion1') || 'Refresh the page',
						t('error.dataSuggestion2') || 'Try again in a moment',
						t('error.dataSuggestion3') || 'Check your internet connection'
					]
				};

			case 'server':
			default:
				return {
					icon: <Server className="h-16 w-16 text-blue-400" />,
					title: t('error.serverTitle') || 'Server Error',
					description: stateMessage || t('error.serverDescription') || 'Our servers are currently experiencing issues. Our team has been notified and is working to resolve this.',
					color: 'blue',
					gradient: 'from-blue-500/20 to-indigo-500/20',
					border: 'border-blue-500/30',
					suggestions: [
						t('error.serverSuggestion1') || 'Try again in a few minutes',
						t('error.serverSuggestion2') || 'Check our status page for updates',
						t('error.serverSuggestion3') || 'Contact support if the issue persists'
					]
				};
		}
	};

	const errorConfig = getErrorConfig();

	return (
		<div className="min-h-screen bg-gradient-to-br from-dark-600 via-dark-700 to-dark-800 flex items-center justify-center p-4">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
			</div>

			<div className="relative z-10 w-full max-w-2xl">
				{/* Header with back button */}
				{showBackButton && (
					<div className="mb-8">
						<button
							onClick={() => router.back()}
							className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
						>
							<ArrowLeft className="h-5 w-5" />
							<span>{t('common.goBack') || 'Go Back'}</span>
						</button>
					</div>
				)}

				{/* Main error card */}
				<div className={`bg-gradient-to-br ${errorConfig.gradient} border ${errorConfig.border} rounded-3xl p-8 md:p-12 backdrop-blur-sm shadow-2xl`}>
					<div className="text-center">
						{/* Error icon with animation */}
						<div className="relative mb-8">
							<div className={`w-32 h-32 mx-auto bg-${errorConfig.color}-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse`}>
								{errorConfig.icon}
							</div>

							{/* Connection status indicator */}
							<div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
								<div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isOnline
										? 'bg-green-500/20 text-green-400 border border-green-500/30'
										: 'bg-red-500/20 text-red-400 border border-red-500/30'
									}`}>
									{isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
									<span>{isOnline ? t('common.connected') || 'Connected' : t('common.offline') || 'Offline'}</span>
								</div>
							</div>
						</div>

						{/* Error message */}
						<h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
							{errorConfig.title}
						</h1>
						<p className="text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
							{errorConfig.description}
						</p>

						{/* Suggestions */}
						<div className="mb-8">
							<h3 className="text-lg font-semibold text-white mb-4">{t('error.suggestions') || 'What you can try:'}</h3>
							<ul className="text-left text-gray-300 space-y-2 max-w-md mx-auto">
								{errorConfig.suggestions.map((suggestion, index) => (
									<li key={index} className="flex items-start gap-2">
										<span className="text-indigo-400 mt-1">•</span>
										<span>{suggestion}</span>
									</li>
								))}
							</ul>
						</div>

						{/* Retry attempts indicator */}
						{retryCount > 0 && (
							<div className="mb-6">
								<div className="inline-flex items-center gap-2 bg-dark-400/50 rounded-full px-4 py-2 text-sm text-gray-400">
									<RefreshCw className="h-4 w-4" />
									<span>{t('error.retryAttempts') || 'Retry attempts'}: {retryCount}</span>
								</div>
							</div>
						)}

						{/* Action buttons */}
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<button
								onClick={handleRetry}
								disabled={isRetrying || !canRetry}
								className={`flex items-center justify-center gap-3 px-8 py-4 bg-${errorConfig.color}-500 hover:bg-${errorConfig.color}-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg`}
							>
								<RefreshCw className={`h-5 w-5 ${isRetrying ? 'animate-spin' : ''}`} />
								<span>{isRetrying ? t('error.retrying') || 'Retrying...' : t('error.tryAgain') || 'Try Again'}</span>
							</button>

							<Link
								href="/"
								className="flex items-center justify-center gap-3 px-8 py-4 bg-dark-400 hover:bg-dark-300 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
							>
								<Home className="h-5 w-5" />
								<span>{t('error.goHome') || 'Go Home'}</span>
							</Link>
						</div>

						{/* Additional help text */}
						<div className="mt-8 pt-6 border-t border-gray-700/50">
							<p className="text-gray-400 text-sm mb-4">
								{stateErrorType === 'network'
									? t('error.networkHelp') || 'If you continue to have connection issues, please contact your internet service provider.'
									: t('error.serverHelp') || 'If the problem persists, please contact our support team.'
								}
							</p>

							{/* Status indicators */}
							<div className="flex justify-center gap-6 mt-4">
								<div className="flex items-center gap-2 text-xs text-gray-500">
									<div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
									<span>{t('error.networkStatus') || 'Network'}: {isOnline ? t('common.online') || 'Online' : t('common.offline') || 'Offline'}</span>
								</div>
								<div className="flex items-center gap-2 text-xs text-gray-500">
									<div className={`w-2 h-2 rounded-full ${stateErrorType === 'server' ? 'bg-red-400' : 'bg-yellow-400'} animate-pulse`}></div>
									<span>{t('error.serverStatus') || 'Server'}: {stateErrorType === 'server' ? t('error.issuesDetected') || 'Issues detected' : t('error.checking') || 'Checking...'}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Footer with branding */}
				<div className="text-center mt-8">
					<div className="flex items-center justify-center gap-3 mb-4">
						<Image src="/subspace-hor_002.svg" alt="Subspace" width={120} height={24} className="h-6 w-auto opacity-60" />
					</div>
					<p className="text-gray-500 text-sm">
						{t('common.brandingText') || 'Subspace - Subscription Management Platform'}
					</p>
				</div>
			</div>
		</div>
	);
};

export default function ServerErrorPage(props: ServerErrorPageProps) {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-linear-to-br from-dark-600 via-dark-700 to-dark-800 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
			</div>
		}>
			<ServerErrorPageContent {...props} />
		</Suspense>
	);
}