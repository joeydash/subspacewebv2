'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Tv, Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import QRPaymentModal from '@/components/qr-payment-modal';
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

const DTHPlansPage = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useLanguageStore();

	// Get parameters from URL
	const operatorId = searchParams.get('operatorId');
	const customerNumber = searchParams.get('customerNumber');
	const operatorName = searchParams.get('operatorName');
	const operatorCode = searchParams.get('operatorCode');

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

	useEffect(() => {
		if (operatorId && user?.auth_token) {
			fetchPlans();
		}
	}, [operatorId, user?.auth_token]);

	const fetchPlans = async () => {
		if (!operatorId || !user?.auth_token) return;

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
            query getBBPSPlans($operator_id: uuid) {
              __typename
              whatsub_bbps_plans(where: {active: {_eq: true}, operator: {_eq: $operator_id}}) {
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
          `,
					variables: {
						operator_id: operatorId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch plans');
				return;
			}

			const fetchedPlans = data.data?.whatsub_bbps_plans || [];
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

	const handleRecharge = async () => {
		if (!selectedPlan || !user?.id || !user?.auth_token || !operatorId || !customerNumber) return;

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
						operator: operatorCode, // This should be dynamic based on operator data
						canumber: customerNumber,
						amount: selectedPlan.price.toString(),
						plan_id: selectedPlan.id,
						operator_id: operatorId,
						service: "DTH",
						circle_id: null
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError(data.errors[0]?.message || t('error.paymentFailed'));
				return;
			}

			const result = data.data?.createBBPSRequest;
			if (result?.details?.amount_required) {
				// Show payment modal for the required amount
				const requiredAmount = result.details.amount_required / 100;
				setPendingPaymentAmount(requiredAmount);
				setShowPaymentModal(true);
			} else {
				setError(t('error.paymentFailed'));
			}
		} catch (error) {
			console.error('Error processing payment:', error);
			setError(t('error.paymentFailed'));
		} finally {
			setIsProcessing(false);
		}
	};

	const handlePaymentSuccess = () => {
		// Navigate back to DTH page or show success
		router.push('/dth');
	};

	const handlePaymentError = (errorMessage: string) => {
		setError(`Payment failed: ${errorMessage}`);
	};

	const filterPlansByTab = (plans: Plan[]) => {
		if (!activeTab) return plans;
		return plans.filter(plan => plan.type === activeTab);
	};

	const filteredPlans = filterPlansByTab(plans);

	const getPlanIcon = (plan: Plan) => {
		if (plan.dataBenefit && plan.dataBenefit !== '0' && plan.dataBenefit !== 'NA') {
			return <Zap className="h-5 w-5 text-blue-400" />;
		}
		return <Tv className="h-5 w-5 text-green-400" />;
	};

	const formatValidity = (validity: string) => {
		if (!validity) return 'N/A';
		return validity.replace(/days?/i, 'days').replace(/months?/i, 'months');
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
		<div className="pt-16 min-h-screen bg-dark-600 text-white">
			{/* Header */}
			<div className="bg-dark-700 border-b border-gray-700 p-4 py-2">
				<div className="flex items-center gap-4 ">
					<button
						onClick={() => router.back()}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<ArrowLeft className="h-6 w-6" />
					</button>
					<div className="flex-1">
						<h1 className="text-lg font-bold">{operatorName || 'DTH Operator'}</h1>
						{customerNumber && (
							<p className="text-sm text-gray-400">{customerNumber}</p>
						)}
					</div>
				</div>
			</div>

			{/* Tab Navigation */}
			{availableTypes.length > 0 && (
				<div className="bg-dark-700 border-b border-gray-700">
					<div className="flex overflow-x-auto">
						{availableTypes.map((type) => (
							<button
								key={type}
								onClick={() => setActiveTab(type)}
								className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === type
										? 'border-indigo-500 text-indigo-400'
										: 'border-transparent text-gray-400 hover:text-white'
									}`}
							>
								{formatTabName(type)}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Content */}
			<div className="flex-1 p-4">
				{error && (
					<div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
						<div className="flex items-center gap-2 text-red-400">
							<AlertCircle className="h-5 w-5" />
							<span>{error}</span>
						</div>
					</div>
				)}

				{plans.length === 0 ? (
					<div className="text-center py-12">
						<Tv className="h-12 w-12 text-gray-500 mx-auto mb-4" />
						<h3 className="text-lg font-bold mb-2">{t('dth.noPlansAvailableTitle') || 'No Plans Available'}</h3>
						<p className="text-gray-400">{t('dth.noPlansAvailable') || 'There are no plans available for this operator at the moment.'}</p>
					</div>
				) : filteredPlans.length === 0 ? (
					<div className="text-center py-12">
						<Tv className="h-12 w-12 text-gray-500 mx-auto mb-4" />
						<h3 className="text-lg font-bold mb-2">{t('dth.noPlansAvailableTitle') || 'No Plans Available'}</h3>
						<p className="text-gray-400">{t('dth.noPlanForCategory') || 'No plans available for category'} {formatTabName(activeTab)}</p>
					</div>
				) : (
					<div className="space-y-3">
						{filteredPlans.map((plan) => (
							<div
								key={plan.id}
								className={`bg-dark-500 rounded-lg border transition-all duration-200 cursor-pointer ${selectedPlan?.id === plan.id
										? 'border-indigo-500 bg-indigo-500/10'
										: 'border-gray-700 hover:border-gray-600'
									}`}
								onClick={() => setSelectedPlan(plan)}
							>
								<div className="p-4">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												{getPlanIcon(plan)}
												<div className="text-2xl font-bold text-indigo-400">
													₹{plan.price}
												</div>
												{plan.validity && (
													<div className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
														{t('dth.validity') || 'Validity'}: {formatValidity(plan.validity)}
													</div>
												)}
												{plan.type && (
													<div className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
														{formatTabName(plan.type)}
													</div>
												)}
											</div>

											<h3 className="font-medium text-white mb-1">
												{plan.plan_name || 'Plan Details'}
											</h3>

											{plan.desc && (
												<p className="text-sm text-gray-300 mb-2">{plan.desc}</p>
											)}

											<div className="flex flex-wrap gap-4 text-sm text-gray-400">
												{plan.validity && (
													<div className="flex items-center gap-1">
														<Clock className="h-4 w-4" />
														<span>{formatValidity(plan.validity)}</span>
													</div>
												)}
											</div>
										</div>

										{selectedPlan?.id === plan.id && (
											<CheckCircle className="h-6 w-6 text-indigo-400 flex-shrink-0 ml-4" />
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Fixed Bottom Button */}
			{selectedPlan && (
				<div className="fixed bottom-0 left-0 right-0 bg-dark-700 border-t border-gray-700 p-4">
					<button
						onClick={handleRecharge}
						disabled={isProcessing}
						className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
					>
						{isProcessing ? (
							<>
								<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
								{t('common.processing') || 'Processing...'}
							</>
						) : (
							<>
								<Zap className="h-5 w-5" />
								{t('dth.recharge') || 'Recharge'} ₹{selectedPlan.price}
							</>
						)}
					</button>
				</div>
			)}

			{/* Payment Modal */}
			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={pendingPaymentAmount}
				onSuccess={handlePaymentSuccess}
				onError={handlePaymentError}
				title={t('dth.completeDTHRecharge') || 'Complete DTH Recharge'}
				description={`${t('dth.rechargeDTHFor') || 'Recharge DTH for'} ${customerNumber} ${t('common.with') || 'with'} ₹${selectedPlan?.price} ${t('common.plan') || 'plan'}`}
			/>
		</div>
	);
};


const ProtectedDTHPlansPage = () => {
	return (
		<ProtectedRoute>
			<DTHPlansPage />
		</ProtectedRoute>
	)
}

export default ProtectedDTHPlansPage;