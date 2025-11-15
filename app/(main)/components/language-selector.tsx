import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useLanguageStore, languages } from '@/lib/store/language-store';

interface LanguageSelectorProps {
	className?: string;
	showLabel?: boolean;
	variant?: 'dropdown' | 'modal';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
	className = '',
	showLabel = false,
	variant = 'dropdown'
}) => {
	const { selectedLanguage, isChangingLanguage, setLanguage, t } = useLanguageStore();
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				setSearchQuery('');
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Focus search input when modal opens
	useEffect(() => {
		if (isOpen && variant === 'modal' && searchInputRef.current) {
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen, variant]);

	const handleLanguageChange = (languageCode: string) => {
		if (languageCode !== selectedLanguage && !isChangingLanguage) {
			setLanguage(languageCode);
			setIsOpen(false);
			setSearchQuery('');
		}
	};

	const currentLanguage = languages[selectedLanguage as keyof typeof languages];

	// Define popular languages (you can customize this list)
	const popularLanguageCodes = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar'];

	// Filter languages based on search query
	const filteredLanguages = Object.entries(languages).filter(([code, language]) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			language.nativeName.toLowerCase().includes(query) ||
			language.name.toLowerCase().includes(query) ||
			code.toLowerCase().includes(query)
		);
	});

	// Split filtered languages into popular and other categories
	const popularFiltered = filteredLanguages.filter(([code]) =>
		popularLanguageCodes.includes(code)
	);

	const otherFiltered = filteredLanguages.filter(([code]) =>
		!popularLanguageCodes.includes(code)
	);

	if (variant === 'modal') {
		return (
			<>
				<button
					onClick={() => setIsOpen(true)}
					className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 rounded-lg hover:bg-dark-400 transition-colors ${className}`}
					disabled={isChangingLanguage}
				>
					{showLabel && <span className="text-gray-300 hidden lg:inline">{t('nav.language')}</span>}
				{/* Display shortName for currently selected language */}
				<span className="text-white font-medium text-xs md:text-sm">{currentLanguage?.shortName}</span>
					<ChevronDown className={`h-3 w-3 md:h-4 md:w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
					{isChangingLanguage && (
						<div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-t-2 border-b-2 border-indigo-500"></div>
					)}
				</button>

				{/* Modal */}
				{isOpen && (
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
						<div className="bg-dark-500 rounded-2xl w-full max-w-2xl max-h-[90vh] border border-gray-700 shadow-2xl overflow-hidden">
							{/* Header */}
							<div className="p-6 border-b border-gray-700">
								<div className="flex items-center justify-between">
									<h3 className="text-xl font-bold flex items-center gap-2">
										{t('nav.selectLanguage')}
									</h3>
									<button
										onClick={() => {
											setIsOpen(false);
											setSearchQuery('');
										}}
										className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
									>
										<X className="h-5 w-5" />
									</button>
								</div>
								<p className="text-gray-400 text-sm mt-2">
									{/* Display shortName for currently selected language */}
									{t('language.current')}: {currentLanguage?.shortName}
								</p>
							</div>

							{/* Search */}
							<div className="p-4 border-b border-gray-700">
								<div className="relative">
									<input
										ref={searchInputRef}
										type="text"
										placeholder="Search languages..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="w-full bg-dark-400 text-white rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
									/>
									{searchQuery && (
										<button
											onClick={() => setSearchQuery('')}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</div>
							</div>

							{/* Language List */}
							<div className="p-4 max-h-96 overflow-y-auto">
								{filteredLanguages.length === 0 ? (
									<div className="text-center py-8 text-gray-400">
										<p>No languages found matching "{searchQuery}"</p>
									</div>
								) : (
									<div className="space-y-4">
										{/* Popular Languages */}
										{!searchQuery && popularFiltered.length > 0 && (
											<div>
												<h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
													<span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
													Most Popular
												</h4>
												<div className="space-y-2">
													{popularFiltered.map(([code, language]) => (
														<button
															key={code}
															onClick={() => handleLanguageChange(code)}
															disabled={isChangingLanguage}
															className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${selectedLanguage === code
																? 'bg-indigo-500 text-white shadow-lg'
																: 'bg-dark-400 text-gray-300 hover:bg-dark-300 hover:text-white'
																} ${isChangingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
														>
															<div className="flex items-center space-x-3">
																<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedLanguage === code
																	? 'border-white bg-white'
																	: 'border-gray-500'
																	}`}>
																	{selectedLanguage === code && (
																		<Check className="h-3 w-3 text-indigo-500" />
																	)}
																</div>
																<div className="text-left">
																	<div className="font-medium">{language.nativeName}</div>
																	{code !== 'en' && (
																		<div className="text-sm opacity-75">{language.name}</div>
																	)}
																</div>
															</div>
															{isChangingLanguage && selectedLanguage === code && (
																<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
															)}
														</button>
													))}
												</div>
											</div>
										)}

										{/* Other Languages */}
										{otherFiltered.length > 0 && (
											<div>
												{!searchQuery && (
													<h4 className="text-sm font-medium text-gray-400 mb-3">
														Other Languages
													</h4>
												)}
												<div className="space-y-2">
													{(searchQuery ? filteredLanguages : otherFiltered).map(([code, language]) => (
														<button
															key={code}
															onClick={() => handleLanguageChange(code)}
															disabled={isChangingLanguage}
															className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${selectedLanguage === code
																? 'bg-indigo-500 text-white shadow-lg'
																: 'bg-dark-400 text-gray-300 hover:bg-dark-300 hover:text-white'
																} ${isChangingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
														>
															<div className="flex items-center space-x-3">
																<div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedLanguage === code
																	? 'border-white bg-white'
																	: 'border-gray-500'
																	}`}>
																	{selectedLanguage === code && (
																		<Check className="h-2.5 w-2.5 text-indigo-500" />
																	)}
																</div>
																<div className="text-left">
																	<div className="font-medium text-sm">{language.nativeName}</div>
																	{code !== 'en' && (
																		<div className="text-xs opacity-75">{language.name}</div>
																	)}
																</div>
															</div>
															{isChangingLanguage && selectedLanguage === code && (
																<div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
															)}
														</button>
													))}
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</>
		);
	}

	return (
		<div className={`relative ${className}`} ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-0.5 md:px-3 py-2 rounded-lg hover:bg-dark-400 transition-colors"
				disabled={isChangingLanguage}
			>
				{showLabel && <span className="text-gray-300">{t('nav.language')}</span>}
				{/* Display shortName for currently selected language */}
				<span className="text-white font-medium max-md:text-sm">{currentLanguage?.shortName}</span>
				<ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
				{isChangingLanguage && (
					<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
				)}
			</button>

			{isOpen && (
				<div className="absolute top-full right-0 mt-2 bg-dark-500 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[280px] max-w-sm">
					{/* Search */}
					<div className="p-3 border-b border-gray-700">
						<div className="relative">
							<input
								type="text"
								placeholder="Search languages..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full bg-dark-400 text-white rounded-lg px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
							/>
						</div>
					</div>

					<div className="p-2 max-h-80 overflow-y-auto">
						{filteredLanguages.length === 0 ? (
							<div className="text-center py-4 text-gray-400 text-sm">
								No languages found
							</div>
						) : (
							<div className="space-y-1">
								{filteredLanguages.map(([code, language]) => (
									<button
										key={code}
										onClick={() => handleLanguageChange(code)}
										disabled={isChangingLanguage}
										className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${selectedLanguage === code
											? 'bg-indigo-500 text-white'
											: 'text-gray-300 hover:bg-dark-400 hover:text-white'
											} ${isChangingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
									>
										<div className="flex items-center gap-3">
											<div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedLanguage === code
												? 'border-white bg-white'
												: 'border-gray-500'
												}`}>
												{selectedLanguage === code && (
													<Check className="h-2.5 w-2.5 text-indigo-500" />
												)}
											</div>
											<div className="text-left">
												<div className="font-medium text-sm">{language.nativeName}</div>
												{code !== 'en' && (
													<div className="text-xs opacity-75">{language.name}</div>
												)}
											</div>
										</div>
										{isChangingLanguage && selectedLanguage === code && (
											<div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
										)}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default LanguageSelector;
