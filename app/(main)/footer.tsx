"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
// import { handleSupportChat } from '../utils/supportChat';
import { SendHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoginModal from '@/components/login-modal';

const Footer = () => {
	const { user, isAuthenticated } = useAuthStore();
	const { t } = useLanguageStore();
	const [suggestion, setSuggestion] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [showLogin, setShowLogin] = useState(false);

	const legalLinks = {
		"privacy-policy": "https://subspace.money/docs/whatsub-single-docs-subspace-policies-privacy-policy",
		"terms-and-conditions": "https://subspace.money/docs/whatsub-single-docs-subspace-policies-terms-and-conditions",
		"refund-policy": "https://subspace.money/docs/whatsub-single-docs-subspace-policies-return-and-refund-policy",
		"shipping-and-delivery-policy": "https://subspace.money/docs/whatsub-single-docs-subspace-policies-shipping-and-delivery-policy",
	}
	const companyLinks = {
		"about-us": "https://subspace.money/about-us",
		"contact-us": "https://subspace.money/contact",
	}
	const followLinks = {
		"linkedin": "https://www.linkedin.com/company/officialsubspace",
		"instagram": "https://www.instagram.com/subspace.money/",
		"facebook": "https://www.facebook.com/subspace.money",
		"x": "https://x.com/subspace_money",
	}

	const handleSuggestionSubmit = async () => {
		if (!suggestion.trim() || !user?.id || !user?.auth_token) return;


		setIsSubmitting(true);


		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($user_id: uuid = "", $suggestion: String = "") {
              __typename
              insert_whatsub_suggestion(
                objects: { user_id: $user_id, suggestion: $suggestion }
              ) {
                __typename
                affected_rows
              }
            }
          `,
					variables: {
						user_id: user.id,
						suggestion: suggestion.trim()
					}
				})
			});

			// const supportRoomId = await handleSupportChat(user.id, user.auth_token);

			const data = await response.json();

			// const res = await fetch("https://db.subspace.money/v1/graphql", {
			// 	method: 'POST',
			// 	headers: {
			// 		'Content-Type': 'application/json',
			// 		'Authorization': `Bearer ${user.auth_token}`
			// 	},
			// 	body: JSON.stringify({
			// 		query: `
			// 	mutation SendMessage($message: String!, $user_id: uuid!, $room_id: uuid!) {
			// 		__typename
			// 		sendMessage(
			// 			request: {
			// 			message: $message
			// 			user_id: $user_id
			// 			room_id: $room_id
			// 			}
			// 		) {
			// 			__typename
			// 			affected_rows
			// 		}
			// 		}
			// 	`,
			// 		variables: {
			// 			message: 'I suggest you to add subscription for ' + suggestion.trim(),
			// 			room_id: supportRoomId,
			// 			user_id: user.id
			// 		}
			// 	})
			// })


			if (data.data?.insert_whatsub_suggestion?.affected_rows > 0) {
				setSubmitSuccess(true);
				setSuggestion('');
				setTimeout(() => setSubmitSuccess(false), 3000);
			}
		} catch (error) {
			console.error('Error submitting suggestion:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<footer className="bg-black text-white py-8 sm:py-12">
			<div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-[2000px]">
				{/* Use flex, wrap on small screens, horizontal on md+ */}
				<div className="flex flex-col md:flex-row md:items-start justify-evenly gap-6 sm:gap-8">

					{/* Brand */}
					<div className="flex-1 min-w-0 md:max-w-[220px]">
						<div className="flex items-center mb-2 sm:mb-3">
							<Image src="/subspace-hor_002.svg" alt="Subspace" width={120} height={32} className="h-6 sm:h-8 w-auto" />
						</div>
						<div className="text-gray-400 text-sm">
							<p className="leading-relaxed">{t('footer.copyright')}</p>
						</div>
					</div>

					{/* Legal */}
					<div className="flex-1 min-w-0 md:max-w-40">
						<h3 className="text-white font-medium text-base sm:text-lg mb-2 sm:mb-4">{t('footer.legal')}</h3>
						<ul className="space-y-1.5 sm:space-y-2 text-sm">
							<li>
								<a href={legalLinks["privacy-policy"]} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
									{t('footer.privacyPolicy')}
								</a>
							</li>
							<li>
								<a href={legalLinks["terms-and-conditions"]} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
									{t('footer.termsOfService')}
								</a>
							</li>
							<li>
								<a href={legalLinks["refund-policy"]} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
									{t('footer.refundPolicy')}
								</a>
							</li>
							<li>
								<a href={legalLinks["shipping-and-delivery-policy"]} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
									{t('footer.shippingPolicy')}
								</a>
							</li>
						</ul>
					</div>

					{/* Company */}
					<div className="flex-1 min-w-0 md:max-w-40">
						<h3 className="text-white font-medium text-base sm:text-lg mb-2 sm:mb-4">{t('footer.company')}</h3>
						<ul className="space-y-1.5 sm:space-y-2 text-sm">
							<li>
								<a href={companyLinks["about-us"]} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
									{t('footer.aboutUs')}
								</a>
							</li>
							<li>
								<a href={companyLinks["contact-us"]} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
									{t('footer.contactUs')}
								</a>
							</li>
							<li>
								<a href='/blogs' className="text-gray-300 hover:text-white transition-colors">
									Blogs
								</a>
							</li>
						</ul>
					</div>

					{/* Social + Suggestion (bigger block) */}
					<div className="flex-1 min-w-0 md:max-w-[300px]">
						<h3 className="text-white font-medium text-base sm:text-lg mb-2 sm:mb-4">{t('footer.followUs')}</h3>

						{/* icons row */}
						<div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-8">
							<a href={followLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:opacity-80 transition-opacity">
								<Image src="/linkedin.svg" alt="LinkedIn" width={24} height={24} className="h-5 w-5 sm:h-6 sm:w-6" />
							</a>
							<a href={followLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
								<Image src="/instagram.svg" alt="Instagram" width={24} height={24} className="h-5 w-5 sm:h-6 sm:w-6" />
							</a>
							<a href={followLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
								<Image src="/facebook.svg" alt="Facebook" width={24} height={24} className="h-5 w-5 sm:h-6 sm:w-6" />
							</a>
							<a href={followLinks.x} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="hover:opacity-80 transition-opacity">
								<Image src="/x.svg" alt="X" width={24} height={24} className="h-5 w-5 sm:h-6 sm:w-6" />
							</a>
						</div>

						{/* Suggest a Subscription */}
						<div className="flex-1 min-w-0">
							<h4 className="text-white font-medium text-sm sm:text-base mb-2 sm:mb-3">Suggest a Subscription!</h4>
							{/* flex wrapper keeps button and input aligned */}
							<div className="flex w-full max-w-[310px] border border-gray-600 rounded-lg overflow-hidden focus-within:border-indigo-500">
								<input
									type="text"
									placeholder={submitSuccess ? "Thank you for your suggestion!" : "Submit Your Favourite Subscription"}
									value={suggestion}
									onChange={(e) => setSuggestion(e.target.value)}
									disabled={isSubmitting || submitSuccess}
									aria-label="Suggest a subscription"
									className="flex-1 min-w-0 bg-black text-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm placeholder-gray-400 focus:outline-none border-0 h-[40px] sm:h-[44px]"
								/>
								<button
									onClick={() => {
										if (!isAuthenticated) {
											setShowLogin(true);
											return;
										}
										handleSuggestionSubmit()
									}}
									disabled={!suggestion.trim() || isSubmitting || submitSuccess}
									aria-label="Submit suggestion"
									className="shrink-0 inline-flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-2.5 sm:px-3 py-2 transition-colors duration-200 h-[40px] w-[40px] sm:h-[44px] sm:w-[44px] border-0"
								>
									{isSubmitting ? (
										<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
									) : submitSuccess ? (
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
									) : (
										<SendHorizontal className="w-4 h-4" />
									)}
								</button>
							</div>
							{/* optional success message for screen readers */}
							<div aria-live="polite" className="sr-only">
								{submitSuccess ? "Suggestion submitted" : ""}
							</div>
						</div>
					</div>

					{/* Download App */}
					<div className="flex-1 min-w-0 md:max-w-[180px]">
						<h3 className="text-white font-medium text-base sm:text-lg mb-2">Download Our App</h3>
						<div className="space-y-1.5 sm:space-y-2">
							<a
								href="https://play.google.com/store/apps/details?id=org.grow90.whatsub"
								target="_blank"
								rel="noopener noreferrer"
								className="block hover:opacity-80 transition-opacity w-32 sm:w-40"
								aria-label="Download on Google Play"
							>
								<Image
									src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
									alt="Get it on Google Play"
									width={160}
									height={48}
									className="h-10 w-32 sm:h-12 sm:w-40 object-contain"
								/>
							</a>

							{/*
                href="https://apps.apple.com/app/subspace/id6738104637"
                	target="_blank"
								rel="noopener noreferrer"
								aria-label="Download on App Store"
                */}

							<div
								className="block hover:opacity-80 transition-opacity w-32 sm:w-40"
								onClick={() => toast.error("We are coming to App Store soon")}
							>
								<Image
									src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
									alt="Download on the App Store"
									width={160}
									height={48}
									className="h-10 w-32 sm:h-12 sm:w-40 object-contain"
								/>
							</div>
						</div>
					</div>

				</div>
			</div>
			<LoginModal
				isOpen={showLogin}
				onClose={() => setShowLogin(false)}
			/>
		</footer>
	);
};

export default Footer;
