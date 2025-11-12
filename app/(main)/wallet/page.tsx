'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowRight, ArrowDown, ArrowUp, Clock, WalletCards } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import QRPaymentModal from '@/components/qr-payment-modal';
import WithdrawMoneyModal from './withdraw-money-modal';
import { useLanguageStore } from '@/lib/store/language-store';
import TransactionsSkeleton from './transactions-skeleton';
import { useWalletBalance, WALLET_BALANCE_BASE_KEY } from "@/lib/hooks/wallet/use-wallet-balance";
import { useTransactions } from "@/lib/hooks/wallet/use-transactions";
import Skeleton from 'react-loading-skeleton';
import ProtectedRoute from '@/components/protected-route';


interface TransactionsSectionProps {
	userId?: string;
	authToken?: string;
}

const TransactionsSection = ({ userId, authToken }: TransactionsSectionProps) => {
	const { t } = useLanguageStore();
	const transactionScrollRef = useRef<HTMLDivElement>(null);

	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		status,
	} = useTransactions({ userId, authToken });

	const transactionPages = data?.pages || [];

	useEffect(() => {
		const scrollContainer = transactionScrollRef.current;
		if (!scrollContainer) return;

		const handleScroll = () => {
			if (isFetchingNextPage || !hasNextPage) return;

			const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
			if (scrollHeight - scrollTop - clientHeight < 100) {
				fetchNextPage();
			}
		};

		scrollContainer.addEventListener('scroll', handleScroll);
		return () => scrollContainer.removeEventListener('scroll', handleScroll);
	}, [isFetchingNextPage, hasNextPage]);

	const getTransactionIcon = (purpose: string, amount: number) => {
		const isPositive = amount > 0;

		if (purpose.toLowerCase().includes('group') || purpose.toLowerCase().includes('left') || purpose.toLowerCase().includes('joined')) {
			return isPositive ? (
				<div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
					<ArrowDown className="h-5 w-5 text-white" />
				</div>
			) : (
				<div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
					<ArrowUp className="h-5 w-5 text-white" />
				</div>
			);
		}

		return isPositive ? (
			<div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
				<Plus className="h-5 w-5 text-white" />
			</div>
		) : (
			<div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
				<ArrowUp className="h-5 w-5 text-white" />
			</div>
		);
	};

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold text-white flex items-center gap-2">
				<Clock className="h-5 w-5 text-slate-400" />
				{t('wallet.recentTransactions')}
			</h2>
			{status === "pending" ? (
				<TransactionsSkeleton count={6} />
			) : transactionPages.length === 0 ? (
				<div className="text-center py-12 text-gray-400">
					<div className="w-14 h-14 mx-auto mb-3 bg-slate-800/30 rounded-full flex items-center justify-center">
						<Clock className="h-7 w-7 text-gray-600" />
					</div>
					<p className="text-sm">{t('wallet.noTransactions')}</p>
				</div>
			) : (
				<div
					ref={transactionScrollRef}
					className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-2 hide-scrollbar"
				>
					{transactionPages.map((transactionPage) => {
						return (
							transactionPage.transactions?.map((transaction) => (
								<div
									key={transaction.id}
									className="group relative bg-slate-800/20 hover:bg-slate-800/40 px-4 py-3 rounded-xl border-l-4 border-l-transparent hover:border-l-slate-500 transition-all duration-200"
								>
									<div className="flex items-center gap-4">
										<div className="shrink-0">
											{getTransactionIcon(transaction.purpose, transaction.amount)}
										</div>
										<div className="flex-1 min-w-0">
											<h4 className="text-xs md:text-sm lg:text-base font-medium text-white mb-0.5 md:mb-1 truncate">{transaction.purpose}</h4>
											<p className="text-[10px] md:text-xs text-gray-400">
												{new Date(transaction.created_at).toLocaleString()}
											</p>
										</div>

										<div className="text-right shrink-0">
											<span className={`text-xs md:text-sm lg:text-base font-bold ${transaction.amount > 0
												? 'text-[#2CFF05]'
												: 'text-red-400'
												}`}>
												{transaction.amount > 0 ? '+₹' : '-₹'}
												{Math.abs(transaction.amount / 100).toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							))
						)
					})}
					{isFetchingNextPage && (
						<div className="text-center py-6">
							<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-500 mx-auto"></div>
							<p className="text-xs text-gray-400 mt-3">Loading more...</p>
						</div>
					)}

					{!hasNextPage && transactionPages.length > 0 && (
						<div className="text-center py-6">
							<div className="w-10 h-0.5 mx-auto bg-slate-700/50 rounded-full mb-2"></div>
							<p className="text-xs text-gray-500">No more transactions</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

const WalletPage = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();

	const queryClient = useQueryClient();

	const [amount, setAmount] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);

	const {
		data: walletBalance,
		isLoading: isWalletBalanceLoading
	} = useWalletBalance({ userId: user?.id, authToken: user?.auth_token });

	const handleWithdrawClick = () => {
		setShowWithdrawModal(true);
	};

	const handleQuickAdd = (value: number) => {
		setAmount((value).toString());
	};

	const handleAddMoney = async () => {
		const amountToAdd = parseFloat(amount);
		if (isNaN(amountToAdd) || amountToAdd <= 0) {
			setError(t('error.invalidInput'));
			return;
		}

		setShowPaymentModal(true);
	};

	const handlePaymentSuccess = () => {
		setAmount('');
		setError(null);
		queryClient.invalidateQueries({ queryKey: [WALLET_BALANCE_BASE_KEY] });
	};

	const handlePaymentError = (errorMessage: string) => {
		setError(errorMessage);
	};

	const handleWithdrawSuccess = () => {
		queryClient.invalidateQueries({ queryKey: [WALLET_BALANCE_BASE_KEY] });
	};



	return (
		<div className="max-w-[2000px] mx-auto pt-20 md:pt-16 min-h-screen pb-8 px-4">
			<div className="max-w-[1600px] mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					<div className="lg:col-span-1 space-y-8">
						{/* Wallet Balance Card */}
						<div className="rounded-2xl px-4 md:px-8">
							<p className="text-[10px] md:text-xs text-slate-400 mb-2 md:mb-3 uppercase tracking-wider font-medium">{t('wallet.title')}</p>
							<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 lg:mb-8">
								{isWalletBalanceLoading ? (
									<Skeleton width={180} height={48} />
								) : (
									'₹' + (walletBalance.total_amount / 100).toFixed(2)
								)}
							</h1>
							<div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
								<div className="rounded-xl">
									<p className="text-[10px] md:text-xs text-slate-400 mb-1 md:mb-2 uppercase tracking-wide">{t('wallet.locked')}</p>
									<p className="text-base md:text-lg lg:text-xl font-bold text-orange-400">
										{isWalletBalanceLoading ? (
											<Skeleton width={70} height={20} />
										) : (
											'₹' + (walletBalance.locked_amount / 100).toFixed(2)
										)}
									</p>
								</div>
								<div className="rounded-xl">
									<p className="text-[10px] md:text-xs text-slate-400 mb-1 md:mb-2 uppercase tracking-wide">{t('wallet.unlocked')}</p>
									<p className="text-base md:text-lg lg:text-xl font-bold text-green-600">
										{isWalletBalanceLoading ? (
											<Skeleton width={70} height={20} />
										) : (
											'₹' + (walletBalance.unlocked_amount / 100).toFixed(2)
										)}
									</p>
								</div>
							</div>
							<button
								onClick={handleWithdrawClick}
								className="w-full flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 border border-slate-500/50 rounded-3xl transition-all duration-200 text-white text-sm md:text-base font-semibold bg-violet-600 hover:bg-violet-800"
							>
								<WalletCards className="h-4 w-4 md:h-5 md:w-5" />
								<span>Withdraw</span>
							</button>
						</div>

						{/* Divider */}
						<div className="border-t border-gray-700"></div>

						{/* Add Money Section */}
						<div className="rounded-2xl p-4 md:p-6 lg:p-8">
							<h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">{t('wallet.addMoney')}</h2>
							<div className="space-y-3 md:space-y-4 lg:space-y-5">
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 md:pl-5 flex items-center pointer-events-none">
										<span className="text-gray-400 text-base md:text-lg lg:text-xl font-semibold">₹</span>
									</div>
									<input
										type="number"
										value={amount}
										min="0"
										onChange={(e) => setAmount(e.target.value)}
										placeholder={t('wallet.enterAmount')}
										className="w-full bg-transparent text-white text-sm md:text-base font-medium border-2 border-slate-700/50 focus:border-slate-500 rounded-xl pl-9 pr-3 md:pr-5 py-2 md:py-2.5 outline-none transition-all duration-300 placeholder:text-slate-500 no-arrows"
									/>
								</div>

								<div className="flex items-center gap-2 md:gap-3">
									{[100, 200, 500, 1000].map((value) => (
										<button
											key={value}
											onClick={() => handleQuickAdd(value)}
											className="group bg-transparent hover:bg-slate-800/30 text-white border border-slate-700/50 hover:border-slate-500 rounded-3xl px-2 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 text-xs md:text-sm lg:text-base font-semibold transition-all duration-200 flex items-center gap-1 md:gap-1.5"
										>
											<Plus className="h-3 w-3 md:h-4 md:w-4" />
											₹{value}
										</button>
									))}
								</div>

								<button
									onClick={handleAddMoney}
									disabled={!amount}
									className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white font-semibold text-sm md:text-base rounded-3xl px-4 md:px-6 py-2.5 md:py-3 lg:py-3.5 transition-all duration-200 flex items-center justify-center gap-2"
								>
									<span>{t('wallet.proceed')}</span>
									<ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
								</button>

								{error && (
									<div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
										<p className="text-sm text-red-400">{error}</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Column - Transactions */}
					<div className="lg:col-span-1">
						<TransactionsSection
							userId={user?.id}
							authToken={user?.auth_token}
						/>
					</div>
				</div>
			</div>

			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={parseFloat(amount) || 0}
				onSuccess={handlePaymentSuccess}
				onError={handlePaymentError}
				title={t('wallet.addMoney')}
				description={t('wallet.scanQR')}
			/>

			<WithdrawMoneyModal
				isOpen={showWithdrawModal}
				onClose={() => setShowWithdrawModal(false)}
				onSuccess={handleWithdrawSuccess}
			/>
		</div>
	);
};


const ProtectedWalletPage = () => {
	return (
		<ProtectedRoute>
			<WalletPage />
		</ProtectedRoute>	
	)
}

export default ProtectedWalletPage;