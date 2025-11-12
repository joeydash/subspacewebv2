'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Smartphone, Search, Clock, ChevronDown, Zap, Star, Info, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import QRPaymentModal from '@/components/qr-payment-modal';
import ProtectedRoute from '@/components/protected-route';

interface Operator {
	id: string;
	name: string;
	code: string;
	image: string;
	is_flexipay: boolean;
	flexipay_min: number;
	input_length: number;
	discount_percentage: number;
	discount_fixed: number;
	fee_percentage: number;
	fee_fixed: number;
}

interface Circle {
	id: string;
	name: string;
}

interface Plan {
	id: string;
	validity: string;
	dataBenefit: string;
	talktime: number;
	active: boolean;
	price: number;
	description: string;
}

interface RechargeHistory {
	canumber: string;
	operator: string;
	amount: number;
	created_at: string;
	plan_id: string;
	whatsub_bbps_circle: {
		id: string;
		name: string;
	};
	whatsub_bbps_plan: {
		validity: string;
		dataBenefit: string;
		talktime: number;
		active: boolean;
	};
	whatsub_bbps_operator: {
		id: string;
		name: string;
		image: string;
		input_length: number;
		is_flexipay: boolean;
	};
}

interface CircleOperatorResponse {
	circleId: string;
	operatorId: string;
}

const MobileRechargePage = () => {
	const { user } = useAuthStore();
	const router = useRouter();
	const { t } = useLanguageStore();

	// Form state
	const [phoneNumber, setPhoneNumber] = useState('');
	const [selectedOperator, setSelectedOperator] = useState<string>('');
	const [selectedCircle, setSelectedCircle] = useState<string>('');
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
	const [customAmount, setCustomAmount] = useState('');

	// Data state
	const [operators, setOperators] = useState<Operator[]>([]);
	const [circles, setCircles] = useState<Circle[]>([]);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [rechargeHistory, setRechargeHistory] = useState<RechargeHistory[]>([]);

	// UI state
	const [isLoadingOperators, setIsLoadingOperators] = useState(false);
	const [isLoadingCircles, setIsLoadingCircles] = useState(false);
	const [isLoadingPlans, setIsLoadingPlans] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [isAutoFilling, setIsAutoFilling] = useState(false);
	const [showPlans, setShowPlans] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchOperators();
			fetchCircles();
			fetchRechargeHistory();
		}
	}, [user?.id, user?.auth_token]);

	// Auto-fill circle and operator when phone number is entered
	useEffect(() => {
		if (phoneNumber.length === 10) {
			autoFillCircleAndOperator();
		}
	}, [phoneNumber]);

	const fetchOperators = async () => {
		if (!user?.auth_token) return;

		setIsLoadingOperators(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query getOperators($service: String) {
              __typename
              whatsub_bbps_operators(where: {active: {_eq: true}, service: {_eq: $service}}) {
                __typename
                id
                name
                code
                image
                is_flexipay
                flexipay_min
                input_length
                discount_percentage
                discount_fixed
                fee_percentage
                fee_fixed
              }
            }
          `,
					variables: {
						service: "PREPAID"
					}
				})
			});

			const data = await response.json();
			setOperators(data.data?.whatsub_bbps_operators || []);
		} catch (error) {
			console.error('Error fetching operators:', error);
		} finally {
			setIsLoadingOperators(false);
		}
	};

	const fetchCircles = async () => {
		if (!user?.auth_token) return;

		setIsLoadingCircles(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query GetCircles {
              __typename
              whatsub_bbps_circles {
                __typename
                id
                name
              }
            }
          `
				})
			});

			const data = await response.json();
			setCircles(data.data?.whatsub_bbps_circles || []);
		} catch (error) {
			console.error('Error fetching circles:', error);
		} finally {
			setIsLoadingCircles(false);
		}
	};

	const fetchRechargeHistory = async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoadingHistory(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query RechargeHistory($user_id: uuid!, $limit: Int!, $service: String!) {
              __typename
              whatsub_bbps(where: {user_id: {_eq: $user_id}, status: {_eq: "Done"}, service: {_eq: $service}}, limit: $limit, order_by: {created_at: desc}) {
                __typename
                canumber
                operator
                amount
                created_at
                plan_id
                whatsub_bbps_circle {
                  __typename
                  id
                  name
                }
                whatsub_bbps_plan {
                  __typename
                  validity
                  dataBenefit
                  talktime
                  active
                }
                whatsub_bbps_operator {
                  __typename
                  id
                  name
                  image
                  input_length
                  is_flexipay
                }
              }
            }
          `,
					variables: {
						user_id: user.id,
						limit: 10,
						service: "PREPAID"
					}
				})
			});

			const data = await response.json();

			console.log('recharge history ', data);
			setRechargeHistory(data.data?.whatsub_bbps || []);
		} catch (error) {
			console.error('Error fetching recharge history:', error);
		} finally {
			setIsLoadingHistory(false);
		}
	};

	const autoFillCircleAndOperator = async () => {
		if (!user?.auth_token || phoneNumber.length !== 10) return;

		setIsAutoFilling(true);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery($phonenumber: String = "") {
              __typename
              getBBPSCircle(request: {phonenumber: $phonenumber}) {
                __typename
                circleId
                operatorId
              }
            }
          `,
					variables: {
						phonenumber: phoneNumber
					}
				})
			});

			const data = await response.json();
			const result = data.data?.getBBPSCircle as CircleOperatorResponse;

			if (result?.circleId && result?.operatorId) {
				setSelectedCircle(result.circleId);
				setSelectedOperator(result.operatorId);
			}
		} catch (error) {
			console.error('Error auto-filling circle and operator:', error);
		} finally {
			setIsAutoFilling(false);
		}
	};

	const handleCheckPlans = () => {
		if (phoneNumber && selectedOperator && selectedCircle) {
			const params = new URLSearchParams({
				operatorId: selectedOperator,
				circleId: selectedCircle,
				phoneNumber: phoneNumber,
				operatorName: getSelectedOperatorData()?.name || 'Operator'
			});
			router.push(`/recharge-plans?${params.toString()}`);
		}
	};

	const handleRecharge = () => {
		if (selectedPlan) {
			setShowPaymentModal(true);
		}
	};

	const handlePaymentSuccess = () => {
		// Refresh recharge history
		fetchRechargeHistory();
		setSelectedPlan(null);
		setShowPlans(false);
		setPhoneNumber('');
		setSelectedOperator('');
		setSelectedCircle('');
	};

	const handleHistoryItemClick = (item: RechargeHistory) => {
		setPhoneNumber(item.canumber);
		setSelectedOperator(item.whatsub_bbps_operator.id);
		setSelectedCircle(item.whatsub_bbps_circle.id);
	};

	const getSelectedOperatorData = () => {
		return operators.find(op => op.id === selectedOperator);
	};

	const getSelectedCircleData = () => {
		return circles.find(circle => circle.id === selectedCircle);
	};

	const isCheckPlansEnabled = phoneNumber.length === 10 && selectedOperator && selectedCircle;

	return (
		<div className="page-container pt-24">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<button type="button" onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
					<ArrowLeft className="h-6 w-6" />
				</button>
				<div className="flex-1">
					<h1 className="text-3xl font-bold flex items-center gap-3">
						<Smartphone className="h-8 w-8 text-indigo-400" />
						{t('mobile.title')}
					</h1>
					<p className="text-gray-400">{t('mobile.subtitle')}</p>
				</div>
			</div>

			<div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Main Form */}
				<div className="lg:col-span-2 space-y-6">
					{/* Recharge Form */}
					<div className="bg-dark-500 rounded-xl p-6 border border-gray-700">
						<h2 className="text-xl font-bold mb-6">{t('mobile.formDetails')}</h2>

						<div className="space-y-4">
							{/* Mobile Number */}
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-2">
									{t('mobile.mobileNumber')}
								</label>
								<div className="relative">
									<input
										type="tel"
										value={phoneNumber}
										onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
										placeholder={t('mobile.mobileNumberPlaceHolder')}
										className="input pl-12 w-full"
										maxLength={10}
									/>
									<Smartphone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
									{isAutoFilling && (
										<div className="absolute right-4 top-1/2 transform -translate-y-1/2">
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
										</div>
									)}
								</div>
							</div>

							{/* Operator Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-2">
									{t('mobile.selectOperator')}
								</label>
								<div className="relative">
									<select
										value={selectedOperator}
										onChange={(e) => setSelectedOperator(e.target.value)}
										className="input w-full appearance-none pr-10"
										disabled={isLoadingOperators}
									>
										<option value="">{t('mobile.chooseOperator')}</option>
										{operators.map((operator) => (
											<option key={operator.id} value={operator.id}>
												{operator.name}
											</option>
										))}
									</select>
									<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
								</div>
													{selectedOperator && (
														<div className="mt-2 flex items-center gap-2">
															{getSelectedOperatorData()?.image ? (
																<Image
																	src={getSelectedOperatorData()?.image}
																	alt={getSelectedOperatorData()?.name || ''}
																	width={24}
																	height={24}
																	className="w-6 h-6 rounded"
																/> 
															) : null}
															<span className="text-sm text-gray-300">{getSelectedOperatorData()?.name}</span>
															{getSelectedOperatorData()?.is_flexipay && (
																<span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
																	FlexiPay
																</span>
															)}
														</div>
													)}
							</div>

							{/* Circle Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-2">
									{t('mobile.selectCircle')}
								</label>
								<div className="relative">
									<select
										value={selectedCircle}
										onChange={(e) => setSelectedCircle(e.target.value)}
										className="input w-full appearance-none pr-10"
										disabled={isLoadingCircles}
									>
										<option value="">{t('mobile.chooseCircle')}</option>
										{circles.map((circle) => (
											<option key={circle.id} value={circle.id}>
												{circle.name}
											</option>
										))}
									</select>
									<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
								</div>
								{selectedCircle && (
									<div className="mt-2 text-sm text-gray-300">
										{t('mobile.selected')} {getSelectedCircleData()?.name}
									</div>
								)}
							</div>

							{/* Check Plans Button */}
							<button
								onClick={handleCheckPlans}
								disabled={!isCheckPlansEnabled || isLoadingPlans}
								className={`w-full py-3 rounded-lg font-medium transition-colors ${isCheckPlansEnabled && !isLoadingPlans
										? 'bg-indigo-500 hover:bg-indigo-600 text-white'
										: 'bg-gray-600 text-gray-400 cursor-not-allowed'
									}`}
							>
								{isLoadingPlans ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2 inline-block"></div>
										{t('mobile.loadingPlans')}
									</>
								) : (
									<>
										<Search className="h-4 w-4 mr-2 inline-block" />
										{t('mobile.checkPlans')}
									</>
								)}
							</button>
						</div>
					</div>

					{/* Plans Display */}
					{showPlans && (
						<div className="bg-dark-500 rounded-xl p-6 border border-gray-700">
							<h3 className="text-lg font-bold mb-4">{t('mobile.availablePlans')}</h3>

							{plans.length === 0 ? (
								<div className="text-center py-8 text-gray-400">
									{t('mobile.noPlansAvailable')}
								</div>
							) : (
								<div className="space-y-3">
									{plans.map((plan) => (
										<div
											key={plan.id}
											className={`p-4 rounded-lg border transition-colors cursor-pointer ${selectedPlan?.id === plan.id
													? 'bg-indigo-500/10 border-indigo-500/30'
													: 'bg-dark-400 border-gray-700 hover:border-gray-600'
												}`}
											onClick={() => setSelectedPlan(plan)}
										>
											<div className="flex justify-between items-start">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<span className="text-lg font-bold text-indigo-400">₹{plan.price}</span>
														<span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
															{plan.validity}
														</span>
													</div>
													<p className="text-gray-300 mb-1">{plan.description}</p>
													<div className="flex items-center gap-4 text-sm text-indigo-400">
														<span>{t('mobile.data')} {plan.dataBenefit}</span>
														{plan.talktime > 0 && <span>{t('mobile.talktime')} ₹{plan.talktime}</span>}
													</div>
												</div>
												{selectedPlan?.id === plan.id && (
													<CheckCircle className="h-5 w-5 text-indigo-400" />
												)}
											</div>
										</div>
									))}
								</div>
							)}

							{selectedPlan && (
								<div className="mt-6">
									<button
										onClick={handleRecharge}
										disabled={isProcessing}
										className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
									>
										{isProcessing ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2 inline-block"></div>
												{t('common.processing')}
											</>
										) : (
											<>
												<Zap className="h-4 w-4 mr-2 inline-block" />
												{t('mobile.recharge')} ₹{selectedPlan.price}
											</>
										)}
									</button>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Recharge History */}
					<div className="bg-dark-500 rounded-xl p-6 border border-gray-700">
						<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
							<Clock className="h-5 w-5 text-orange-400" />
							{t('mobile.recentRecharges')}
						</h3>

						{isLoadingHistory ? (
							<div className="text-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
							</div>
						) : rechargeHistory.length === 0 ? (
							<div className="text-center py-8 text-gray-400">
								<Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p className="text-sm">{t('mobile.noRechargeHistory')}</p>
							</div>
						) : (
							<div className="space-y-3 max-h-[500px] overflow-scroll hide-scrollbar">
								{rechargeHistory.map((item, index) => (
									<div
										key={index}
										className="p-3 bg-dark-400 rounded-lg hover:bg-dark-300 transition-colors cursor-pointer"
										onClick={() => handleHistoryItemClick(item)}
									>
										<div className="flex items-center gap-3">
																				{item.whatsub_bbps_operator.image ? (
																					<Image
																						src={item.whatsub_bbps_operator.image}
																						alt={item.whatsub_bbps_operator.name || ''}
																						width={32}
																						height={32}
																						className="w-8 h-8 rounded"
																					/> 
																				) : null}
											<div className="flex-1">
												<div className="font-medium">{item.canumber}</div>
												<div className="text-sm text-gray-400">
													{item.whatsub_bbps_circle.name}
												</div>
											</div>
											<div className="text-right">
												<div className="font-bold text-green-400">₹{item.amount}</div>
												<div className="text-xs text-gray-400">
													{new Date(item.created_at).toLocaleDateString()}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Info Card */}
					<div className="bg-dark-500 rounded-xl p-6 border border-gray-700">
						<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
							<Info className="h-5 w-5 text-blue-400" />
							Recharge Benefits
						</h3>
						<div className="space-y-3 text-sm text-gray-300">
							<div className="flex items-center gap-2">
								<Star className="h-4 w-4 text-yellow-400" />
								<span>Instant recharge confirmation</span>
							</div>
							<div className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-green-400" />
								<span>24/7 service availability</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4 text-blue-400" />
								<span>Secure payment gateway</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Payment Modal */}
			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={selectedPlan?.price || 0}
				onSuccess={handlePaymentSuccess}
				onError={(error) => setError(error)}
				title="Complete Mobile Recharge"
				description={`Recharge ${phoneNumber} with ₹${selectedPlan?.price} plan`}
			/>

			{/* Error Display */}
			{error && (
				<div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-sm">
					<div className="flex items-center gap-2 text-red-400">
						<AlertCircle className="h-5 w-5" />
						<span className="text-sm">{error}</span>
					</div>
				</div>
			)}
		</div>
	);
};


const ProtectedMobileRechargePage = () => {
	return (
		<ProtectedRoute>
			<MobileRechargePage />
		</ProtectedRoute>
	)
}

export default ProtectedMobileRechargePage;