import React, { useState, useEffect } from 'react';
import { X, StopCircle, Edit, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import DatePicker from './date-picker';

interface ServiceDetails {
	id: string;
	image_url: string;
	service_name: string;
	whatsub_plans: Array<{
		id: string;
		price: number;
		plan_name: string;
		display_data: string;
		accounts: number;
	}>;
}

interface UserSubscription {
	id: string;
	service_image_url: string;
	service_name: string;
	plan: string;
	plan_id: string;
	price: number;
	status: string;
	expiring_at: string;
	is_public: boolean;
	type: string;
	service_id?: string;
}

interface SubscriptionManagementModalProps {
	isOpen: boolean;
	onClose: () => void;
	subscription?: UserSubscription | null;
	serviceId?: string;
	onSuccess?: () => void;
	mode?: 'manage' | 'add'; // 'manage' for existing subscriptions, 'add' for new ones
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
	isOpen,
	onClose,
	subscription,
	serviceId,
	onSuccess,
	mode = subscription ? 'manage' : 'add'
}) => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
	const [selectedPlan, setSelectedPlan] = useState<string>('');
	const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState<Date>(new Date());
	const [isPublic, setIsPublic] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isStoppingSubscription, setIsStoppingSubscription] = useState(false);
	const [isRemovingSubscription, setIsRemovingSubscription] = useState(false);
	const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
	const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);


	useEffect(() => {
		if (isOpen) {
			if (mode === 'add' && serviceId && user?.auth_token) {
				fetchServiceDetails(serviceId);
				setSubscriptionExpiryDate(new Date());
			} else if (mode === 'manage' && subscription) {
				setSelectedPlan(subscription.plan_id);
				setIsPublic(subscription.is_public || false);
				// Set expiry date from subscription
				if (subscription.expiring_at) {
					setSubscriptionExpiryDate(new Date(subscription.expiring_at));
				}
				// For manage mode, we need to get the service_id from subscription or use the passed serviceId
				const targetServiceId = serviceId || subscription.service_id;
				if (targetServiceId && user?.auth_token) {
					fetchServiceDetails(targetServiceId);
				}
			}
		}
	}, [isOpen, mode, serviceId, subscription, user?.auth_token]);

	const fetchServiceDetails = async (serviceId: string) => {
		if (!user?.auth_token) return;

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
			query GetServiceDetails($serviceId: uuid = "") {
			  __typename
			  whatsub_services(where: {id: {_eq: $serviceId}}) {
				__typename
				id
				image_url
				service_name
				whatsub_plans(where: {status: {_eq: "active"}, is_plan: {_eq: true}}) {
				  __typename
				  id
				  price
				  plan_name
				  display_data
				  accounts
				}
			  }
			}
		  `,
					variables: {
						serviceId: serviceId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(t('error.serverError'));
				return;
			}

			const service = data.data?.whatsub_services?.[0];
			if (!service) {
				setError(t('error.notFound'));
				return;
			}

			setServiceDetails(service);
			if (service.whatsub_plans.length > 0 && !selectedPlan) {
				setSelectedPlan(service.whatsub_plans[0].id);
			}
		} catch (error) {
			console.error('Error fetching service details:', error);
			setError(t('error.serverError'));
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateSubscription = async () => {
		if (!subscription || !user?.auth_token) return;

		const selectedPlanDetails = serviceDetails?.whatsub_plans.find(plan => plan.id === selectedPlan);
		if (!selectedPlanDetails) {
			setError(t('error.notFound'));
			return;
		}

		setIsUpdatingSubscription(true);
		setError(null);

		try {
			const formattedExpiryDate = subscriptionExpiryDate.toISOString().split('T')[0];

			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
			mutation updateUserSub($id: uuid, $plan_id: uuid, $plan: String, $price: numeric, $expiring_at: date, $is_public: Boolean) {
			  __typename
			  update_whatsub_users_subscription(where: {id: {_eq: $id}}, _set: {plan_id: $plan_id, plan: $plan, price: $price, expiring_at: $expiring_at, is_public: $is_public}) {
				__typename
				affected_rows
			  }
			}
		  `,
					variables: {
						id: subscription.id,
						plan_id: selectedPlan,
						plan: selectedPlanDetails.plan_name,
						price: selectedPlanDetails.price,
						expiring_at: formattedExpiryDate,
						is_public: isPublic
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || t('error.serverError'));
				return;
			}

			if (data.data?.update_whatsub_users_subscription?.affected_rows > 0) {
				onSuccess?.();
				onClose();
			} else {
				setError(t('subscription.updateFailed'));
			}
		} catch (error) {
			console.error('Error updating subscription:', error);
			setError(t('error.serverError'));
		} finally {
			setIsUpdatingSubscription(false);
		}
	};

	const handleStopSubscription = async () => {
		if (!subscription || !user?.auth_token) return;

		setIsStoppingSubscription(true);
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
			mutation StopUserSub($subscription_id: uuid!) {
			__typename
			update_whatsub_users_subscription(where: {id: {_eq: $subscription_id}}, _set: {status: "stop"}) {
			  __typename
			  affected_rows
			}
		  }
		  `,
					variables: {
						subscription_id: subscription.id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || t('error.serverError'));
				return;
			}

			if (data.data?.update_whatsub_users_subscription?.affected_rows > 0) {
				onSuccess?.();
				onClose();
			} else {
				setError(t('subscription.stopFailed'));
			}
		} catch (error) {
			console.error('Error stopping subscription:', error);
			setError(t('error.serverError'));
		} finally {
			setIsStoppingSubscription(false);
		}
	};

	const handleRemoveSubscription = async () => {
		if (!subscription || !user?.auth_token) return;

		setIsRemovingSubscription(true);
		setError(null);

		try {

			let query, variables;

			if (subscription.room_id) {
				// Use mutation for subscriptions with room_id
				query = `
		  mutation MyMutation($user_subscription_id: uuid, $room_id: uuid) {
			__typename
			update_whatsub_users_subscription(
			  where: { id: { _eq: $user_subscription_id } }
			  _set: { status: "inactive" }
			) {
			  __typename
			  affected_rows
			}
			update_whatsub_rooms(
			  where: { id: { _eq: $room_id } }
			  _set: { status: "inactive", is_public: false }
			) {
			  __typename
			  affected_rows
			}
		  }
		`;
				variables = {
					user_subscription_id: subscription.id,
					room_id: subscription.room_id
				};
			} else {
				// Use mutation for subscriptions without room_id
				query = `
		  mutation MyMutation($user_subscription_id: uuid) {
			__typename
			update_whatsub_users_subscription(
			  where: { id: { _eq: $user_subscription_id } }
			  _set: { status: "inactive" }
			) {
			  __typename
			  affected_rows
			}
		  }
		`;
				variables = {
					user_subscription_id: subscription.id
				};
			}

			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query,
					variables
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || t('error.serverError'));
				return;
			}

			if (data.data?.update_whatsub_users_subscription?.affected_rows > 0) {
				onSuccess?.();
				onClose();
			} else {
				setError(t('subscription.deleteFailed'));
			}
		} catch (error) {
			console.error('Error removing subscription:', error);
			setError(t('error.serverError'));
		} finally {
			setIsRemovingSubscription(false);
		}
	};

	const handleCreateSubscription = async () => {
		if (!serviceDetails || !selectedPlan || !user?.id || !user?.auth_token) {
			setError(t('error.invalidInput'));
			return;
		}

		const selectedPlanDetails = serviceDetails.whatsub_plans.find(plan => plan.id === selectedPlan);
		if (!selectedPlanDetails) {
			setError(t('error.notFound'));
			return;
		}

		setIsCreatingSubscription(true);
		setError(null);

		try {
			const formattedExpiryDate = subscriptionExpiryDate.toISOString().split('T')[0];

			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
			mutation MyMutation($service_id: uuid, $expiring_at: date, $share_limit: Int, $plan: String, $plan_id: uuid, $price: numeric, $service_image_url: String, $user_id: uuid, $service_name: String, $is_public: Boolean, $is_assisted: Boolean, $type: String) {
			  __typename
			  insert_whatsub_users_subscription(objects: {plan: $plan, service_id: $service_id, plan_id: $plan_id, price: $price, service_image_url: $service_image_url, user_id: $user_id, expiring_at: $expiring_at, share_limit: $share_limit, service_name: $service_name, is_public: $is_public, is_assisted: $is_assisted, type: $type}) {
				__typename
				affected_rows
			  }
			}
		  `,
					variables: {
						service_id: serviceDetails.id,
						expiring_at: formattedExpiryDate,
						share_limit: selectedPlanDetails.accounts,
						plan: selectedPlanDetails.plan_name,
						plan_id: selectedPlan,
						price: selectedPlanDetails.price,
						service_image_url: serviceDetails.image_url,
						user_id: user.id,
						service_name: serviceDetails.service_name,
						is_public: isPublic,
						is_assisted: false,
						type: "admin"
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || t('error.serverError'));
				return;
			}

			if (data.data?.insert_whatsub_users_subscription?.affected_rows > 0) {
				onSuccess?.();
				onClose();
			} else {
				setError(t('subscription.addFailed'));
			}

		} catch (error) {
			console.error('Error creating subscription:', error);
			setError(t('error.serverError'));
		} finally {
			setIsCreatingSubscription(false);
		}
	};

	if (!isOpen) return null;

	if (isLoading) {
		return (
			<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
				<div className="bg-dark-500 rounded-2xl p-8">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
				</div>
			</div>
		);
	}

	// Get the current service data
	const currentService = mode === 'add' ? serviceDetails : {
		id: subscription?.id || '',
		image_url: subscription?.service_image_url || '',
		service_name: subscription?.service_name || '',
		whatsub_plans: serviceDetails?.whatsub_plans || []
	};

	const currentPrice = mode === 'add'
		? serviceDetails?.whatsub_plans.find(plan => plan.id === selectedPlan)?.price || 0
		: subscription?.price || 0;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-dark-500 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold text-white">
						{mode === 'add' ? t('subscription.add') : t('subscription.manage')}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-8">
					{/* Service Header Card */}
					<div className="flex items-center gap-6 mb-6">
						<div className="w-20 h-20 rounded-full overflow-hidden bg-white p-2 flex-shrink-0">
							<img
								src={currentService?.image_url}
								alt={currentService?.service_name}
								className="w-full h-full object-contain"
							/>
						</div>
						<div className="flex-1">
							<h2 className="text-2xl font-bold text-white mb-2">{currentService?.service_name}</h2>

							{/* Badges under service header */}
							<div className="flex flex-wrap gap-2 mb-2">
								<div className="text-sm text-gray-400">
									{mode === 'add'
										? serviceDetails?.whatsub_plans.find(plan => plan.id === selectedPlan)?.plan_name || t('subscription.premium')
										: subscription?.plan || t('subscription.premium')
									}
								</div>
							</div>

							{/* Status Badges - Only show for existing subscriptions */}
							{mode === 'manage' && subscription && (
								<div className="flex flex-wrap gap-2">
									<div className={`px-3 py-1 rounded-full text-xs border ${subscription.status === 'stop'
											? 'bg-red-600 text-white border-red-500'
											: 'bg-green-600 text-white border-green-500'
										}`}>
										{subscription.status === 'stop' ? t('subscription.stopped') : t('subscription.active')}
									</div>
									<div className={`px-3 py-1 rounded-full text-xs border ${subscription.is_public
											? 'bg-green-600 text-white border-green-500'
											: 'bg-gray-700 text-white border-gray-600'
										}`}>
										{subscription.is_public ? t('subscription.public') : t('subscription.private')}
									</div>
								</div>
							)}
						</div>
						<div className="text-right">
							<div className="text-2xl font-bold text-indigo-400">₹ {currentPrice}</div>
							<div className="text-indigo-400 text-sm">{t('subscription.perMonth')}</div>
							{/* Sharing Count */}
							{(mode === 'add' ? serviceDetails?.whatsub_plans.find(plan => plan.id === selectedPlan)?.accounts : serviceDetails?.whatsub_plans.find(plan => plan.id === subscription?.plan_id)?.accounts) && (
								<div className="text-gray-400 text-sm mt-1">
									{mode === 'add'
										? serviceDetails?.whatsub_plans.find(plan => plan.id === selectedPlan)?.accounts
										: serviceDetails?.whatsub_plans.find(plan => plan.id === subscription?.plan_id)?.accounts
									} accounts sharing
								</div>
							)}
						</div>
					</div>

					{/* Plan Selection - Show for all cases */}
					{(serviceDetails && serviceDetails.whatsub_plans.length > 0) && (
						<div className="space-y-6 mb-8">
							{/* Plan Selection */}
							<div>
								<label className="block text-white font-medium mb-2">{t('subscription.plan')}</label>
								<div className="relative">
									<select
										value={selectedPlan}
										onChange={(e) => setSelectedPlan(e.target.value)}
										className="w-full bg-dark-400 border border-gray-600 rounded-lg px-4 py-3 text-white appearance-none pr-10"
									>
										<option value="">{t('subscription.choosePlan')}</option>
										{serviceDetails.whatsub_plans.map((plan) => (
											<option key={plan.id} value={plan.id}>
												{plan.plan_name} - ₹{plan.price}
											</option>
										))}
									</select>
									<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
								</div>
							</div>

							{/* Expiry Date */}
							<div>
								<label className="block text-white font-medium mb-2">{t('subscription.expiryDate')}</label>
								<DatePicker
									selectedDate={subscriptionExpiryDate}
									onDateChange={setSubscriptionExpiryDate}
									minDate={new Date()}
									placeholder={t('subscription.selectExpiryDate')}
									className="w-full"
								/>
							</div>

							{/* Make Public Toggle */}
							<div>
								<label className="flex items-center justify-between text-white font-medium mb-2">
									<span>{t('subscription.makePublic')}</span>
									<div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
										<input
											type="checkbox"
											className="opacity-0 w-0 h-0"
											checked={isPublic}
											onChange={() => setIsPublic(!isPublic)}
										/>
										<span
											className={`absolute top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${isPublic ? 'bg-indigo-500' : 'bg-gray-600'
												}`}
										>
											<span
												className={`absolute h-4 w-4 top-1 bg-white rounded-full transition-all duration-300 ${isPublic ? 'left-7' : 'left-1'
													}`}
											></span>
										</span>
									</div>
								</label>
								<p className="text-red-400 text-sm">
									{t('subscription.publicWarning')}
								</p>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="max-w-lg mx-auto space-y-4">
						{mode === 'add' ? (
							/* Add Subscription Button */
							<button
								onClick={handleCreateSubscription}
								disabled={isCreatingSubscription || !selectedPlan}
								className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
							>
								{isCreatingSubscription ? (
									<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
								) : (
									<Plus className="h-5 w-5" />
								)}
								<span>
									{isCreatingSubscription ? t('common.loading') : t('subscription.addToTrack')}
								</span>
							</button>
						) : (
							/* Management Buttons */
							<>
								{/* Top Row - Equal Width Buttons */}
								<div className="grid grid-cols-2 gap-4">
									<button
										onClick={handleStopSubscription}
										disabled={isStoppingSubscription || subscription?.status === 'stop'}
										className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
									>
										{isStoppingSubscription ? (
											<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
										) : (
											<StopCircle className="h-5 w-5" />
										)}
										<span>
											{isStoppingSubscription ? t('common.loading') : t('subscription.stop')}
										</span>
									</button>

									<button
										onClick={handleUpdateSubscription}
										disabled={isUpdatingSubscription}
										className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
									>
										{isUpdatingSubscription ? (
											<>
												<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
												<span>{t('common.loading')}</span>
											</>
										) : (
											<>
												<Edit className="h-5 w-5" />
												<span>{t('subscription.update')}</span>
											</>
										)}
									</button>
								</div>

								{/* Bottom Row - Full Width Remove Button */}
								<button
									onClick={handleRemoveSubscription}
									disabled={isRemovingSubscription}
									className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
								>
									{isRemovingSubscription ? (
										<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
									) : (
										<Trash2 className="h-5 w-5" />
									)}
									<span>
										{isRemovingSubscription ? t('common.loading') : t('subscription.delete')}
									</span>
								</button>
							</>
						)}
					</div>

					{error && (
						<div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
							{error}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SubscriptionManagementModal;