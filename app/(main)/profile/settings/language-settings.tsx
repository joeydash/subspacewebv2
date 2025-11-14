'use client';

import React, { useState } from 'react';
import { Globe, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useLanguageStore, languages } from '@/lib/store/language-store';

const LanguageSettingsComponent: React.FC = () => {
	const [isExpanded, setIsExpanded] = useState(false);
	const { selectedLanguage, setLanguage, isChangingLanguage } = useLanguageStore();

	const handleLanguageChange = (languageCode: string) => {
		if (languageCode !== selectedLanguage && !isChangingLanguage) {
			setLanguage(languageCode);
		}
	};

	return (
		<>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-3 sm:p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
			>
				<div className="flex items-center gap-2 sm:gap-3">
					<Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
					<span className="text-sm sm:text-base font-medium">Language</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				) : (
					<ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				)}
			</button>
			{isExpanded && (
				<div className="rounded-lg p-1 sm:p-2">
					{/* Header */}
					<div className="mb-2 sm:mb-4">
						<h3 className="text-sm sm:text-base font-bold text-white">Change Language</h3>
					</div>

					{/* Language List */}
					<div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto hide-scrollbar">
						{Object.entries(languages).map(([code, language]) => (
							<button
								key={code}
								onClick={() => handleLanguageChange(code)}
								disabled={isChangingLanguage}
								className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all duration-200 ${selectedLanguage === code
										? 'bg-indigo-500 text-white'
										: 'bg-dark-500 text-gray-300 hover:bg-dark-300 hover:text-white'
									} ${isChangingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								{/* Language Code Circle */}
								<div
									className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${selectedLanguage === code
											? 'bg-white text-indigo-500'
											: 'bg-indigo-500 text-white'
										}`}
								>
									{code.toUpperCase()}
								</div>

								{/* Language Name */}
								<div className="flex-1 text-left">
									<div className="font-medium text-sm sm:text-base">{language.nativeName}</div>
								</div>

								{/* Check Icon for Selected Language */}
								{selectedLanguage === code && (
									<div className="flex items-center">
										{isChangingLanguage ? (
											<div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white"></div>
										) : (
											<Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
										)}
									</div>
								)}
							</button>
						))}
					</div>
				</div>
			)}
		</>
	);
};

export default LanguageSettingsComponent;
