'use client';

import React, { useState } from 'react';
import { X, Phone, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';

interface CallModalProps {
	isOpen: boolean;
	onClose: () => void;
	username: string;
	userId: string;
}

const CallModal: React.FC<CallModalProps> = ({
	isOpen,
	onClose,
	username,
	userId,
	friendName
}) => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [isConnecting, setIsConnecting] = useState(false);
	const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
	const [error, setError] = useState<string | null>(null);


	const handleCall = async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsConnecting(true);
		setCallStatus('connecting');
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
            mutation CallUser($user_id: uuid!, $username: String!) {
              __typename
              whatsubCallUserUsingPlivo(request: {user_id: $user_id, username: $username}) {
                __typename
                affected_rows
              }
            }
          `,
					variables: {
						user_id: userId,
						username: username
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || t('error.callFailed'));
				setCallStatus('failed');
				return;
			}

			if (data.data?.whatsubCallUserUsingPlivo?.affected_rows > 0) {
				setCallStatus('connected');
				// Auto close after 2 seconds on success
				setTimeout(() => {
					onClose();
					setCallStatus('idle');
				}, 2000);
			} else {
				setError(t('error.callFailed'));
				setCallStatus('failed');
			}
		} catch (error) {
			console.error('Error initiating call:', error);
			setError(t('error.networkError'));
			setCallStatus('failed');
		} finally {
			setIsConnecting(false);
		}
	};

	const handleClose = () => {
		if (callStatus === 'connecting') return; // Prevent closing during connection

		setCallStatus('idle');
		setError(null);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-dark-500 rounded-2xl w-full max-w-md relative border border-gray-700 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700">
					<div>
						<h3 className="text-xl font-bold">{t('chat.call')} {friendName}</h3>
						<p className="text-gray-400 text-sm mt-1">{t('chat.voiceCall')}</p>
					</div>
					{callStatus !== 'connecting' && (
						<button
							onClick={handleClose}
							className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
						>
							<X className="h-5 w-5" />
						</button>
					)}
				</div>

				{/* Content */}
				<div className="p-6">
					{callStatus === 'idle' && (
						<>
							{/* Call Info */}
							<div className="text-center mb-6">
								<div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
									<Phone className="h-10 w-10 text-green-400" />
								</div>
								<h4 className="text-lg font-medium mb-2">{t('chat.readyToCall')}</h4>
							</div>

							{/* Pricing Info */}
							<div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
								<div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-2">
									<Clock className="h-4 w-4" />
									<span>{t('chat.callPricing')}</span>
								</div>
								<p className="text-white font-bold text-lg">{t('chat.callRate')}</p>
								<p className="text-gray-400 text-sm mt-1">
									{t('chat.callRateInfo')}
								</p>
							</div>

							{/* Call Button */}
							<button
								onClick={handleCall}
								disabled={isConnecting}
								className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-3"
							>
								<Phone className="h-5 w-5" />
								{t('chat.call')}
							</button>
						</>
					)}

					{callStatus === 'connecting' && (
						<div className="text-center py-8">
							<div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400"></div>
							</div>
							<h4 className="text-lg font-medium mb-2">{t('chat.connecting')}</h4>
							<p className="text-gray-400">{t('chat.connectingInfo')} {username}</p>
						</div>
					)}

					{callStatus === 'connected' && (
						<div className="text-center py-8">
							<div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="h-10 w-10 text-green-400" />
							</div>
							<h4 className="text-lg font-medium text-green-400 mb-2">{t('chat.callConnected')}</h4>
							<p className="text-gray-400">{t('chat.callInitiated')} {username}</p>
						</div>
					)}

					{callStatus === 'failed' && (
						<div className="text-center py-8">
							<div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<AlertCircle className="h-10 w-10 text-red-400" />
							</div>
							<h4 className="text-lg font-medium text-red-400 mb-2">{t('chat.callFailed')}</h4>
							<p className="text-gray-400 mb-4">{error || t('error.unknown')}</p>
							<button
								onClick={handleCall}
								className="btn btn-primary"
							>
								{t('common.retry')}
							</button>
						</div>
					)}
				</div>

				{/* Footer */}
				{callStatus === 'idle' && (
					<div className="px-6 pb-6">
						<div className="bg-dark-400 rounded-lg p-3">
							<div className="flex items-center gap-2 text-sm text-gray-400">
								<AlertCircle className="h-4 w-4" />
								<span>{t('chat.callRatesApply')}</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CallModal;