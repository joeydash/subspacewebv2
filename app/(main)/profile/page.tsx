'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/auth-store';
import ProfileComponent from './profile-component';
import Skeleton from 'react-loading-skeleton';
import { useProfileCarousels } from '@/lib/hooks/carousels/use-profile-carousels';

interface ProfileCarousel {
	type: string;
	blurhash: string;
	image_url: string;
	data: string | Record<string, unknown>;
}

const ProfileTabContent = () => {
	const { user } = useAuthStore();
	const [currentCarouselSlide, setCurrentCarouselSlide] = useState(0);

	// Use React Query hook for profile carousels
	const { data: profileCarousels = [], isLoading: isLoadingCarousels } = useProfileCarousels(
		user?.id,
		user?.auth_token
	);

	const handleCarouselClick = (carousel: ProfileCarousel) => {
		try {
			let data;
			if (typeof carousel.data === 'string') {
				try {
					data = JSON.parse(carousel.data);
				} catch (parseError) {
					console.error('Error parsing carousel data:', parseError);
					return;
				}
			} else {
				data = carousel.data;
			}

			if (data?.args?.brand_id) {
				window.open(`/products/${data.args.brand_id}`, '_blank');
			} else if (data?.url) {
				window.open(data.url, '_blank', 'noopener,noreferrer');
			}
		} catch (error) {
			console.error('Error handling carousel click:', error);
		}
	};

	const nextCarouselSlide = () => {
		setCurrentCarouselSlide((prev) => (prev + 1) % profileCarousels.length);
	};

	const prevCarouselSlide = () => {
		setCurrentCarouselSlide((prev) => (prev - 1 + profileCarousels.length) % profileCarousels.length);
	};

	useEffect(() => {
		if (profileCarousels.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentCarouselSlide((prev) => (prev + 1) % profileCarousels.length);
		}, 5000);

		return () => clearInterval(interval);
	}, [profileCarousels.length]);
	return (
		<div>
			{isLoadingCarousels ? (
				<div className="mb-6">
					<div className="relative w-full max-w-4xl mx-auto aspect-[3/1] rounded-xl overflow-hidden">
						<Skeleton height="100%" borderRadius="0.75rem" />
					</div>
				</div>
			) : profileCarousels.length > 0 ? (
				<div className="mb-6">
					<div className="relative w-full max-w-4xl mx-auto aspect-[3/1] rounded-xl overflow-hidden">
						<div
							className="w-full h-full cursor-pointer transition-transform duration-300 hover:scale-105"
							onClick={() => handleCarouselClick(profileCarousels[currentCarouselSlide])}
						>
							{profileCarousels[currentCarouselSlide]?.image_url.endsWith('.webm') ? (
								<video
									src={profileCarousels[currentCarouselSlide]?.image_url}
									autoPlay
									loop
									muted
									playsInline
									className="w-full h-full object-cover"
								>
									Your browser does not support the video tag.
								</video>
							) : (
								<Image
									src={profileCarousels[currentCarouselSlide]?.image_url}
									alt=""
									fill
									className="object-cover"
								/>
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
						</div>

						{profileCarousels.length > 1 && (
							<>
								<button
									onClick={prevCarouselSlide}
									className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200"
								>
									<ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
								</button>
								<button
									onClick={nextCarouselSlide}
									className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200"
								>
									<ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
								</button>
							</>
						)}

						{profileCarousels.length > 1 && (
							<div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
								{profileCarousels.map((_: ProfileCarousel, index: number) => (
									<button
										key={index}
										onClick={() => setCurrentCarouselSlide(index)}
										className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-200 ${index === currentCarouselSlide
											? 'bg-white scale-125'
											: 'bg-white/50 hover:bg-white/75'
											}`}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			) : null}
			<div className="max-w-4xl mx-auto">
				<ProfileComponent />
			</div>
		</div>
	);
};

export default ProfileTabContent;
