'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Calendar, Filter, Search, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import ProtectedRoute from '@/components/protected-route';

interface CoinTransaction {
	amount: number;
	created_at: string;
	purpose: string;
}

const CoinTransactionsPage = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState<'all' | 'earned' | 'spent'>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	const ITEMS_PER_PAGE = 20;

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchTransactions(true);
		}
	}, [user?.id, user?.auth_token, filterType]);

	const fetchTransactions = async (reset = false) => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoading(true);
		setError(null);

		const offset = reset ? 0 : (currentPage - 1) * ITEMS_PER_PAGE;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery($user_id: uuid, $limit: Int, $offset: Int) {
              __typename
              whatsub_coins(where: {user_id: {_eq: $user_id}}, order_by: {created_at: desc_nulls_last}, limit: $limit, offset: $offset) {
                __typename
                amount
                created_at
                purpose
              }
            }
          `,
					variables: {
						user_id: user.id,
						limit: ITEMS_PER_PAGE,
						offset: offset
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(t('error.fetchTransactionsFailed'));
				return;
			}

			const newTransactions = data.data?.whatsub_coins || [];

			if (reset) {
				setTransactions(newTransactions);
				setCurrentPage(1);
			} else {
				setTransactions(prev => [...prev, ...newTransactions]);
			}

			setHasMore(newTransactions.length === ITEMS_PER_PAGE);
			if (!reset) {
				setCurrentPage(prev => prev + 1);
			}
		} catch (error) {
			console.error('Error fetching coin transactions:', error);
			setError(t('error.fetchTransactionsFailed'));
		} finally {
			setIsLoading(false);
		}
	};

	const loadMore = () => {
		if (!isLoading && hasMore) {
			fetchTransactions(false);
		}
	};

	const refreshTransactions = () => {
		fetchTransactions(true);
	};

	const filteredTransactions = transactions.filter(transaction => {
		const matchesSearch = transaction.purpose.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFilter =
			filterType === 'all' ||
			(filterType === 'earned' && transaction.amount > 0) ||
			(filterType === 'spent' && transaction.amount < 0);

		return matchesSearch && matchesFilter;
	});

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();

		if (date.toDateString() === today.toDateString()) {
			return `${t('common.today')}, ${date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			})}`;
		}

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === yesterday.toDateString()) {
			return `${t('common.yesterday')}, ${date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			})}`;
		}

		return date.toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
		});
	};

	const getTotalEarned = () => {
		return filteredTransactions
			.filter(t => t.amount > 0)
			.reduce((sum, t) => sum + t.amount, 0);
	};

	const getTotalSpent = () => {
		return Math.abs(filteredTransactions
			.filter(t => t.amount < 0)
			.reduce((sum, t) => sum + t.amount, 0));
	};

	const getNetBalance = () => {
		return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
	};

	return (
		<div className="page-container pt-24">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<Link href="/subspace-gifts" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
					<ArrowLeft className="h-6 w-6" />
				</Link>
				<div className="flex-1">
					<h1 className="text-3xl font-bold flex items-center gap-3">
						{t('coins.transactions')}
					</h1>
					<p className="text-gray-400">{t('coins.trackEarnings')}</p>
				</div>
				<button
					onClick={refreshTransactions}
					disabled={isLoading}
					className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
				>
					<RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
				</button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
							<TrendingUp className="h-6 w-6 text-green-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-green-400">{getTotalEarned()}</h3>
							<p className="text-gray-300">{t('coins.totalEarned')}</p>
						</div>
					</div>
				</div>

				<div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
							<TrendingDown className="h-6 w-6 text-red-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-red-400">{getTotalSpent()}</h3>
							<p className="text-gray-300">{t('coins.totalSpent')}</p>
						</div>
					</div>
				</div>

				<div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
							<Coins className="h-6 w-6 text-blue-400" />
						</div>
						<div>
							<h3 className={`text-2xl font-bold ${getNetBalance() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
								{getNetBalance()}
							</h3>
							<p className="text-gray-300">{t('coins.netBalance')}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="bg-dark-500 rounded-xl p-6 mb-8">
				<div className="flex flex-col lg:flex-row gap-4">
					{/* Search */}
					<div className="relative flex-1">
						<input
							type="text"
							placeholder={t('coins.searchTransactions')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input pl-12 w-full"
						/>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					</div>

					{/* Filter */}
					<div className="flex items-center gap-3">
						<Filter className="h-5 w-5 text-gray-400" />
						<div className="flex gap-2">
							<button
								onClick={() => setFilterType('all')}
								className={`px-4 py-2 rounded-lg text-sm transition-colors ${filterType === 'all'
										? 'bg-indigo-500 text-white'
										: 'bg-dark-400 text-gray-400 hover:bg-dark-300'
									}`}
							>
								{t('common.all')}
							</button>
							<button
								onClick={() => setFilterType('earned')}
								className={`px-4 py-2 rounded-lg text-sm transition-colors ${filterType === 'earned'
										? 'bg-green-500 text-white'
										: 'bg-dark-400 text-gray-400 hover:bg-dark-300'
									}`}
							>
								{t('coins.earned')}
							</button>
							<button
								onClick={() => setFilterType('spent')}
								className={`px-4 py-2 rounded-lg text-sm transition-colors ${filterType === 'spent'
										? 'bg-red-500 text-white'
										: 'bg-dark-400 text-gray-400 hover:bg-dark-300'
									}`}
							>
								{t('coins.spent')}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Error State */}
			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
					<p className="text-red-400">{error}</p>
				</div>
			)}

			{/* Transactions List */}
			<div className="bg-dark-500 rounded-xl overflow-hidden">
				{isLoading && transactions.length === 0 ? (
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
					</div>
				) : filteredTransactions.length === 0 ? (
					<div className="p-12 text-center">
						<div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<Coins className="h-8 w-8 text-blue-400" />
						</div>
						<h3 className="text-xl font-bold mb-2">{t('coins.noTransactions')}</h3>
						<p className="text-gray-400">
							{searchQuery || filterType !== 'all'
								? t('coins.adjustFilters')
								: t('coins.startEarning')
							}
						</p>
					</div>
				) : (
					<>
						{/* Transaction Items */}
						<div className="divide-y divide-gray-700">
							{filteredTransactions.map((transaction, index) => (
								<div key={index} className="p-6 hover:bg-dark-400 transition-colors">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<div className={`w-12 h-12 rounded-lg flex items-center justify-center ${transaction.amount > 0
													? 'bg-green-500/20 text-green-400'
													: 'bg-red-500/20 text-red-400'
												}`}>
												{transaction.amount > 0 ? (
													<TrendingUp className="h-6 w-6" />
												) : (
													<TrendingDown className="h-6 w-6" />
												)}
											</div>
											<div>
												<h3 className="font-medium text-lg">{transaction.purpose}</h3>
												<div className="flex items-center gap-2 text-sm text-gray-400">
													<Calendar className="h-4 w-4" />
													<span>{formatTime(transaction.created_at)}</span>
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className={`text-xl font-bold flex items-center justify-end gap-2 ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
												}`}>
												<span>{transaction.amount > 0 ? '+' : ''}{transaction.amount}</span>
												<Image src="/coin.svg" alt="Coin" width={20} height={20} className="w-5 h-5" />
											</div>
											<div className="text-sm text-gray-400">{t('coins.coins')}</div>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Load More Button */}
						{hasMore && (
							<div className="p-6 border-t border-gray-700">
								<button
									onClick={loadMore}
									disabled={isLoading}
									className="btn btn-secondary w-full"
								>
									{isLoading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
											{t('common.loading')}
										</>
									) : (
										t('common.loadMore')
									)}
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};


const ProtectedCoinTransactionsPage = () => {
	return (
		<ProtectedRoute>
			<CoinTransactionsPage />
		</ProtectedRoute>
	)
}
export default ProtectedCoinTransactionsPage;