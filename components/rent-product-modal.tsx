import { useState } from 'react';
import { X, AlertCircle, Loader2, Wallet } from 'lucide-react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useRentPrice } from '@/lib/hooks/rent/use-rent-price';
import { useAuthStore } from '@/lib/store/auth-store';
import { useWalletBalance } from '@/lib/hooks/wallet/use-wallet-balance';
import { DateTimePicker } from '@/components/date-time-picker';

interface RentProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	productName: string;
	productLocationId: string;
	onConfirm: (startTime: string, endTime: string) => void;
}

interface PriceData {
	currency: string;
	duration: {
		days: number;
		hours: number;
		months: number;
		weeks: number;
	};
	price_per_unit: {
		days: number;
		hours: number;
		months: number;
		weeks: number;
	};
	product_id: string;
	total_price: number;
}

const RentProductModal = ({
	isOpen,
	onClose,
	productLocationId,
	productName,
	onConfirm
}: RentProductModalProps) => {
	const [startDate, setStartDate] = useState<Date | undefined>(new Date());
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);
	const { user } = useAuthStore();

	const formatToISOString = (date?: Date) => {
		if (!date) return '';
		return date.toISOString();
	};

	const { data: priceData, isLoading: isPriceLoading, error: priceError } = useRentPrice({
		start_time: formatToISOString(startDate),
		end_time: formatToISOString(endDate),
		product_location_id: productLocationId,
		user_id: user?.id || '',
		auth_token: user?.auth_token
	});


	const { data: walletData } = useWalletBalance({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	if (!isOpen) return null;

	const isValidRentalPeriod = () => {
		if (!startDate || !endDate) return false;

		const diffMs = endDate.getTime() - startDate.getTime();
		const diffDays = diffMs / (1000 * 60 * 60 * 24);

		return diffDays >= 1;
	};

	const handleConfirm = () => {
		if (isValidRentalPeriod() && priceData && startDate && endDate) {
			onConfirm(
				formatToISOString(startDate),
				formatToISOString(endDate)
			);
			onClose();
		}
	};

	const renderPriceBreakdown = () => {
		const validPeriod = isValidRentalPeriod();

		if (isPriceLoading && validPeriod) {
			return (
				<SkeletonTheme baseColor="#2a2a2a" highlightColor="#3a3a3a" duration={1.5}>
					<div className="bg-linear-to-br from-dark-400 to-dark-500 rounded-lg p-4 border border-gray-700">
						<div className="mb-3">
							<Skeleton width={120} height={14} />
						</div>
						<div className="space-y-2 mb-4">
							<div className="flex justify-between items-center">
								<Skeleton width={150} height={14} />
								<Skeleton width={80} height={14} />
							</div>
							<div className="flex justify-between items-center">
								<Skeleton width={140} height={14} />
								<Skeleton width={75} height={14} />
							</div>
							<div className="flex justify-between items-center">
								<Skeleton width={145} height={14} />
								<Skeleton width={78} height={14} />
							</div>
							<div className="flex justify-between items-center">
								<Skeleton width={155} height={14} />
								<Skeleton width={82} height={14} />
							</div>
						</div>
						<div className="pt-3 border-t border-gray-600 space-y-3">
							<div className="flex justify-between items-center">
								<Skeleton width={110} height={16} />
								<Skeleton width={100} height={20} />
							</div>
							{walletData && walletData.unlocked_amount > 0 && (
								<>
									<div className="flex justify-between items-center">
										<Skeleton width={120} height={14} />
										<Skeleton width={90} height={14} />
									</div>
									<div className="pt-3 border-t border-gray-600">
										<div className="flex justify-between items-center">
											<Skeleton width={120} height={16} />
											<Skeleton width={120} height={24} />
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</SkeletonTheme>
			);
		}

		if (priceError && validPeriod) {
			return (
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
					<div className="flex items-start gap-2 text-red-400 text-sm">
						<AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
						<p>Unable to fetch price. Please try again.</p>
					</div>
				</div>
			);
		}

		const price = priceData as PriceData | undefined;
		const showBlurred = !validPeriod || !price;

		return (
			<div className="bg-linear-to-br from-dark-400 to-dark-500 rounded-lg p-4 border border-gray-700">
				<h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
					Price Breakdown
				</h4>

				<div className="space-y-2 mb-4">
					<div className={`flex justify-between text-sm ${showBlurred ? 'opacity-40' : price && price.duration.months === 0 ? 'opacity-40' : ''}`}>
						<span className="text-gray-400">
							{price ? price.duration.months : 0} {(!price || price.duration.months === 1) ? 'month' : 'months'} × <span className={showBlurred ? 'blur-sm select-none' : ''}>₹{price ? price.price_per_unit.months : '---'}</span>
						</span>
						<span className={`text-white font-medium ${showBlurred ? 'blur-sm select-none' : ''}`}>
							₹{price ? (price.duration.months * price.price_per_unit.months).toFixed(2) : '0.00'}
						</span>
					</div>
					<div className={`flex justify-between text-sm ${showBlurred ? 'opacity-40' : price && price.duration.weeks === 0 ? 'opacity-40' : ''}`}>
						<span className="text-gray-400">
							{price ? price.duration.weeks : 0} {(!price || price.duration.weeks === 1) ? 'week' : 'weeks'} × <span className={showBlurred ? 'blur-sm select-none' : ''}>₹{price ? price.price_per_unit.weeks : '---'}</span>
						</span>
						<span className={`text-white font-medium ${showBlurred ? 'blur-sm select-none' : ''}`}>
							₹{price ? (price.duration.weeks * price.price_per_unit.weeks).toFixed(2) : '0.00'}
						</span>
					</div>
					<div className={`flex justify-between text-sm ${showBlurred ? 'opacity-40' : price && price.duration.days === 0 ? 'opacity-40' : ''}`}>
						<span className="text-gray-400">
							{price ? price.duration.days : 0} {(!price || price.duration.days === 1) ? 'day' : 'days'} × <span className={showBlurred ? 'blur-sm select-none' : ''}>₹{price ? price.price_per_unit.days : '---'}</span>
						</span>
						<span className={`text-white font-medium ${showBlurred ? 'blur-sm select-none' : ''}`}>
							₹{price ? (price.duration.days * price.price_per_unit.days).toFixed(2) : '0.00'}
						</span>
					</div>
					<div className={`flex justify-between text-sm ${showBlurred ? 'opacity-40' : price && price.duration.hours === 0 ? 'opacity-40' : ''}`}>
						<span className="text-gray-400">
							{price ? price.duration.hours : 0} {(!price || price.duration.hours === 1) ? 'hour' : 'hours'} × <span className={showBlurred ? 'blur-sm select-none' : ''}>₹{price ? price.price_per_unit.hours : '---'}</span>
						</span>
						<span className={`text-white font-medium ${showBlurred ? 'blur-sm select-none' : ''}`}>
							₹{price ? (price.duration.hours * price.price_per_unit.hours).toFixed(2) : '0.00'}
						</span>
					</div>
				</div>

				<div className="pt-3 border-t border-gray-600 space-y-3">
					<div className="flex justify-between items-center">
						<span className="text-base font-bold text-white">Total Amount</span>
						<span className={`text-xl font-bold text-white ${showBlurred ? 'blur-sm select-none' : ''}`}>
							₹{price ? price.total_price.toFixed(2) : '0.00'}
						</span>
					</div>

					{walletData && walletData.unlocked_amount > 0 && (
						<>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-400 flex items-center gap-2">
									<Wallet className="h-4 w-4" />
									Wallet Balance
								</span>
								<span className="text-sm text-green-400 font-medium">
									₹{(walletData.unlocked_amount / 100).toFixed(2)}
								</span>
							</div>

							<div className="pt-3 border-t border-gray-600">
								<div className="flex justify-between items-center">
									<span className="text-base font-bold text-white">Amount to Pay</span>
									<span className={`text-2xl font-bold text-[#2CFF05] ${showBlurred ? 'blur-sm select-none' : ''}`}>
										₹{price ? Math.max(0, price.total_price - (walletData.unlocked_amount / 100)).toFixed(2) : '0.00'}
									</span>
								</div>
							</div>
						</>
					)}

					{(!walletData || walletData.unlocked_amount === 0) && (
						<div className="text-xs text-gray-500 text-center">
							No wallet balance available
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

			<div className="relative bg-dark-500 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
				<div className="sticky top-0 bg-dark-500 border-b border-gray-700 p-4 md:p-6 flex items-center justify-between z-10">
					<div>
						<h2 className="text-xl md:text-2xl font-bold">Rent {productName}</h2>
						<p className="text-sm text-gray-400 mt-1">Select your rental period</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
					>
						<X className="h-5 w-5 md:h-6 md:w-6" />
					</button>
				</div>

				<div className="p-4 md:p-6">
					<div className="mb-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<DateTimePicker
								value={startDate}
								onChange={setStartDate}
								label="Start Date & Time"
							/>

							<DateTimePicker
								value={endDate}
								onChange={setEndDate}
								label="End Date & Time"
								minDate={startDate}
							/>
						</div>

						{startDate && endDate && !isValidRentalPeriod() && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
								<div className="flex items-start gap-2 text-red-400 text-xs md:text-sm">
									<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
									<p>Rental period must be at least 1 day (24 hours)</p>
								</div>
							</div>
						)}
					</div>

					{renderPriceBreakdown()}

					<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 mt-4 border-t border-gray-700">
						<button
							onClick={onClose}
							className="flex-1 px-4 py-2.5 sm:py-3 bg-dark-400 hover:bg-dark-300 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
						>
							Cancel
						</button>
						<button
							onClick={handleConfirm}
							disabled={!isValidRentalPeriod() || isPriceLoading || !priceData}
							className={`flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${isValidRentalPeriod() && !isPriceLoading && priceData
									? 'bg-blue-500 hover:bg-blue-600 text-white'
									: 'bg-gray-600 text-gray-400 cursor-not-allowed'
								}`}
						>
							{isPriceLoading ? (
								<span className="flex items-center justify-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									<span className="hidden xs:inline">Loading...</span>
								</span>
							) : !isValidRentalPeriod() ? (
								'Select Valid Period'
							) : (
								'Continue to Checkout'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RentProductModal;
