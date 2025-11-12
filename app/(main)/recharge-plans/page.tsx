'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Wifi, Phone } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import QRPaymentModal from '@/components/qr-payment-modal';
import { toast } from 'react-hot-toast';
import ConfirmationModal from './confirmation-modal';
import ProtectedRoute from '@/components/protected-route';

interface Plan {
	id: string;
	talktime: number;
	validity: string;
	price: number;
	desc: string;
	type: string;
	plan_name: string;
	dataBenefit: string;
}

interface PlanMapping {
	whatsub_bbps_plan: Plan;
}

const RechargePlansPage = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useLanguageStore();

	// Get parameters from URL
	const operatorId = searchParams.get('operatorId');
	const circleId = searchParams.get('circleId');
	const phoneNumber = searchParams.get('phoneNumber');
	const operatorName = searchParams.get('operatorName');

	// State
	const [plans, setPlans] = useState<Plan[]>([]);
	const [availableTypes, setAvailableTypes] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
	const [activeTab, setActiveTab] = useState<string>('');
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);
	const [showConfirmationModal, setShowConfirmationModal] = useState(false);
	const [searchAmount, setSearchAmount] = useState('');


	useEffect(() => {
		if (operatorId && circleId && user?.auth_token) {
			fetchPlans();
		}
	}, [operatorId, circleId, user?.auth_token]);

	const fetchPlans = async () => {
		if (!operatorId || !circleId || !user?.auth_token) return;

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
            query GetPlans($operator_id: uuid, $circle_id: uuid) {
              __typename
              whatsub_bbps_operator_circle_plan_mapping(where: {operator_id: {_eq: $operator_id}, circle_id: {_eq: $circle_id}, active: {_eq: true}}) {
                __typename
                whatsub_bbps_plan {
                  __typename
                  id
                  talktime
                  validity
                  price
                  desc
                  type
                  plan_name
                  dataBenefit
                }
              }
            }
          `,
					variables: {
						operator_id: operatorId,
						circle_id: circleId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch plans');
				return;
			}

			const planMappings = data.data?.whatsub_bbps_operator_circle_plan_mapping || [];
			const fetchedPlans = planMappings.map((mapping: PlanMapping) => mapping.whatsub_bbps_plan);
			setPlans(fetchedPlans);

			// Extract unique types from plans and set available tabs
			const types = [...new Set(fetchedPlans.map((plan: Plan) => plan.type).filter(Boolean))];
			setAvailableTypes(types);

			// Set the first available type as active tab
			if (types.length > 0 && !activeTab) {
				setActiveTab(types[0]);
			}
		} catch (error) {
			console.error('Error fetching plans:', error);
			setError('Failed to fetch plans');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRecharge = () => {
		if (selectedPlan) {
			setShowConfirmationModal(true);
		}
	};

	const executeRecharge = async () => {
		setShowConfirmationModal(false);

		if (!selectedPlan || !user?.id || !user?.auth_token || !operatorId || !phoneNumber) return;

		setIsProcessing(true);
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
            mutation createBBPSRequest($user_id: uuid!, $operator: String!, $canumber: String!, $amount: String, $plan_id: uuid, $operator_id: uuid, $circle_id: uuid, $service: String!) {
              __typename
              createBBPSRequest(request: {user_id: $user_id, operator: $operator, canumber: $canumber, amountStr: $amount, plan_id: $plan_id, operator_id: $operator_id, circle_id: $circle_id, service: $service}) {
                __typename
                affected_rows
                details
              }
            }
          `,
					variables: {
						user_id: user.id,
						operator: 'A',
						canumber: phoneNumber,
						amount: selectedPlan.price.toString(),
						plan_id: selectedPlan.id,
						operator_id: operatorId,
						service: "PREPAID",
						circle_id: circleId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || 'Recharge failed');
				return;
			}

			const result = data.data?.createBBPSRequest;
			if (result?.details?.amount_required) {
				// Show payment modal for the required amount
				const requiredAmount = result.details.amount_required / 100;
				setPendingPaymentAmount(requiredAmount);
				setShowPaymentModal(true);
			} else {
				// If no amount required, recharge is successful
				handlePaymentSuccess();
			}
		} catch (error) {
			console.error('Error processing recharge:', error);
			setError('Recharge failed');
		} finally {
			setIsProcessing(false);
		}
	};

	const handlePaymentSuccess = () => {
		// Navigate back to mobile recharge page or show success
		toast.success('Recharge successful!');
		router.push('/mobile-recharge');
	};

	const handlePaymentError = (errorMessage: string) => {
		setError(`Payment failed: ${errorMessage}`);
	};

	const filterPlansByTab = (plans: Plan[]) => {
		let filtered = plans;

		// Filter by search amount if search is active
		if (searchAmount.trim()) {
			const searchValue = searchAmount.trim();
			filtered = filtered.filter(plan =>
				plan.price.toString().startsWith(searchValue)
			);
		} else if (activeTab) {
			// Only filter by tab if search is not active
			filtered = filtered.filter(plan => plan.type === activeTab);
		}

		return filtered;
	};

	const filteredPlans = filterPlansByTab(plans);

	const getPlanIcon = (plan: Plan) => {
		if (plan.dataBenefit && plan.dataBenefit !== '0' && plan.dataBenefit !== 'NA') {
			return <Wifi className="h-5 w-5 text-blue-400" />;
		}
		return <Phone className="h-5 w-5 text-green-400" />;
	};

	const formatValidity = (validity: string) => {
		if (!validity) return 'N/A';
		return validity.replace(/days?/i, 'days').replace(/months?/i, 'months');
	};

	const formatDataBenefit = (dataBenefit: string) => {
		if (!dataBenefit || dataBenefit === '0' || dataBenefit === 'NA') return null;
		return dataBenefit;
	};

	const formatTabName = (type: string) => {
		// Format the type name for display
		return type
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-dark-600 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
			</div>
		);
	}

	return (
		<div className="pt-20 md:pt-4 pb-24 min-h-screen bg-gradient-to-br from-dark-600 via-dark-700 to-dark-800 text-white">
			{/* Header */}
			<div className="bg-dark-700 border-b border-gray-700 p-5 py-3 shadow-md">
				<div className="flex items-center gap-4 ">
					<button
						onClick={() => router.back()}
						className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
					>
						<span aria-hidden>←</span>
					</button>
					<div className="flex-1">
						<h1 className="text-xl font-semibold">{operatorName || 'Operator Name'}</h1>
						{phoneNumber && <p className="text-sm text-gray-400">{phoneNumber}</p>}
					</div>
				</div>
			</div>

			{/* Tab Navigation */}
			{availableTypes.length > 0 && !searchAmount.trim() && (
				<div className="max-w-4xl mx-auto border-b border-gray-700 shadow-sm">
					<div className="flex overflow-x-auto justify-evenly">
						{availableTypes.map((type) => (
							<button
								key={type}
								onClick={() => setActiveTab(type)}
								className={`flex-shrink-0 px-8 py-3.5 text-base font-medium border-b-2 transition-colors ${activeTab === type
									? 'border-indigo-500 text-white shadow-md'
									: 'border-transparent text-gray-400 hover:text-white'
									}`}
							>
								{formatTabName(type)}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Search Bar */}
			<div className="max-w-4xl mx-auto p-4">
				<div className="relative">
					<input
						type="number"
						placeholder="Search plans by amount (e.g., 299)"
						value={searchAmount}
						onChange={(e) => setSearchAmount(e.target.value)}
						className="w-full bg-dark-500 text-white border border-gray-600 rounded-lg px-4 py-3 pl-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all no-arrows"
					/>
					<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
					{searchAmount && (
						<button
							onClick={() => setSearchAmount('')}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
						>
							<span className="text-lg">×</span>
						</button>
					)}
				</div>
			</div>

			{/* Content - container is a column flex so the button below stays visible */}
			<div className="flex-1 py-6 max-w-4xl mx-auto flex flex-col">
				{/* Error (if any) */}
				{error && (
					<div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
						<div className="flex items-center gap-2 text-red-400">
							<span aria-hidden>!</span>
							<span>{error}</span>
						</div>
					</div>
				)}

				{/* Scrollable list (takes available space) */}
				<div className="flex-1 overflow-auto hide-scrollbar">
					{plans.length === 0 ? (
						<div className="text-center py-12">
							<div className="h-12 w-12 text-gray-500 mx-auto mb-4" aria-hidden>📱</div>
							<h3 className="text-lg font-bold mb-2">{t('mobile.noPlansAvailableTitle')}</h3>
							<p className="text-gray-400">{t('mobile.noPlansAvailable')}</p>
						</div>
					) : filteredPlans.length === 0 ? (
						<div className="text-center py-12">
							<h3 className="text-lg font-bold mb-2">
								{searchAmount.trim() ? 'No plans found' : t('mobile.noPlansAvailableTitle')}
							</h3>
							<p className="text-gray-400">
								{searchAmount.trim()
									? `No plans available for ₹${searchAmount}`
									: `${t('mobile.noPlanForCategory')} ${formatTabName(activeTab)}`
								}
							</p>
						</div>
					) : (
						<div className="space-y-3 p-2 max-h-[600px] oveflow-scroll">
							{filteredPlans.map((plan) => (
								<div
									key={plan.id}
									className={`relative bg-dark-500 rounded-lg border transition-all duration-200 cursor-pointer ${selectedPlan?.id === plan.id
											? 'border-indigo-500 bg-indigo-500/15 shadow-md'
											: 'border-gray-700/50 hover:border-indigo-500/50 shadow-md hover:shadow-lg'
										}`}
									onClick={() => setSelectedPlan(plan)}
								>
									<div className="p-4 sm:p-5 pr-12 sm:pr-16 min-h-[88px]">
										{/* layout: price is a fixed-width column (flex-none) so it never gets hidden on small screens */}
										<div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
											{/* PRICE column - fixed so it remains visible on mobile */}
											<div className="flex-none flex items-center sm:block">
												<div className="flex items-center gap-3">
													{getPlanIcon(plan)}
													<div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 whitespace-nowrap min-w-[88px] sm:min-w-[120px]">
														₹{plan.price}
													</div>
												</div>
											</div>

											{/* DETAILS column - grows and can wrap */}
											<div className="flex-1 min-w-0">
												{/* badges row: allow wrapping but keep each badge from shrinking */}
												<div className="flex items-center gap-2 mb-2 flex-wrap">
													<div className="text-sm sm:text-base bg-blue-500/25 text-blue-300 px-3 py-1 rounded-full flex-shrink-0">
														{t('mobile.validity')} {formatValidity(plan.validity)}
													</div>

													{plan.type && (
														<div className="text-xs sm:text-sm bg-gray-500/25 text-gray-300 px-2 py-1 rounded-full flex-shrink-0">
															{formatTabName(plan.type)}
														</div>
													)}
												</div>

												<h3 className="font-semibold text-base sm:text-lg text-white mb-1 truncate">
													{plan.plan_name || 'Plan Details'}
												</h3>

												{plan.desc && (
													<p className="text-sm text-gray-300 leading-relaxed mb-2 max-w-full">
														{plan.desc}
													</p>
												)}

												<div className="flex flex-wrap gap-3 text-sm text-gray-300">
													{formatDataBenefit(plan.dataBenefit) && (
														<div className="flex items-center gap-1 min-w-0">
															<span aria-hidden>📶</span>
															<span className="truncate">{t('mobile.data')} {formatDataBenefit(plan.dataBenefit)}</span>
														</div>
													)}

													{plan.talktime > 0 && (
														<div className="flex items-center gap-1">
															<span aria-hidden>📞</span>
															<span>{t('mobile.talktime')} ₹{plan.talktime}</span>
														</div>
													)}

													{plan.validity && (
														<div className="flex items-center gap-1">
															<span aria-hidden>⏱</span>
															<span>{formatValidity(plan.validity)}</span>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>

									{/* Tick mark — absolute positioned top-right so it stays at top on all screen sizes */}
									{selectedPlan?.id === plan.id && (
										<div className="absolute top-3 right-3 sm:top-4 sm:right-4">
											<span className="h-7 w-7 text-indigo-400 flex items-center justify-center">✔️</span>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				{/* Bottom button area (always visible because it's outside the scrollable area) */}
				<div className="mt-4 max-md:px-2">
					<button
						onClick={handleRecharge}
						disabled={!selectedPlan || isProcessing}
						aria-disabled={!selectedPlan || isProcessing}
						className={`w-full py-5 ${selectedPlan && !isProcessing
							? 'bg-indigo-500 hover:bg-indigo-600 transform hover:scale-[1.01]'
							: 'bg-gray-600 cursor-not-allowed'
							} text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2`}
					>
						{isProcessing ? (
							<>
								<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
								{t('common.processing')}
							</>
						) : selectedPlan ? (
							<>
								<span aria-hidden>⚡</span>
								{t('mobile.recharge')} ₹{selectedPlan.price}
							</>
						) : (
							'Select a plan'
						)}
					</button>
				</div>
			</div>

			{/* Payment Modal */}
			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={pendingPaymentAmount}
				onSuccess={handlePaymentSuccess}
				onError={handlePaymentError}
				title={t('mobile.completePayment')}
				description={`${t('mobile.recharge')} ${phoneNumber} ${t('common.with')} ₹${selectedPlan?.price} ${t('common.plan')}`}
			/>

			{/* Confirmation Modal */}
			<ConfirmationModal
				isOpen={showConfirmationModal}
				onClose={() => setShowConfirmationModal(false)}
				onConfirm={executeRecharge}
				title="Confirm Recharge"
				message={`Your wallet amount will be deducted if available for this recharge of ₹${selectedPlan?.price || 0}. Do you want to proceed?`}
				confirmText="Proceed"
				cancelText="Cancel"
			/>
		</div>
	);
};


const ProtectedRechargePlansPage = () => {
	return (
		<ProtectedRoute>
			<RechargePlansPage />
		</ProtectedRoute>
	)
}

export default ProtectedRechargePlansPage;