'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Smartphone, Star, Plus } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import TrackSubscriptionModal from './track-subscription-modal';

interface ServiceDetails {
	id: string;
	image_url: string;
	about: string;
	url: string;
	service_name: string;
	playstore_rating: number;
	play_store_url: string;
	package_name: string;
	playstore_number_of_ratings: number;
	whatsub_class: {
		name: string;
	};
	whatsub_plans: Array<{
		id: string;
		plan_name: string;
		display_data: string;
		price: number;
		is_plan: boolean;
	}>;
	whatsub_service_ratings_aggregate: {
		aggregate: {
			avg: {
				rating: number;
			};
		};
	};
}

interface ServiceDetailModalProps {
	onClose: () => void;
	serviceId: string;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
	onClose,
	serviceId
}) => {
	const { user } = useAuthStore();
	const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showTrackModal, setShowTrackModal] = useState(false);
	const [selectedTrackPlanId, setSelectedTrackPlanId] = useState<string>('');


	console.log('service Details ', serviceDetails);

	useEffect(() => {
		if (serviceId && user?.auth_token) {
			fetchServiceDetails();
		}
	}, [serviceId, user?.auth_token]);

	const fetchServiceDetails = async () => {
		if (!user?.auth_token || !serviceId) return;

		setIsLoading(true);
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
          query getServiceDetails($service_id: uuid!) {
              __typename
              whatsub_services(where: { id: { _eq: $service_id } }) {
                __typename
                image_url
                about
                url
                service_name
                playstore_rating
                play_store_url
                package_name
                playstore_number_of_ratings
                whatsub_class {
                  __typename
                  name
                }
                whatsub_plans(where: { status: { _eq: "active" } }) {
                  __typename
                  id
                  plan_name
                  display_data
                  price
                  is_plan
                }
                whatsub_service_ratings_aggregate {
                  __typename
                  aggregate {
                    __typename
                    avg {
                      __typename
                      rating
                    }
                  }
                }
              }
            }
          `,
					variables: {
						service_id: serviceId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch service details');
				return;
			}

			const service = data.data?.whatsub_services?.[0];

			if (!service) {
				setError('Service not found');
				return;
			}

			service.whatsub_plans = service.whatsub_plans.filter(plan => plan.is_plan)

			setServiceDetails(service);
		} catch (error) {
			console.error('Error fetching service details:', error);
			setError('Failed to fetch service details');
		} finally {
			setIsLoading(false);
		}
	};

	const handleTrackPlan = async (planId: string) => {
		setShowTrackModal(true);
		setSelectedTrackPlanId(planId)
	};

	const formatRatingCount = (count: number) => {
		if (count >= 1000000) {
			return `${(count / 1000000).toFixed(2)}M+`;
		} else if (count >= 1000) {
			return `${(count / 1000).toFixed(2)}K+`;
		}
		return count.toString();
	};

	const renderStars = (rating: number) => {
		const stars = [];
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 >= 0.5;

		for (let i = 1; i <= 5; i++) {
			if (i <= fullStars) {
				stars.push(
					<Star key={i} className="h-8 w-8 text-blue-400 fill-current" />
				);
			} else if (i === fullStars + 1 && hasHalfStar) {
				stars.push(
					<div key={i} className="relative">
						<Star className="h-8 w-8 text-gray-600" />
						<div className="absolute inset-0 overflow-hidden w-1/2">
							<Star className="h-8 w-8 text-blue-400 fill-current" />
						</div>
					</div>
				);
			} else {
				stars.push(
					<Star key={i} className="h-8 w-8 text-gray-600" />
				);
			}
		}

		return stars;
	};

	if (!serviceId) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
			<div className="bg-dark-500 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
				{/* Header */}
				<div className="relative p-6 border-b border-gray-700">
					<button
						onClick={onClose}
						className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
					>
						<X className="h-5 w-5" />
					</button>

					{isLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
						</div>
					) : error ? (
						<div className="text-center py-8">
							<p className="text-red-400 mb-4">{error}</p>
							<button onClick={fetchServiceDetails} className="btn btn-primary">
								Try Again
							</button>
						</div>
					) : serviceDetails ? (
						<>
							{/* Service Info */}
							<div className="mb-6">
								{/* Logo and Title Side by Side */}
								<div className="flex items-center gap-4 mb-4">
									<div className="w-20 h-20 rounded-2xl overflow-hidden bg-dark-600 p-2 flex-shrink-0">
										<img
											src={serviceDetails.image_url}
											alt={serviceDetails.service_name}
											className="w-full h-full object-contain"
										/>
									</div>
									<div className="flex-1">
										<h2 className="text-2xl font-bold text-white mb-2">{serviceDetails.service_name}</h2>
										<div className="inline-block bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">
											{serviceDetails.whatsub_class.name}
										</div>
									</div>
								</div>

								{/* About Section */}
								{serviceDetails.about && (
									<div className="mb-6">
										<p className="text-gray-300 text-sm leading-relaxed">
											{serviceDetails.about}
										</p>
									</div>
								)}

								{/* Action Buttons */}
								<div className="flex gap-3">
									{serviceDetails.url && (
										<a
											href={serviceDetails.url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark-400 hover:bg-dark-300 text-white rounded-lg transition-colors border border-gray-600"
										>
											<ExternalLink className="h-4 w-4" />
											<span>Visit Website</span>
										</a>
									)}
									{serviceDetails.package_name && (
										<a
											href={`https://play.google.com/store/apps/details?id=${serviceDetails.package_name}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark-400 hover:bg-dark-300 text-white rounded-lg transition-colors border border-gray-600"
										>
											<Smartphone className="h-4 w-4" />
											<span>Open App</span>
										</a>
									)}
								</div>
							</div>
						</>
					) : null}
				</div>

				{/* Rating Section */}
				{serviceDetails && (
					<div className="px-6 py-4 border-b border-gray-700">
						{/* Rating Stats and Stars Side by Side */}
						<div className="flex items-center justify-between">
							{/* Left side - Rating number and count */}
							<div>
								<div className="text-6xl font-bold text-white mb-2">
									{(serviceDetails.whatsub_service_ratings_aggregate?.aggregate?.avg?.rating || serviceDetails.playstore_rating || 0).toFixed(1)}
								</div>
								<div className="text-gray-400 text-sm">
									<div className="font-medium">{formatRatingCount(serviceDetails.playstore_number_of_ratings || 0)} Ratings</div>
								</div>
							</div>

							{/* Right side - Stars and source */}
							<div className="text-right">
								<div className="flex justify-end mb-2">
									{renderStars(serviceDetails.whatsub_service_ratings_aggregate?.aggregate?.avg?.rating || serviceDetails.playstore_rating || 0)}
								</div>
								<div className="text-gray-400 text-sm">
									Rating from playstore
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Plans Section */}
				{serviceDetails && serviceDetails.whatsub_plans.length > 0 && (
					<div className="p-6">
						<h3 className="text-xl font-bold text-white mb-4">Plans</h3>
						<div className="relative">
							<div className="overflow-x-auto pb-4 hide-scrollbar">
								<div className="flex space-x-4 px-1">
									{serviceDetails.whatsub_plans.map((plan) => {
										if (!plan.is_plan) return null;

										return (
											<div key={plan.id} className="flex-none w-64 bg-dark-400 rounded-xl p-4">
												<div className="mb-4">
													<h4 className="font-bold text-white text-lg mb-1">{plan.plan_name}</h4>
													{plan.display_data && (
														<p className="text-gray-400 text-sm">{plan.display_data}</p>
													)}
												</div>

												<div className="space-y-3">
													<button
														onClick={() => handleTrackPlan(plan.id)}
														className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
													>
														Track
													</button>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div className="p-6">
						<div className="flex justify-center items-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
						</div>
					</div>
				)}

				{/* Error State */}
				{error && (
					<div className="p-6">
						<div className="text-center py-8">
							<p className="text-red-400 mb-4">{error}</p>
							<button onClick={fetchServiceDetails} className="btn btn-primary">
								Try Again
							</button>
						</div>
					</div>
				)}

				{/* Empty Plans State */}
				{serviceDetails && serviceDetails.whatsub_plans.length === 0 && (
					<div className="p-6">
						<div className="text-center py-8 text-gray-400">
							<Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p>No active plans available for this service</p>
						</div>
					</div>
				)}
			</div>

			{/* Track Subscription Modal */}
			{showTrackModal && serviceDetails &&  (
				<TrackSubscriptionModal
					onClose={() => setShowTrackModal(false)}
					serviceDetails={serviceDetails}
					selectedTrackPlanId={selectedTrackPlanId}
				/>
			)}
		</div>
	);
};

export default ServiceDetailModal;