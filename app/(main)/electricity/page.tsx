'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Zap, Clock, ChevronDown, Star, Info, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import QRPaymentModal from '@/components/qr-payment-modal';
import { useLanguageStore } from '@/lib/store/language-store';
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

interface RechargeHistory {
	canumber: string;
	operator: string;
	amount: number;
	created_at: string;
	plan_id: string;
	whatsub_bbps_circle: {
		id: string;
		name: string;
	} | null;
	whatsub_bbps_plan: {
		validity: string;
		dataBenefit: string;
		talktime: number;
		active: boolean;
	} | null;
	whatsub_bbps_operator: {
		id: string;
		name: string;
		image: string;
		input_length: number;
		is_flexipay: boolean;
	};
}

const ElectricityBillPage = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const router = useRouter();

	// Form state
	const [consumerNumber, setConsumerNumber] = useState('');
	const [selectedOperator, setSelectedOperator] = useState<string>('');
	const [customAmount, setCustomAmount] = useState('');

	// Data state
	const [operators, setOperators] = useState<Operator[]>([]);
	const [rechargeHistory, setRechargeHistory] = useState<RechargeHistory[]>([]);
	const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);

	// UI state
	const [isLoadingOperators, setIsLoadingOperators] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchOperators();
			fetchRechargeHistory();
		}
	}, [user?.id, user?.auth_token]);

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
						service: "ELECTRICITY"
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
						service: "ELECTRICITY"
					}
				})
			});

			const data = await response.json();
			setRechargeHistory(data.data?.whatsub_bbps || []);
		} catch (error) {
			console.error('Error fetching recharge history:', error);
		} finally {
			setIsLoadingHistory(false);
		}
	};

	const handlePayment = async () => {
		const amount = parseFloat(customAmount);

		if (!consumerNumber || !selectedOperator || !customAmount) {
			setError(t('error.fillAllFields'));
			return;
		}

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
						operator: getSelectedOperatorData()?.code,
						canumber: consumerNumber,
						amount: amount.toString(), // Convert to paise
						plan_id: null,
						operator_id: selectedOperator,
						circle_id: null,
						service: "ELECTRICITY"
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
		// Refresh recharge history
		fetchRechargeHistory();
		setCustomAmount('');
		setConsumerNumber('');
		setSelectedOperator('');
		setError(null);
	};

	const handleHistoryItemClick = (item: RechargeHistory) => {
		setConsumerNumber(item.canumber);
		setSelectedOperator(item.whatsub_bbps_operator.id);
	};

	const getSelectedOperatorData = () => {
		return operators.find(op => op.id === selectedOperator);
	};

	const isFormValid = () => {
		const amount = parseFloat(customAmount);
		return consumerNumber.length >= 6 && selectedOperator && amount > 0;
	};

	return (
		<div className="page-container pt-24">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<button type="button" onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
					<ArrowLeft className="h-6 w-6" />
				</button>
				<div className="flex-1">
					<h1 className="text-3xl font-bold flex items-center gap-3">
						<Zap className="h-8 w-8 text-yellow-400" />
						Electricity
					</h1>
				</div>
			</div>

			<div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Main Form */}
				<div className="lg:col-span-2 space-y-6">
					{/* Electricity Bill Payment Form */}
					<div className="bg-dark-500 rounded-xl p-6 border border-gray-700">
						<h2 className="text-xl font-bold mb-6">Pay Electricity Bill</h2>

						<div className="space-y-4">
							{/* Consumer Number */}
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-2">
									Consumer Number
								</label>
								<div className="relative">
									<input
										type="text"
										value={consumerNumber}
										onChange={(e) => setConsumerNumber(e.target.value)}
										placeholder='123456789012'
										className="input pl-12 w-full"
									/>
									<Lightbulb className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
								</div>
							</div>

							{/* Operator Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-2">
									Select Board
								</label>
								<div className="relative">
									<select
										value={selectedOperator}
										onChange={(e) => setSelectedOperator(e.target.value)}
										className="input w-full appearance-none pr-10"
										disabled={isLoadingOperators}
									>
										<option value="">Choose Board</option>
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
															{getSelectedOperatorData()?.discount_percentage > 0 && (
																<span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
																	{getSelectedOperatorData()?.discount_percentage}% {t('common.off')}
																</span>
															)}
														</div>
													)}
							</div>

							{/* Amount Input */}
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-2">
									Enter Amount
								</label>
								<div className="relative">
									<input
										type="number"
										value={customAmount}
										onChange={(e) => setCustomAmount(e.target.value)}
										placeholder='1000'
										className="input pl-8 w-full"
									/>
									<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
								</div>
							</div>

							{/* Popular Amounts */}
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-2">
									Quick Select
								</label>
								<div className="grid grid-cols-3 gap-2">
									{[500, 1000, 2000].map((amount) => (
										<button
											key={amount}
											onClick={() => setCustomAmount(amount.toString())}
											className="p-3 bg-dark-400 hover:bg-dark-300 rounded-lg text-sm font-medium transition-colors"
										>
											₹{amount}
										</button>
									))}
								</div>
							</div>

							{/* Pay Bill Button */}
							<button
								onClick={handlePayment}
								disabled={!isFormValid() || isProcessing}
								className={`w-full py-3 rounded-lg font-medium transition-colors ${isFormValid() && !isProcessing
										? 'bg-yellow-500 hover:bg-yellow-600 text-black'
										: 'bg-gray-600 text-gray-400 cursor-not-allowed'
									}`}
							>
								{isProcessing ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black mr-2 inline-block"></div>
										{t('common.processing')}
									</>
								) : (
									<>
										<Zap className="h-4 w-4 mr-2 inline-block" />
										Pay Bill {customAmount && `₹${customAmount}`}
									</>
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Payment History */}
					<div className="bg-dark-500 rounded-xl p-6 border border-gray-700">
						<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
							<Clock className="h-5 w-5 text-orange-400" />
							Recent Payments
						</h3>

						{isLoadingHistory ? (
							<div className="text-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
							</div>
						) : rechargeHistory.length === 0 ? (
							<div className="text-center py-8 text-gray-400">
								<Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p className="text-sm">No History</p>
							</div>
						) : (
							<div className="space-y-3">
								{rechargeHistory.slice(0, 5).map((item, index) => (
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
													{item.whatsub_bbps_operator.name}
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
							Benefits
						</h3>
						<div className="space-y-3 text-sm text-gray-300">
							<div className="flex items-center gap-2">
								<Star className="h-4 w-4 text-yellow-400" />
								<span>Confirmation</span>
							</div>
							<div className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-green-400" />
								<span>Availability</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4 text-blue-400" />
								<span>Secure Payment</span>
							</div>
							<div className="flex items-center gap-2">
								<Lightbulb className="h-4 w-4 text-purple-400" />
								<span>All Boards</span>
							</div>
						</div>
					</div>

					{/* Electricity Bill Info */}
					{/*
          <div className="bg-dark-500 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">{t('electricity.aboutBills')}</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>{t('electricity.aboutBillsText')}</p>
              <p className="text-xs text-gray-400 mt-3">
                • {t('electricity.feature1')}<br/>
                • {t('electricity.feature2')}<br/>
                • {t('electricity.feature3')}<br/>
                • {t('electricity.feature4')}
              </p>
            </div>
          </div>
          */}
				</div>
			</div>

			{/* Payment Modal */}
			<QRPaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				amount={pendingPaymentAmount}
				onSuccess={handlePaymentSuccess}
				onError={(error) => setError(error)}
				title={t('electricity.completePayment')}
				description={`${t('electricity.payBillFor')} ${consumerNumber} ${t('common.with')} ₹${pendingPaymentAmount}`}
			/>

			{/* Error Display */}
			{error && (
				<div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-sm z-50">
					<div className="flex items-center gap-2 text-red-400">
						<AlertCircle className="h-5 w-5" />
						<span className="text-sm">{error}</span>
					</div>
				</div>
			)}
		</div>
	);
};


const ProtectedElectricityBillPage = () => {
	return (
		<ProtectedRoute>
			<ElectricityBillPage />
		</ProtectedRoute>
	);
}

export default ProtectedElectricityBillPage;