'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';

interface QRPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	amount: number;
	onSuccess?: () => void;
	onError?: (error: string) => void;
	title?: string;
	description?: string;
}

interface PaymentResponse {
	payment_id: string;
	payment_type: string;
	upiUrl: string;
}

const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
	isOpen,
	onClose,
	amount,
	onSuccess,
	onError,
	title,
	description
}) => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
	const [paymentStatus, setPaymentStatus] = useState<'idle' | 'generating' | 'pending' | 'success' | 'failed'>('idle');
	const [error, setError] = useState<string | null>(null);
	const [timeLeft, setTimeLeft] = useState(120); // 2 minutes timeout

	// ✅ useRef instead of useState for interval
	const paymentIntervalRef = useRef<number | null>(null);

	const defaultTitle = title || t('wallet.addMoney');
	const defaultDescription = description || t('wallet.proceed');

	useEffect(() => {
		if (isOpen && amount > 0) {
			initiatePayment();
		}

		return () => {
			if (paymentIntervalRef.current) {
				clearInterval(paymentIntervalRef.current);
				paymentIntervalRef.current = null;
			}
		};
	}, [isOpen, amount]);

	useEffect(() => {
		if (paymentStatus === 'pending' && timeLeft > 0) {
			const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
			return () => clearTimeout(timer);
		} else if (timeLeft === 0 && paymentStatus === 'pending') {
			setPaymentStatus('failed');
			setError(t('error.timeout'));
			onError?.(t('error.timeout'));
		}
	}, [timeLeft, paymentStatus, onError, t]);

	const initiatePayment = async () => {
		if (!user?.id || !user?.auth_token || amount <= 0) return;

		setPaymentStatus('generating');
		setError(null);
		setTimeLeft(120);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($amount: String = "", $target_app_android: String = "", $user_id: uuid = "") {
              __typename
              whatsubCreateUPIIntentRequest(request: {amount: $amount, target_app_android: $target_app_android, user_id: $user_id}) {
                __typename
                payment_id
                payment_type
                upiUrl
              }
            }
          `,
					variables: {
						amount: Math.round(amount * 100).toString(),
						target_app_android: "",
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.errors && data.errors.length > 0) {
				const errorMessage = data.errors[0].message || t('error.serverError');
				throw new Error(errorMessage);
			}

			const paymentData = data.data?.whatsubCreateUPIIntentRequest as PaymentResponse;

			if (paymentData?.upiUrl) {
				setPaymentUrl(paymentData.upiUrl);
				setPaymentStatus('pending');

				// ✅ store interval in ref
				paymentIntervalRef.current = window.setInterval(() => {
					checkPaymentStatus(paymentData.payment_id, paymentData.payment_type);
				}, 3000);
			} else {
				throw new Error(t('wallet.paymentFailed'));
			}
		} catch (error) {
			console.error('Error initiating payment:', error);
			setError(t('wallet.paymentFailed'));
			setPaymentStatus('failed');
			onError?.(t('wallet.paymentFailed'));
		}
	};

	const checkPaymentStatus = async (paymentId: string, paymentType: string) => {
		if (!user?.id || !user?.auth_token) return;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($payment_type: String = "", $user_id: uuid = "", $payment_id: String = "", $payment_token_id: String = "") {
              __typename
              w_verifyOrder(request: {payment_id: $payment_id, user_id: $user_id, payment_type: $payment_type, payment_token_id: $payment_token_id}) {
                __typename
                affected_rows
              }
            }
          `,
					variables: {
						payment_id: paymentId,
						user_id: user.id,
						payment_type: paymentType,
						payment_token_id: ""
					}
				})
			});

			const data = await response.json();

			if (!data.errors) {
				setPaymentStatus('success');

				// ✅ clear interval safely
				if (paymentIntervalRef.current) {
					console.log("Payment interval cleared");
					clearInterval(paymentIntervalRef.current);
					paymentIntervalRef.current = null;
				}

				onSuccess?.();

				setTimeout(() => {
					handleClose();
				}, 1000);
			}
		} catch (error) {
			console.error('Error checking payment status:', error);
		}
	};

	const handleClose = () => {
		if (paymentIntervalRef.current) {
			clearInterval(paymentIntervalRef.current);
			paymentIntervalRef.current = null;
		}
		setPaymentUrl(null);
		setPaymentStatus('idle');
		setError(null);
		setTimeLeft(120);
		onClose();
	};

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-dark-500 rounded-xl md:rounded-2xl w-full max-w-lg relative border border-gray-700 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-700">
					<div>
						<h3 className="text-lg md:text-xl font-bold">{defaultTitle}</h3>
						<p className="text-gray-400 text-xs md:text-sm mt-1">{t('wallet.enterAmount')}: ₹{amount.toFixed(2)}</p>
					</div>
					<button
						onClick={handleClose}
						className="text-gray-400 hover:text-white transition-colors p-1.5 md:p-2 hover:bg-dark-400 rounded-lg"
					>
						<X className="h-4 w-4 md:h-5 md:w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 md:p-6">
					{paymentStatus === 'generating' && (
						<div className="text-center py-6 md:py-8">
							<div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3 md:mb-4"></div>
							<p className="text-gray-300 text-sm md:text-base">{t('common.loading')}</p>
						</div>
					)}

					{paymentStatus === 'pending' && paymentUrl && (
						<div className="text-center">
							<p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">{defaultDescription}</p>

							{/* QR Code */}
							<div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl mb-3 md:mb-4 inline-block">
								<QRCodeSVG
									value={paymentUrl}
									size={window.innerWidth < 640 ? 160 : 200}
									level="H"
									includeMargin={true}
								/>
							</div>

							{/* Timer */}
							<div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
								<Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-400" />
								<span className="text-orange-400 font-medium text-sm md:text-base">
									{t('payments.timeRemaining')}: {formatTime(timeLeft)}
								</span>
							</div>

							{/* Status */}
							<div className="rounded-lg p-2.5 md:p-3 mb-3 md:mb-4">
								<div className="flex items-center gap-2 text-blue-400 text-xs md:text-sm">
									<div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
									<span>{t('payments.waitingConfirmation')}</span>
								</div>
							</div>

							<p className="text-gray-400 text-xs md:text-sm">
								{t('payments.dontClose')}
							</p>
						</div>
					)}

					{paymentStatus === 'success' && (
						<div className="text-center py-6 md:py-8">
							<div className="w-12 h-12 md:w-16 md:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
								<CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
							</div>
							<h4 className="text-lg md:text-xl font-bold text-green-400 mb-2">{t('wallet.paymentSuccess')}</h4>
							<p className="text-gray-300 text-sm md:text-base">{t('success.completed')}</p>
						</div>
					)}

					{paymentStatus === 'failed' && (
						<div className="text-center py-6 md:py-8">
							<div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
								<AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-red-400" />
							</div>
							<h4 className="text-lg md:text-xl font-bold text-red-400 mb-2">{t('wallet.paymentFailed')}</h4>
							<p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">{error || t('error.unknown')}</p>
							<button
								onClick={initiatePayment}
								className="btn btn-primary text-sm md:text-base"
							>
								{t('common.retry')}
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default QRPaymentModal;