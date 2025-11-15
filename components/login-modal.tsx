import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, CircleAlert as AlertCircle, X } from 'lucide-react';
import { useAuthStore, initiatePhoneAuth, verifyOTP } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { saveQuickAddress } from '@/lib/utils/saveQuickAddress';
import Modal from './modal';

enum AuthStep {
	PHONE_INPUT,
	OTP_INPUT,
}

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

const LoginModal = ({ isOpen, onClose, onSuccess }: LoginModalProps) => {
	const { t } = useLanguageStore();
	const [step, setStep] = useState<AuthStep>(AuthStep.PHONE_INPUT);
	const [phone, setPhone] = useState('');
	const [otp, setOtp] = useState(['', '', '', '', '', '']);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { phoneNumber, isAuthenticated } = useAuthStore();
	const { isOnline } = useNetworkStatus();

	useEffect(() => {
		if (isAuthenticated) {
			if (onSuccess) {
				onSuccess();
			}
			handleClose();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated]);

	useEffect(() => {
		if (!isOpen) {
			setStep(AuthStep.PHONE_INPUT);
			setPhone('');
			setOtp(['', '', '', '', '', '']);
			setError(null);
		}
	}, [isOpen]);

	const handleClose = () => {
		if (!isLoading) {
			onClose();
		}
	};

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
		} catch (e: unknown) {
			setError((e as Error).message || t('error.serverError'));
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

		if (value && index < 5) {
			const nextInput = document.getElementById(`modal-otp-${index + 1}`);
			if (nextInput) {
				nextInput.focus();
			}
		}
	};

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			const prevInput = document.getElementById(`modal-otp-${index - 1}`);
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
			const userDetails = await verifyOTP(phoneNumber, otpValue);

			if (userDetails?.success) {
				saveQuickAddress(userDetails)

				if (onSuccess) {
					onSuccess();
				}

				handleClose();
			} else {
				setError(t('auth.otp.invalid'));
			}
		} catch (e: unknown) {
			setError((e as Error).message || t('auth.otp.invalid'));
		} finally {
			setOtp(['', '', '', '', '', '']);
			const first = document.getElementById(`modal-otp-0`);
			first?.focus();
			setIsLoading(false);
		}
	};


	return (
		<Modal
			open={isOpen}
			onClose={onClose}
		>
			<div className="bg-dark-500 p-4 xs:p-5 sm:p-8 rounded-2xl">

				<button
					onClick={onClose}
					className="absolute top-8 right-8 p-1 rounded-lg text-gray-400 hover:text-gray-300"
				>
					<X />
				</button>
				<div className="text-center mb-4 sm:mb-6">
					<div className="flex justify-center mb-2 sm:mb-3">
						<Image
							src="/subspace-hor_002.svg"
							alt="Subspace"
							width={160}
							height={40}
							className="h-6 xs:h-7 sm:h-8 w-auto"
						/>
					</div>
					<p className="text-gray-300 text-xs xs:text-sm sm:text-base">{t('auth.subtitle')}</p>
				</div>
				<div className=''>
					{step === AuthStep.PHONE_INPUT && (
						<form onSubmit={handlePhoneSubmit}>
							<div className="mb-4 sm:mb-6">
								<label htmlFor="modal-phone" className="block text-xs xs:text-sm font-medium mb-2 sm:mb-3 text-gray-300">
									{t('auth.phone.label')}
								</label>
								<div className="relative group">
									<div className="absolute inset-0 bg-linear-to-r from-indigo-500/20 to-purple-500/20 rounded-lg sm:rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<input
										type="tel"
										id="modal-phone"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder={t('auth.phone.placeholder')}
										className="relative w-full bg-dark-400/80 backdrop-blur-sm text-white border border-gray-600/50 rounded-lg sm:rounded-xl px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 placeholder-gray-400 hover:border-gray-500/70"
										required
									/>
									<div className="absolute right-3 xs:right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
										<svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
											/>
										</svg>
									</div>
								</div>
								<p className="text-gray-400 text-xs xs:text-sm mt-2 sm:mt-3 flex items-center gap-1.5 xs:gap-2">
									<svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
								<div className="mb-4 sm:mb-6 p-2.5 xs:p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg sm:rounded-xl flex items-start backdrop-blur-sm animate-fade-in">
									<AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 mr-2 xs:mr-3 mt-0.5 text-red-400 shrink-0" />
									<span className="text-xs xs:text-sm">{error}</span>
								</div>
							)}

							<button
								type="submit"
								className="w-full py-2.5 xs:py-3 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 xs:gap-3 text-sm xs:text-base"
								disabled={isLoading || !isOnline}
							>
								{isLoading ? (
									<span className="flex items-center justify-center gap-2 xs:gap-3">
										<div className="animate-spin rounded-full h-4 w-4 xs:h-5 xs:w-5 border-t-2 border-b-2 border-white"></div>
										<span className="text-xs xs:text-sm sm:text-base">{t('auth.sending')}</span>
									</span>
								) : !isOnline ? (
									<span className="flex items-center justify-center gap-1.5 xs:gap-2">
										<svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z"
											/>
										</svg>
										<span className="text-xs xs:text-sm">No Internet</span>
									</span>
								) : (
									<span className="flex items-center justify-center gap-2 xs:gap-3">
										<span className="text-xs xs:text-sm sm:text-base">{t('common.continue')}</span>
										<ArrowRight className="h-4 w-4 xs:h-5 xs:w-5 transition-transform group-hover:translate-x-1" />
									</span>
								)}
							</button>
						</form>
					)}

					{step === AuthStep.OTP_INPUT && (
						<form onSubmit={handleOtpSubmit}>
							<div className="mb-4 sm:mb-6">
								<h2 className="text-lg xs:text-xl font-bold mb-2 sm:mb-3 text-white">{t('auth.otp.title')}</h2>
								<p className="text-gray-300 text-xs xs:text-sm mb-4 sm:mb-6 flex items-start gap-1.5 xs:gap-2">
									<svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
										/>
									</svg>
									<span>{t('auth.otp.subtitle')} {phoneNumber}</span>
								</p>

								<div className="flex justify-between gap-1.5 xs:gap-2 mb-3 sm:mb-4">
									{otp.map((digit, index) => (
										<input
											key={index}
											id={`modal-otp-${index}`}
											type="text"
											inputMode="numeric"
											maxLength={1}
											value={digit}
											onChange={(e) => handleOtpChange(index, e.target.value)}
											onKeyDown={(e) => handleOtpKeyDown(index, e)}
											className="flex-1 min-w-0 h-11 xs:h-12 sm:h-14 bg-dark-400/80 backdrop-blur-sm border border-gray-600/50 rounded-lg text-center text-lg xs:text-xl font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-gray-500/70"
											autoFocus={index === 0}
										/>
									))}
								</div>

								<button
									type="button"
									className="text-indigo-400 hover:text-indigo-300 text-xs xs:text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 xs:gap-2"
									onClick={() => {
										setStep(AuthStep.PHONE_INPUT);
										setError(null);
									}}
								>
									<svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
									</svg>
									{t('auth.otp.change')}
								</button>
							</div>

							{error && (
								<div className="mb-4 sm:mb-6 p-2.5 xs:p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg sm:rounded-xl flex items-start backdrop-blur-sm animate-fade-in">
									<AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 mr-2 xs:mr-3 mt-0.5 text-red-400 shrink-0" />
									<span className="text-xs xs:text-sm">{error}</span>
								</div>
							)}

							<button
								type="submit"
								className="w-full py-2.5 xs:py-3 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 xs:gap-3 text-sm xs:text-base"
								disabled={isLoading || !isOnline}
							>
								{isLoading ? (
									<span className="flex items-center justify-center gap-2 xs:gap-3">
										<div className="animate-spin rounded-full h-4 w-4 xs:h-5 xs:w-5 border-t-2 border-b-2 border-white"></div>
										<span className="text-xs xs:text-sm sm:text-base">{t('auth.verifying')}</span>
									</span>
								) : !isOnline ? (
									<span className="flex items-center justify-center gap-1.5 xs:gap-2">
										<svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z"
											/>
										</svg>
										<span className="text-xs xs:text-sm">No Internet</span>
									</span>
								) : (
									<span className="flex items-center justify-center gap-2 xs:gap-3">
										<span className="text-xs xs:text-sm sm:text-base">{t('auth.verify')}</span>
										<ArrowRight className="h-4 w-4 xs:h-5 xs:w-5 transition-transform group-hover:translate-x-1" />
									</span>
								)}
							</button>
						</form>
					)}
				</div>
			</div>
		</Modal>
	);
};

export default LoginModal;
