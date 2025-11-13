'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react';
import { useAuthStore, initiatePhoneAuth, verifyOTP } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';

enum AuthStep {
	PHONE_INPUT,
	OTP_INPUT,
	VERIFIED,
}

const AuthPageContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useLanguageStore();
	const [step, setStep] = useState<AuthStep>(AuthStep.PHONE_INPUT);
	const [phone, setPhone] = useState('');
	const [otp, setOtp] = useState(['', '', '', '', '', '']);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { phoneNumber, requestId, setPhoneNumber, setRequestId, isAuthenticated } = useAuthStore();
	const { isOnline } = useNetworkStatus();

	// Get redirect path from URL params
	const redirectPath = searchParams.get('redirect') || '/';

	// If user is already authenticated, redirect them
	useEffect(() => {
		if (isAuthenticated) {
			router.push(redirectPath);
		}
	}, [isAuthenticated, router, redirectPath]);

	const handlePhoneSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!isOnline) {
			setError('No internet connection. Please check your network and try again.');
			return;
		}

		if (!phone) {
			setError(t('auth.phone.required'));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const success = await initiatePhoneAuth(phone);

			if (success) {
				setStep(AuthStep.OTP_INPUT);
			}
		} catch (err) {
			setError(t('error.serverError'));
		} finally {
			setIsLoading(false);
		}
	};

	const handleOtpChange = (index: number, value: string) => {
		if (value.length > 1) {
			value = value.slice(0, 1);
		}

		if (value && !/^\d+$/.test(value)) {
			return;
		}

		const newOtp = [...otp];
		newOtp[index] = value;
		setOtp(newOtp);

		// Auto-focus next input
		if (value && index < 5) {
			const nextInput = document.getElementById(`otp-${index + 1}`);
			if (nextInput) {
				nextInput.focus();
			}
		}
	};

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			const prevInput = document.getElementById(`otp-${index - 1}`);
			if (prevInput) {
				prevInput.focus();
			}
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!isOnline) {
			setError('No internet connection. Please check your network and try again.');
			return;
		}

		const otpValue = otp.join('');
		if (otpValue.length !== 6) {
			setError(t('auth.otp.required'));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const success = await verifyOTP(phoneNumber, otpValue);
			if (success) {
				setStep(AuthStep.VERIFIED);
				// Navigate to the redirect path or home
				router.push(redirectPath);
			} else {
				setError(t('auth.otp.invalid'));
			}
		} catch (err) {
			setError(t('auth.otp.invalid'));
		} finally {
			setOtp(['', '', '', '', '', '']);
			const first = document.getElementById(`otp-0`);
			first?.focus();
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-dark-600 via-dark-700 to-dark-800 flex items-center justify-center p-4 relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				{/* Floating Orbs */}
				<div className="absolute top-20 left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
				<div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
				<div className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
				<div className="absolute bottom-20 right-10 w-28 h-28 bg-pink-500/15 rounded-full blur-xl animate-pulse delay-700"></div>

				{/* Floating Lines */}
				<div className="absolute top-1/4 left-1/2 w-px h-20 bg-linear-to-b from-transparent via-indigo-400/30 to-transparent animate-pulse delay-200"></div>
				<div className="absolute bottom-1/4 right-1/4 w-16 h-px bg-linear-to-r from-transparent via-purple-400/30 to-transparent animate-pulse delay-800"></div>
			</div>

			<div className="w-full max-w-md">
				{/* Logo Section with Animation */}
				<div className="text-center mb-8 relative z-10">
					<div className="flex justify-center mb-4">
						<div className="p-6 rounded-2xl shadow-2xl animate-fade-in">
							<Image src="/subspace-hor_002.svg" alt="Subspace" width={160} height={40} className="h-10 w-auto" />
						</div>
					</div>
					{/*
		<h1 className="text-4xl font-bold bg-linear-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent animate-slide-up">
		  {t('auth.title')}
		</h1>
		*/}
					<p className="text-gray-300 mt-3 text-lg animate-slide-up delay-100">{t('auth.subtitle')}</p>
				</div>

				{/* Main Auth Card with Glass Effect */}
				<div className="rounded-2xl p-4 xs:p-6 sm:p-8 relative z-10 animate-slide-up delay-200">
					{/* Subtle Inner Glow */}
					<div className="absolute inset-0 rounded-2xl"></div>

					<div className="relative z-10">
						{step === AuthStep.PHONE_INPUT && (
							<form onSubmit={handlePhoneSubmit}>
								<div className="mb-8">
									<label htmlFor="phone" className="block text-sm font-medium mb-3 text-gray-300">
										{t('auth.phone.label')}
									</label>
									<div className="relative group">
										<div className="absolute inset-0 bg-linear-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										<input
											type="tel"
											id="phone"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											placeholder={t('auth.phone.placeholder')}
											className="relative w-full bg-dark-400/80 backdrop-blur-sm text-white border border-gray-600/50 rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 placeholder-gray-400 hover:border-gray-500/70"
											required
										/>
										{/* Phone Icon */}
										<div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
											<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
												/>
											</svg>
										</div>
									</div>
									<p className="text-gray-400 text-sm mt-3 flex items-center gap-2">
										<svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										{t('auth.phone.note')}
									</p>
								</div>

								{error && (
									<div className="mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-center backdrop-blur-sm animate-fade-in">
										<AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-red-400 shrink-0" />
										<span className="text-sm sm:text-base">{error}</span>
									</div>
								)}

								<button
									type="submit"
									className="w-full py-3 sm:py-4 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg"
									disabled={isLoading || !isOnline}
								>
									{isLoading ? (
										<span className="flex items-center justify-center gap-2 sm:gap-3">
											<div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-t-2 border-b-2 border-white"></div>
											{t('auth.sending')}
										</span>
									) : !isOnline ? (
										<span className="flex items-center justify-center gap-2">
											<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z"
												/>
											</svg>
											No Internet Connection
										</span>
									) : (
										<span className="flex items-center justify-center gap-2 sm:gap-3">
											{t('common.continue')}
											<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
										</span>
									)}
								</button>
							</form>
						)}

						{step === AuthStep.OTP_INPUT && (
							<form onSubmit={handleOtpSubmit}>
								<div className="mb-8">
									<h2 className="text-xl font-bold mb-3 text-white">{t('auth.otp.title')}</h2>
									<p className="text-gray-300 text-sm mb-6 flex items-center gap-2">
										<svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/>
										</svg>
										{t('auth.otp.subtitle')} {phoneNumber}
									</p>

									<div className="flex justify-between gap-1.5 xs:gap-2 sm:gap-3 mb-4">
										{otp.map((digit, index) => (
											<input
												key={index}
												id={`otp-${index}`}
												type="text"
												inputMode="numeric"
												maxLength={1}
												value={digit}
												onChange={(e) => handleOtpChange(index, e.target.value)}
												onKeyDown={(e) => handleOtpKeyDown(index, e)}
												className="flex-1 min-w-0 h-12 xs:h-13 sm:h-14 bg-dark-400/80 backdrop-blur-sm border border-gray-600/50 rounded-lg sm:rounded-xl text-center text-lg xs:text-xl font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-gray-500/70"
												autoFocus={index === 0}
											/>
										))}
									</div>

									<button
										type="button"
										className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors duration-200 flex items-center gap-2"
										onClick={() => {
											setStep(AuthStep.PHONE_INPUT);
											setError(null);
										}}
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
										</svg>
										{t('auth.otp.change')}
									</button>
								</div>

								{error && (
									<div className="mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-center backdrop-blur-sm animate-fade-in">
										<AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-red-400 shrink-0" />
										<span className="text-sm sm:text-base">{error}</span>
									</div>
								)}

								<button
									type="submit"
									className="w-full py-3 sm:py-4 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg"
									disabled={isLoading || !isOnline}
								>
									{isLoading ? (
										<span className="flex items-center justify-center gap-2 sm:gap-3">
											<div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-t-2 border-b-2 border-white"></div>
											{t('auth.verifying')}
										</span>
									) : !isOnline ? (
										<span className="flex items-center justify-center gap-2">
											<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z"
												/>
											</svg>
											No Internet Connection
										</span>
									) : (
										<span className="flex items-center justify-center gap-2 sm:gap-3">
											{t('auth.verify')}
											<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
										</span>
									)}
								</button>
							</form>
						)}

						{step === AuthStep.VERIFIED && (
							<div className="text-center relative z-10 animate-fade-in">
								<div className="flex justify-center mb-4">
									<div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-2xl border border-green-500/30 animate-pulse">
										<CheckCircle className="h-10 w-10 text-green-400" />
									</div>
								</div>
								<h2 className="text-2xl font-bold mb-3 text-white">{t('auth.success.title')}</h2>
								<p className="text-gray-300 mb-8 text-lg">{t('auth.success.subtitle')}</p>
								<button
									onClick={() => router.push(redirectPath)}
									className="w-full py-3 sm:py-4 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg"
								>
									<CheckCircle className="h-5 w-5" />
									{t('common.continue')}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);

};

export default function AuthPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-linear-to-br from-dark-600 via-dark-700 to-dark-800 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
			</div>
		}>
			<AuthPageContent />
		</Suspense>
	);
}