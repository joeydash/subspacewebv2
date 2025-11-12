"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { User, Menu, X, Search, ShoppingCart, Wallet, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import LanguageSelector from './components/language-selector';
import LocationSelector from './components/location-selector';
import LoginModal from '@/components/login-modal';

import { useCart } from '@/lib/hooks/cart/use-cart';
import { useUnreadChatsCount } from '@/lib/hooks/chat/use-unread-chats-count';


const Navbar = () => {
	const [isMounted, setIsMounted] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [showSearchResults, setShowSearchResults] = useState(false);
	const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [currentHintIndex, setCurrentHintIndex] = useState(0);
	const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
	const [showAutocomplete, setShowAutocomplete] = useState(false);
	const [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
	const { user, isAuthenticated } = useAuthStore();
	const { t, isChangingLanguage } = useLanguageStore();

	const [currentPage, setCurrentPage] = useState('');

	// Prevent hydration mismatch
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
	const closeMenu = () => setIsMenuOpen(false);

	const [showLogin, setShowLogin] = useState(false);

	const { data: cartData } = useCart(user);
	const totalCartItems = cartData?.items?.length || 0;


	const { data: unreadChatsCount = 0 } = useUnreadChatsCount({ userId: user?.id, authToken: user?.auth_token });

	useEffect(() => {
		let newPage;

		switch (pathname) {
			case '/manage':
				newPage = 'manage';
				break;
			case '/wallet':
				newPage = 'wallet';
				break;
			case '/chat':
				newPage = 'chat';
				break;
			case '/cart':
				newPage = 'cart';
				break;
			case '/profile':
				newPage = 'profile';
				break;
			default:
				newPage = ''
		}

		if (currentPage !== '' && newPage !== currentPage) {
			setCurrentPage(newPage);
		}
	}, [pathname, currentPage])

	// Cycle through search hints
	useEffect(() => {
		if (searchSuggestions.length === 0) {
			return;
		}
		// Change hint every 4 seconds (2s typing + 1s pause + 1s clearing)
		const interval = setInterval(() => {
			setCurrentHintIndex((prev) => (prev + 1) % searchSuggestions.length);
		}, 4000);

		return () => clearInterval(interval);
	}, [searchSuggestions.length]);

	// Debounced autocomplete search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (searchQuery.trim().length > 0) {
				fetchAutocompleteSuggestions(searchQuery.trim());
			} else {
				setAutocompleteSuggestions([]);
				setShowAutocomplete(false);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchQuery]);

	const fetchSearchSuggestions = async () => {
		const { user } = useAuthStore.getState();

		setIsSearching(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user?.auth_token || ""}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery {
              __typename
              whatsub_search_hint_text {
                __typename
                hint
                type
              }
            }
          `,
					variables: {}
				})
			});

			const data = await response.json();
			const hints = data.data?.whatsub_search_hint_text || [];

			setSearchSuggestions(hints);
		} catch (error) {
			console.error('Error fetching search suggestions:', error);
		} finally {
			setIsSearching(false);
		}
	};

	const fetchAutocompleteSuggestions = async (query: string) => {
		const { user } = useAuthStore.getState();

		setIsLoadingAutocomplete(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user?.auth_token || ""}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery($searchString: String!) {
              __typename
              w_getAutoComplete(request: { query: $searchString }) {
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
				console.error('Error fetching autocomplete:', data.errors);
				return;
			}

			const suggestions = data.data?.w_getAutoComplete?.suggestions || [];
			setAutocompleteSuggestions(suggestions);
			setShowAutocomplete(suggestions.length > 0);
		} catch (error) {
			console.error('Error fetching autocomplete suggestions:', error);
			setAutocompleteSuggestions([]);
			setShowAutocomplete(false);
		} finally {
			setIsLoadingAutocomplete(false);
		}
	};

	useEffect(() => {
		fetchSearchSuggestions();
	}, []);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			// Clear search state
			setSearchQuery('');
			setShowAutocomplete(false);
			setAutocompleteSuggestions([]);

			const suggestion = autocompleteSuggestions[0];

			if (suggestion) {
				router.push(`/search?title=${suggestion.title}&suggestionId=${suggestion.id}&index=${suggestion.index}`);
			}
		}
	};

	const handleAutocompleteSuggestionClick = (suggestion: any) => {
		// Clear search state
		setShowAutocomplete(false);
		setSearchQuery('');
		setAutocompleteSuggestions([]);

		router.push(`/search?title=${suggestion.title}&suggestionId=${suggestion.id}&index=${suggestion.index}`);
	};

	const handleCurrentPageChange = (newPage: string) => {
		setCurrentPage(newPage);
	}

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 10) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		closeMenu();
		setShowDropdown(false);
	}, [pathname]);

	return (
		<>
			{/* Language changing overlay */}
			{isChangingLanguage && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
					<div className="bg-dark-500 rounded-xl p-6 flex items-center gap-3 border border-gray-700">
						<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
						<span className="text-white font-medium">{t('language.changing')}</span>
					</div>
				</div>
			)}

			<header
				className={`border-b-2 border-white/20 fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-dark-600 shadow-md`}
			>
				<div className="w-full px-3 md:px-4 lg:px-6">
					<div className="md:hidden overflow-hidden">
						<LocationSelector
							setShowLogin={setShowLogin}
						/>
					</div>

					<div className="flex items-center justify-between gap-2 md:gap-3 h-16">
						{/* Logo - Fixed width */}
						<Link href="/" className="flex items-center flex-shrink-0">
							{/* Mobile logo - icon only */}
							<Image src="/favicon.svg" alt="Subspace" width={32} height={32} className="h-8 w-8 lg:hidden" />
							{/* Desktop logo - full logo with name */}
							<Image src="/subspace-hor_002.svg" alt="Subspace" width={120} height={32} className="h-8 w-auto hidden lg:block" />
						</Link>

						<div className="hidden md:block">
							<LocationSelector
								setShowLogin={setShowLogin}
							/>
						</div>

						{/* Search Bar - Flexible width with constraints */}
						<div className="flex flex-1 justify-center mx-2 lg:mx-3 relative">
							<div className="w-full max-w-md lg:max-w-lg xl:max-w-2xl relative">
								<form onSubmit={handleSearchSubmit} className="w-full relative">
									<div className="relative overflow-hidden">
										<input
											type="text"
											placeholder=""
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											onBlur={() => {
												setTimeout(() => setShowSearchResults(false), 200);
												setTimeout(() => setShowAutocomplete(false), 200);
											}}
											className="w-full bg-dark-500/80 backdrop-blur-sm text-white border-2 border-gray-600/50 rounded-xl px-3 py-2 pl-8 pr-10 md:px-4 md:pl-10 md:pr-12 focus:outline-none focus:ring-0 focus:border-indigo-500 placeholder-gray-400 text-sm md:text-base"
										/>

										{/* Animated Placeholder */}
										{!searchQuery && searchSuggestions.length > 0 && (
											<div className="absolute left-8 md:left-10 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 text-sm md:text-base right-10 md:right-12 overflow-hidden">
												<span className="typing-placeholder block truncate whitespace-nowrap">
													<span className="hidden xl:inline">{t('common.search')} </span>
													{searchSuggestions[currentHintIndex]?.hint}...
												</span>
											</div>
										)}
									</div>

									<Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

									{(isSearching || isLoadingAutocomplete) && (
										<div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
										</div>
									)}
								</form>

								{/* Autocomplete Suggestions Dropdown */}
								{showAutocomplete && autocompleteSuggestions.length > 0 && (
									<div className="w-full absolute top-full left-0 right-0 mt-2 bg-dark-500 border border-indigo-400 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
										<div className="p-2">
											{autocompleteSuggestions.slice(0, 8).map((suggestion, index) => (
												<button
													key={suggestion.id || index}
													onClick={() => handleAutocompleteSuggestionClick(suggestion)}
													className="w-full text-left px-3 py-2 hover:bg-dark-400 rounded-lg transition-colors flex items-center gap-3"
												>
													{suggestion.image_url && (
														<div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-1 flex-shrink-0 relative">
															<Image
																src={suggestion.image_url}
																alt={suggestion.title}
																fill
																className="object-contain"
															/>
														</div>
													)}
													<div className="flex-1 min-w-0">
														<div className="font-medium text-white truncate">{suggestion.title}</div>
														{suggestion.whatsub_class && (
															<div className="text-sm text-gray-400 truncate">{suggestion.whatsub_class}</div>
														)}
													</div>
													<div className="text-xs text-gray-500 capitalize px-2 py-1 bg-dark-400 rounded-full flex-shrink-0">
														{suggestion.type}
													</div>
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Mobile hamburger menu button — placed to the RIGHT of search (visible on mobile only) */}
						<button
							className="md:hidden p-2 text-gray-300 hover:text-white transition-colors flex-shrink-0"
							onClick={toggleMenu}
							aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
						>
							{isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
						</button>

						{/* Desktop Right Icons - Fixed width container with responsive sizing */}
						<div className="hidden md:flex items-center gap-3 lg:gap-4 flex-shrink-0">
							{/* Language Selector - Only on XL screens */}
							<div className="flex flex-col items-center gap-1 flex-shrink-0">
								<LanguageSelector className="text-sm lg:text-base" />
							</div>

							{/* Manage Button - Responsive sizing */}
							{isMounted && isAuthenticated ? (
								<>
									<Link
										href="/manage"
										onClick={() => {
											handleCurrentPageChange('manage');
										}}
										className={`relative flex items-center gap-2 transition-all flex-shrink-0 px-3 md:px-4 py-1.5 lg:py-2 rounded-md bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-2xl transform overflow-hidden group`}
									>
										<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
										<span className="relative text-white text-xs md:text-sm font-semibold">Manage Subscriptions</span>
									</Link>

									<Link
										href="/wallet"
										onClick={() => handleCurrentPageChange('wallet')}
										className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors flex-shrink-0"
									>
										<Wallet color={currentPage === 'wallet' ? '#069494' : 'white'} className="h-5 w-5 lg:h-6 lg:w-6" />
										<span className={`text-xs ${currentPage === 'wallet' ? 'text-[#069494]' : 'text-gray-400'} hidden xl:block`}>
											{t('nav.wallet')}
										</span>
									</Link>

									<Link
										href="/chat"
										onClick={() => handleCurrentPageChange('chat')}
										className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors relative flex-shrink-0"
									>
										<div className="relative">
											<MessageSquare color={currentPage === 'chat' ? '#069494' : 'white'} className="h-5 w-5 lg:h-6 lg:w-6" />
											{unreadChatsCount > 0 && (
												<span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center text-[10px] lg:text-xs">
													{unreadChatsCount > 99 ? '99+' : unreadChatsCount}
												</span>
											)}
										</div>
										<span className={`text-xs ${currentPage === 'chat' ? 'text-[#069494]' : 'text-gray-400'} hidden xl:block`}>
											{t('nav.chat')}
										</span>
									</Link>

									<Link
										href="/cart"
										onClick={() => handleCurrentPageChange('cart')}
										className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors relative flex-shrink-0"
									>
										<div className="relative">
											<ShoppingCart color={currentPage === 'cart' ? '#069494' : 'white'} className="h-5 w-5 lg:h-6 lg:w-6" />
											{totalCartItems > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center text-[10px] lg:text-xs">
												{totalCartItems}
											</span>}
										</div>
										<span className={`text-xs ${currentPage === 'cart' ? 'text-[#069494]' : 'text-gray-400'} hidden xl:block`}>
											Cart
										</span>
									</Link>

									<Link
										href="/profile"
										onClick={() => handleCurrentPageChange('profile')}
										className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors flex-shrink-0"
									>
										<User color={currentPage === 'profile' ? '#069494' : 'white'} className="h-5 w-5 lg:h-6 lg:w-6" />
										<span className={`text-xs ${currentPage === 'profile' ? 'text-[#069494]' : 'text-gray-400'} hidden xl:block`}>
											{t('nav.profile')}
										</span>
									</Link>
								</>
							) : (
								<>
									<button
										onClick={() => setShowLogin(true)}
										className={`relative flex items-center gap-2 transition-all flex-shrink-0 px-3 md:px-4 py-1.5 lg:py-2 rounded-md bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-2xl transform overflow-hidden group`}
									>
										<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
										<span className="relative text-white text-xs md:text-sm font-semibold">Manage Subscriptions</span>
									</button>

									<button
										onClick={() => setShowLogin(true)}
										className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors flex-shrink-0"
									>
										<Wallet className="h-5 w-5 lg:h-6 lg:w-6" />
										<span className={`text-xs ${currentPage === 'wallet' ? 'text-[#069494]' : 'text-gray-400'} hidden xl:block`}>
											{t('nav.wallet')}
										</span>
									</button>

									<button
										onClick={() => setShowLogin(true)}
										className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors flex-shrink-0"
									>
										<MessageSquare className="h-5 w-5 lg:h-6 lg:w-6" />
										<span className={`text-xs ${currentPage === 'chat' ? 'text-[#069494]' : 'text-gray-400'} hidden xl:block`}>
											{t('nav.chat')}
										</span>
									</button>

									<button
										onClick={() => setShowLogin(true)}
										className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors relative flex-shrink-0"
									>
										<div className="relative">
											<ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />
											{totalCartItems > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center text-[10px] lg:text-xs">
												{totalCartItems}
											</span>}
										</div>
										<span className={`text-xs ${currentPage === 'cart' ? 'text-[#069494]' : 'text-gray-400'} hidden xl:block`}>
											Cart
										</span>
									</button>

									<button
										onClick={() => setShowLogin(true)}
										className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors flex-shrink-0"
									>
										<User className="h-5 w-5 lg:h-6 lg:w-6" />
										<span className={`text-xs ${currentPage === 'profile' ? 'text-[#069494]' : 'text-gray-400'} hidden xl:block`}>
											{t('nav.profile')}
										</span>
									</button>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMenuOpen && (
					<div className="md:hidden bg-dark-500 border-t border-gray-800 absolute top-full left-0 right-0 shadow-lg">
						<div className="container mx-auto px-4 py-3">
							<nav className="flex flex-col space-y-3 items-start">
								{isMounted && isAuthenticated ? (
									<>
										<Link href="/chat" className="w-full text-left text-gray-300 hover:text-white transition-colors py-2 flex items-center gap-2">
											<span>{t('nav.chat')}</span>
											{unreadChatsCount > 0 && (
												<span className="bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
													{unreadChatsCount > 99 ? '99+' : unreadChatsCount}
												</span>
											)}
										</Link>
										<Link href="/wallet" className="w-full text-left text-gray-300 hover:text-white transition-colors py-2">
											{t('nav.wallet')}
										</Link>
										<Link
											href="/manage"
											onClick={() => handleCurrentPageChange('manage')}
											className={`w-[190px] relative flex items-center gap-2 transition-all flex-shrink-0 px-4 py-2 rounded-md bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-2xl transform overflow-hidden group`}
										>
											<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
											<span className="relative text-white text-sm font-semibold">Manage Subscriptions</span>
										</Link>
									</>
								) : (
									<>
										<button onClick={() => setShowLogin(true)} className="w-full text-left text-gray-300 hover:text-white transition-colors py-2">
											{t('nav.chat')}
										</button>
										<button onClick={() => setShowLogin(true)} className="w-full text-left text-gray-300 hover:text-white transition-colors py-2">
											{t('nav.wallet')}
										</button>
										<button
											onClick={() => setShowLogin(true)}
											className={`w-[190px] relative flex items-center gap-2 transition-all flex-shrink-0 px-4 py-2 rounded-md bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-2xl transform overflow-hidden group`}
										>
											<span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
											<span className="relative text-white text-sm font-semibold">Manage Subscriptions</span>
										</button>
									</>
								)}

								{/* Mobile Language Selector */}
								<div className="py-2 border-t border-gray-700 mt-2 pt-4 w-full">
									<LanguageSelector variant="modal" showLabel={true} className="w-full justify-start" />
								</div>

								<div className="flex items-center space-x-5 py-2 border-t border-gray-700 mt-2 pt-4 w-full">
									{isMounted && isAuthenticated ? (
										<>
											<Link href="/cart" className="text-gray-300 hover:text-white transition-colors relative">
												<ShoppingCart className="h-5 w-5" />
												{totalCartItems > 0 && <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
													{totalCartItems}
												</span>}
											</Link>
											<Link
												href="/profile"
												className="text-gray-300 hover:text-white transition-colors"
											>
												<User className="h-5 w-5" />
											</Link>
										</>
									) : isMounted ? (
										<>
											<button onClick={() => setShowLogin(true)} className="text-gray-300 hover:text-white transition-colors relative">
												<ShoppingCart className="h-5 w-5" />
												{totalCartItems > 0 && <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
													{totalCartItems}
												</span>}
											</button>
											<button
												onClick={() => setShowLogin(true)}
												className="text-gray-300 hover:text-white transition-colors"
											>
												<User className="h-5 w-5" />
											</button>
										</>
									) : null}
								</div>
							</nav>
						</div>
					</div>
				)}
			</header>

			<LoginModal
				isOpen={showLogin}
				onClose={() => setShowLogin(false)}
			/>
		</>
	);
};

export default Navbar;