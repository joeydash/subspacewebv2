'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Search, Siren as ChevronRight, Award, Crown, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import SubscriptionManagementModal from '@/components/subscription-management-modal';
import { useLanguageStore } from '@/lib/store/language-store';
import TrendingSubscriptionsSkeleton from './trending-subscriptions-skeleton';
import ProtectedRoute from '@/components/protected-route';

interface SearchHint {
	hint: string;
}

interface TrendingService {
	whatsub_services: {
		id: string;
		image_url: string;
		blurhash: string;
		service_name: string;
		playstore_rating: number;
	};
}

interface TrendingData {
	whatsub_search_hint_text: SearchHint[];
	whatsub_subscriptions_trending: TrendingService[];
}

interface SearchSuggestion {
	id: string;
	image_url: string;
	index: string;
	playstore_rating: number;
	title: string;
	type: string;
	whatsub_class: string;
}

interface SearchResult {
	shows_and_movies: any[];
	services: any[];
	shared_subscriptions: any[];
	shop_products: any[];
}

const TrendingSubscriptionsPage = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const { t } = useLanguageStore();
	const [trendingData, setTrendingData] = useState<TrendingData>({
		whatsub_search_hint_text: [],
		whatsub_subscriptions_trending: []
	});

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
	const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
	const [showManagementModal, setShowManagementModal] = useState(false);
	const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
	const [justSelectedSuggestion, setJustSelectedSuggestion] = useState(false);
	const searchTimeoutRef = useRef<NodeJS.Timeout>();
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Animated placeholder state
	const [currentPlaceholder, setCurrentPlaceholder] = useState('');
	const [placeholderIndex, setPlaceholderIndex] = useState(0);
	const [isTyping, setIsTyping] = useState(true);
	const [isFocused, setIsFocused] = useState(false);
	const [placeholderSuggestions, setPlaceholderSuggestions] = useState<string[]>([]);
	const animationTimeoutRef = useRef<NodeJS.Timeout>();
	const pauseTimeoutRef = useRef<NodeJS.Timeout>();

	console.log('show suggestions ', showSuggestions);

	useEffect(() => {
		if (user?.auth_token) {
			fetchTrendingData();
		}
	}, [user?.auth_token]);

	// Update placeholder suggestions when trending data is loaded
	useEffect(() => {
		if (trendingData.whatsub_search_hint_text.length > 0) {
			const hints = trendingData.whatsub_search_hint_text.map(hint => ` ${hint.hint}...`);
			setPlaceholderSuggestions(hints);
		} else {
			// Fallback suggestions if no hints are available
			setPlaceholderSuggestions([
				"YouTube Premium",
				"Spotify music",
				"Netflix shows",
				"Amazon Prime",
				"Google services",
				"Disney+ content",
				"Adobe Creative",
				"Microsoft Office"
			]);
		}
	}, [trendingData.whatsub_search_hint_text]);

	// Animated placeholder effect
	useEffect(() => {
		if (searchQuery || isFocused || placeholderSuggestions.length === 0) {
			// Stop animation when user is typing or focused
			if (animationTimeoutRef.current) {
				clearTimeout(animationTimeoutRef.current);
			}
			if (pauseTimeoutRef.current) {
				clearTimeout(pauseTimeoutRef.current);
			}
			return;
		}

		const animatePlaceholder = () => {
			const targetText = placeholderSuggestions[placeholderIndex];

			if (isTyping) {
				// Typing effect
				if (currentPlaceholder.length < targetText.length) {
					setCurrentPlaceholder(targetText.slice(0, currentPlaceholder.length + 1));
					animationTimeoutRef.current = setTimeout(animatePlaceholder, 100);
				} else {
					// Finished typing, wait before clearing
					pauseTimeoutRef.current = setTimeout(() => {
						setIsTyping(false);
						animatePlaceholder();
					}, 1000);
				}
			} else {
				// Clearing effect
				if (currentPlaceholder.length > 0) {
					setCurrentPlaceholder(currentPlaceholder.slice(0, -1));
					animationTimeoutRef.current = setTimeout(animatePlaceholder, 50);
				} else {
					// Finished clearing, move to next suggestion
					setPlaceholderIndex((prev) => (prev + 1) % placeholderSuggestions.length);
					setIsTyping(true);
					pauseTimeoutRef.current = setTimeout(animatePlaceholder, 300);
				}
			}
		};

		// Start animation after a short delay
		pauseTimeoutRef.current = setTimeout(animatePlaceholder, 500);

		return () => {
			if (animationTimeoutRef.current) {
				clearTimeout(animationTimeoutRef.current);
			}
			if (pauseTimeoutRef.current) {
				clearTimeout(pauseTimeoutRef.current);
			}
		};
	}, [currentPlaceholder, placeholderIndex, isTyping, searchQuery, isFocused, placeholderSuggestions]);

	// Reset animation when search is cleared
	useEffect(() => {
		if (!searchQuery && !isFocused) {
			// Restart animation after 2 seconds of inactivity
			const restartTimeout = setTimeout(() => {
				setCurrentPlaceholder('');
				setPlaceholderIndex(0);
				setIsTyping(true);
			}, 1000);

			return () => clearTimeout(restartTimeout);
		}
	}, [searchQuery, isFocused]);

	// Debounced search suggestions
	useEffect(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		// Don't fetch suggestions if we just selected one
		if (justSelectedSuggestion) {
			return;
		}

		if (searchQuery.trim().length > 0) {
			searchTimeoutRef.current = setTimeout(() => {
				// Double-check the flag before fetching
				if (!justSelectedSuggestion) {
					fetchSuggestions(searchQuery);
				}
			}, 300);
		} else {
			setSuggestions([]);
			setShowSuggestions(false);
			setSearchResults(null);
		}

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchQuery, justSelectedSuggestion]);

	const fetchTrendingData = async () => {
		if (!user?.auth_token) return;

		// setIsLoading(true);
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
            query GetTrending {
              __typename
              whatsub_search_hint_text(where: {type: {_eq: "track"}}) {
                __typename
                hint
              }
              whatsub_subscriptions_trending(limit: 10) {
                __typename
                whatsub_services {
                  __typename
                  id
                  image_url
                  blurhash
                  service_name
                  playstore_rating
                }
              }
            }
          `
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch trending subscriptions');
				return;
			}

			setTrendingData(data.data || {
				whatsub_search_hint_text: [],
				whatsub_subscriptions_trending: []
			});
		} catch (error) {
			console.error('Error fetching trending data:', error);
			setError('Failed to fetch trending subscriptions');
		} finally {
			setIsLoading(false);
		}
	};

	const fetchSuggestions = async (query: string) => {
		if (!user?.auth_token || !query.trim()) return;

		setIsLoadingSuggestions(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery($searchString: String!) {
              __typename
              w_getAutoComplete(request: {query: $searchString}) {
                __typename
                suggestions
              }
            }
          `,
					variables: {
						searchString: query
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('GraphQL errors:', data.errors);
				return;
			}

			const suggestionsData = data.data?.w_getAutoComplete?.suggestions;

			let parsedSuggestions: SearchSuggestion[] = [];

			if (Array.isArray(suggestionsData)) {
				parsedSuggestions = suggestionsData;
			}

			if (parsedSuggestions.length > 0) {
				setSuggestions(parsedSuggestions);
				setShowSuggestions(true);
			} else {
				console.log('No valid suggestions found');
				setSuggestions([]);
				setShowSuggestions(false);
			}
		} catch (error) {
			console.error('Error fetching suggestions:', error);
			setSuggestions([]);
			setShowSuggestions(false);
		} finally {
			setIsLoadingSuggestions(false);
		}
	};

	const fetchSearchResults = async (suggestion: SearchSuggestion) => {
		if (!user?.auth_token || !suggestion) return;

		setIsSearching(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery($searchString: String = "", $user_id: uuid = "", $uuid: uuid, $index: String) {
              __typename
              w_getSearchResultV4(request: {query: $searchString, user_id: $user_id, uuid: $uuid, index: $index}) {
                __typename
                shows_and_movies
                services
                shared_subscriptions
                shop_products
              }
            }
          `,
					variables: {
						searchString: suggestion.title,
						user_id: user.id,
						uuid: suggestion.id,
						index: suggestion.index
					}
				})
			});

			const data = await response.json();

			if (data.data?.w_getSearchResultV4) {
				setSearchResults(data.data.w_getSearchResultV4);
			}
		} catch (error) {
			console.error('Error fetching search results:', error);
		} finally {
			setIsSearching(false);
		}
	};

	const handleSuggestionClick = (suggestion: SearchSuggestion) => {
		// Clear any pending timeout to prevent fetching suggestions
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		// Set flag to prevent immediate suggestion fetching
		setJustSelectedSuggestion(true);

		setSearchQuery(suggestion.title);
		setShowSuggestions(false);
		setSuggestions([]);
		fetchSearchResults(suggestion);

		// Reset the flag after a short delay
		setTimeout(() => {
			setJustSelectedSuggestion(false);
		}, 500);
	};

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setShowSuggestions(false);
		fetchSearchResults(suggestions[0]);
	};

	const clearSearch = () => {
		setSearchQuery('');
		setSearchResults(null);
		setSuggestions([]);
		setShowSuggestions(false);
		searchInputRef.current?.focus();
	};

	const handleServiceClick = (serviceId: string) => {
		setSelectedServiceId(serviceId);
		setShowManagementModal(true);
	};

    const handleModalSuccess = () => {
		// Refresh data or navigate as needed
		setShowManagementModal(false);
		setSelectedServiceId(null);
		// Optionally navigate to home to see the new subscription
		router.push('/manage');
	};

	const getRankIcon = (index: number) => {
		switch (index) {
			case 0:
				return <Crown className="h-6 w-6 text-yellow-400" />;
			case 1:
				return <Award className="h-6 w-6 text-gray-300" />;
			case 2:
				return <Award className="h-6 w-6 text-orange-400" />;
			default:
				return <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center text-sm font-bold text-indigo-400">#{index + 1}</div>;
		}
	};

	const getRankBadge = (index: number) => {
		switch (index) {
			case 0:
				return { text: '🥇 #1 Trending', color: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400' };
			case 1:
				return { text: '🥈 #2 Trending', color: 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30 text-gray-300' };
			case 2:
				return { text: '🥉 #3 Trending', color: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400' };
			default:
				return { text: `#${index + 1} Trending`, color: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' };
		}
	};

	const displayData = searchResults ?
		[...(searchResults.services || []), ...(searchResults.shows_and_movies || [])] :
		trendingData.whatsub_subscriptions_trending;

	return (
		<div className="page-container pt-24">
			{/* Search Section */}
			<div className="mb-8 relative">
				{!isLoading && <form onSubmit={handleSearchSubmit} className="relative max-w-4xl mx-auto mb-6">
					<input
						ref={searchInputRef}
						type="text"
						placeholder={searchQuery || isFocused ? t('trending.search.placeholder') : `${t('common.search')} ${currentPlaceholder}`}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onFocus={() => {
							setIsFocused(true);
						}}
						onBlur={() => {
							setIsFocused(false);
						}}
						className="input pl-12 pr-12 py-3 text-lg w-full"
					/>
					<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					{searchQuery && (
						<button
							type="button"
							onClick={clearSearch}
							className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
						>
							<X className="h-5 w-5" />
						</button>
					)}

					{/* Loading indicator */}
					{isLoadingSuggestions && (
						<div className="absolute right-12 top-1/2 transform -translate-y-1/2">
							<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
						</div>
					)}
				</form>}

				{/* Search Suggestions Dropdown */}
				{showSuggestions && suggestions.length > 0 && (
					<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-4xl bg-dark-500 border border-gray-700 rounded-lg shadow-lg z-50 mt-2">
						<div className="p-2 max-h-80 overflow-y-auto">
							{suggestions.slice(0, 8).map((suggestion, index) => (
								<button
									key={suggestion.id}
									onClick={() => handleSuggestionClick(suggestion)}
									className="w-full text-left px-4 py-3 hover:bg-dark-400 rounded-lg transition-colors flex items-center gap-4"
								>
									<div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 flex-shrink-0">
										<Image
											src={suggestion.image_url}
											alt={suggestion.title}
											width={36}
											height={36}
											className="h-full w-full object-contain"
										/>
									</div>
									<div className="flex-1">
										<div className="font-medium text-white">{suggestion.title}</div>
										<div className="text-sm text-gray-400 flex items-center gap-2">
											<span>{suggestion.whatsub_class}</span>
											{suggestion.playstore_rating > 0 && (
												<>
													<span>•</span>
													<div className="flex items-center gap-1">
														<Star className="h-3 w-3 text-yellow-400 fill-current" />
														<span>{suggestion.playstore_rating.toFixed(1)}</span>
													</div>
												</>
											)}
										</div>
									</div>
									<div className="text-xs text-gray-500 capitalize px-2 py-1 bg-dark-400 rounded-full">
										{suggestion.type}
									</div>
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Loading State */}
			{isLoading && (
				<TrendingSubscriptionsSkeleton
					showSearch={true}
					showSuggestions={false}
					servicesCount={10}
				/>
			)}

			{/* Searching State */}
			{isSearching && !isLoading && (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
					<p className="text-red-400">{error}</p>
				</div>
			)}

			{/* Results */}
			{!isLoading && !isSearching && !error && (
				<>
					{displayData.length === 0 ? (
						<div className="bg-dark-500 rounded-xl p-12 text-center">
							<div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<Search className="h-8 w-8 text-gray-500" />
							</div>
							<h3 className="text-xl font-bold mb-2">{t('trending.noResults')}</h3>
							<p className="text-gray-400">
								{searchQuery
									? `${t('trending.noResults')} "${searchQuery}"`
									: 'No trending services available at the moment'
								}
							</p>
						</div>
					) : (
						<>
							{/* Search Results Header */}
							{searchResults && (
								<div className="mb-8">
									<h2 className="text-2xl font-bold mb-2">{t('trending.searchResults')} "{searchQuery}"</h2>
									<p className="text-gray-400">{displayData.length} {t('trending.results')}</p>
								</div>
							)}

							{/* All Services List */}
							<div>
								<h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
									{searchResults ? 'All Results' : ''}
								</h2>
								<div className="space-y-4">
									{displayData.map((item, index) => {
										const service = item.whatsub_services || item;
										return (
											<div
												key={service.id}
												onClick={() => handleServiceClick(service.id)}
												className="bg-dark-500 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:bg-dark-400 hover:shadow-lg hover:shadow-orange-500/5 border border-gray-700/50 hover:border-orange-500/50 group"
											>
												<div className="flex items-center gap-6">
													{/* Service Logo */}
													<div className="w-16 h-16 rounded-xl overflow-hidden bg-transparent p-2 flex-shrink-0 group-hover:scale-105 transition-transform">
														<Image
															src={service.image_url}
															alt={service.service_name}
															width={64}
															height={64}
															className="h-full w-full object-contain"
														/>
													</div>

													{/* Service Info */}
													<div className="flex-1">
														<div className="flex items-start justify-between">
															<div>
																<h3 className="text-xl font-bold mb-1 group-hover:text-orange-400 transition-colors">
																	{service.service_name}
																</h3>

																<div className="flex items-center gap-4">

																	{service.playstore_rating > 0 && (
																		<div className="flex items-center gap-1">
																			<Star className="h-4 w-4 text-yellow-400 fill-current" />
																			<span className="text-sm font-medium">{service.playstore_rating.toFixed(1)}</span>
																		</div>
																	)}
																</div>
															</div>

															<ChevronRight className="h-5 w-5 text-gray-400  flex justify-center items-center text-center group-hover:text-orange-400 transition-colors" />
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</>
					)}
				</>
			)}

			{/* Subscription Management Modal */}
			<SubscriptionManagementModal
				isOpen={showManagementModal}
				onClose={() => {
					setShowManagementModal(false);
					setSelectedServiceId(null);
				}}
				serviceId={selectedServiceId || undefined}
				onSuccess={handleModalSuccess}
				mode="add"
			/>
		</div>
	);
};


const ProtectedTrendingSubscriptionsPage = () => {
	return (
		<ProtectedRoute>
			<TrendingSubscriptionsPage />
		</ProtectedRoute>
	);
};

export default ProtectedTrendingSubscriptionsPage;