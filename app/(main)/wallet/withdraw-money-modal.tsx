'use client';

import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'react-hot-toast';

interface BankDetails {
	id: string;
	account_name: string;
	bank_account_number: string;
	bank_name: string;
	ifsc: string;
	upi_id: string;
	user_id: string;
}

interface WithdrawMoneyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	onError?: (error: string) => void;
}

const WithdrawMoneyModal: React.FC<WithdrawMoneyModalProps> = ({
	isOpen,
	onClose,
	onSuccess
}) => {
	const { user } = useAuthStore();
	const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
	const [amount, setAmount] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const [originalBankDetails, setOriginalBankDetails] = useState<BankDetails>({
		id: '',
		account_name: '',
		bank_account_number: '',
		bank_name: '',
		ifsc: '',
		upi_id: '',
		user_id: ''
	});
	const [isVerifying, setIsVerifying] = useState(false);
	const router = useRouter();

	const transactionChargesPrices = user?.transactionChargesPrices / 100;
	const transactionChargesPercentage = user?.transactionChargesPercentage / 1000;
	const MIN_AMOUNT = 50;

	useEffect(() => {
		if (isOpen && user?.id && user?.auth_token) {
			fetchBankDetails();
			// Reset errors when modal opens
		}
	}, [isOpen, user?.id, user?.auth_token]);

	const fetchBankDetails = async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoading(true);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query getBankDetails($user_id: uuid!) {
              __typename
              whatsub_bank_account_details(where: { user_id: { _eq: $user_id } }) {
                __typename
                id
                account_name
                bank_account_number
                bank_name
                ifsc
                upi_id
                user_id
              }
            }
          `,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				toast.error('Failed to load bank details');
				return;
			}

			const details = data.data?.whatsub_bank_account_details || [];

			// Find bank details (prioritize bank type, fallback to first available)
			const bankDetail = details?.[0];

			if (bankDetail) {
				setBankDetails(bankDetail);
				setOriginalBankDetails(bankDetail);
			} else {
				toast.error('No bank details found. Please add your bank details first.');
			}
		} catch (error) {
			toast.error('Error fetching bank details: ', error.message)
		} finally {
			setIsLoading(false);
		}
	};

	const calculateCharge = () => {
		const amountValue = parseFloat(amount);
		if (!amountValue || amountValue <= 0) return 0;
		return (amountValue * transactionChargesPercentage) / 100 + transactionChargesPrices;
	};

	const calculateNetAmount = () => {
		const amountValue = parseFloat(amount);
		const charge = calculateCharge();
		return amountValue - charge;
	};

	const hasChangedBankDetails = () => {
		if (!originalBankDetails || !bankDetails) return false;
		return (
			bankDetails.account_number !== originalBankDetails.account_number ||
			bankDetails.ifsc !== originalBankDetails.ifsc
		);
	};

	const handleBankDetailsChange = (field: keyof BankDetails, value: string) => {
		setBankDetails(prev => ({
			...prev,
			[field]: value
		}));
	};

	const verifyBankDetails = async () => {
		if (!bankDetails.bank_account_number || !bankDetails.ifsc) {
			toast.error('Please fill in all bank details');
			return;
		}

		setIsVerifying(true);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user?.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery(
                $account: String = ""
                $ifsc: String = ""
                $user_id: uuid = ""
              ) {
                __typename
                whatsubKycBankAccountVerification(
                  request: { account_number: $account, ifsc: $ifsc, user_id: $user_id }
                ) {
                  __typename
                  bank_account_details
                }
              }
          `,
					variables: {
						account: bankDetails.bank_account_number,
						ifsc: bankDetails.ifsc,
						user_id: user?.id
					}
				})
			});

			const data = await response.json();
			const verifiedBankDetails = data.data?.whatsubKycBankAccountVerification?.bank_account_details;
			if (verifiedBankDetails) {
				// Save verified bank details to database
				const saveResponse = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${user?.auth_token}`
					},
					body: JSON.stringify({
						query: `
              mutation UpsertBankDetails(
                $user_id: uuid!,
                $bank_account_number: String!,
                $ifsc: String!,
                $account_name: String!
              ) {
                insert_whatsub_bank_account_details(
                  objects: {
                    user_id: $user_id
                    bank_account_number: $bank_account_number
                    ifsc: $ifsc
                    account_name: $account_name
                  }
                  on_conflict: {
                    constraint: whatsub_bank_account_details_user_id_key
                    update_columns: [bank_account_number, ifsc, account_name]
                  }
                ) {
                  affected_rows
                  returning {
                    id
                    user_id
                    account_name
                    bank_account_number
                    ifsc
                  }
                }
              }
            `,
						variables: {
							user_id: user?.id,
							bank_account_number: bankDetails.bank_account_number,
							ifsc: bankDetails.ifsc,
							account_name: verifiedBankDetails.nameAtBank
						}
					})
				});

				const saveData = await saveResponse.json();

				if (saveData.errors) {
					toast.error('Bank details verified but failed to save. Please try again.');
					return;
				}

				if (saveData.data?.insert_whatsub_bank_account_details?.affected_rows > 0) {
					// Update local state with saved data
					const savedDetails = saveData.data.insert_whatsub_bank_account_details.returning[0];

					setOriginalBankDetails({
						id: savedDetails.id,
						account_name: savedDetails.account_name,
						bank_account_number: savedDetails.bank_account_number,
						bank_name: '',
						ifsc: savedDetails.ifsc,
						upi_id: '',
						user_id: savedDetails.user_id
					});

					setBankDetails({
						id: savedDetails.id,
						account_name: savedDetails.account_name,
						bank_account_number: savedDetails.bank_account_number,
						bank_name: '',
						ifsc: savedDetails.ifsc,
						upi_id: '',
						user_id: savedDetails.user_id
					});

					toast.success('Bank details verified and saved successfully');
				} else {
					toast.error('Bank details verified but failed to save. Please try again.');
				}
			} else if (data.errors) {
				toast.error(data?.errors?.[0].message || 'Bank details verification failed');
			}
		} catch (error) {
			toast.error('Verification failed. Please try again.');
		} finally {
			setIsVerifying(false);
		}
	};

	const isAmountValid = () => {
		const amountValue = parseFloat(amount);
		return amountValue >= MIN_AMOUNT;
	};

	const handleWithdraw = async () => {
		if (!isAmountValid() || !user?.auth_token) return;

		// Check if bank details are complete before proceeding
		if (!bankDetails || !bankDetails.account_name || !bankDetails.bank_account_number || !bankDetails.ifsc) {
			toast.error('Please verify your bank details first to withdraw money.');
			return;
		}

		setIsWithdrawing(true);

		const amountInPaise = -Math.round(parseFloat(amount * 100));

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($amount: numeric = "", $user_id: uuid = "") {
              __typename
              whatsubWithdrawAmount(request: {amount: $amount, user_id: $user_id}) {
                __typename
                affected_rows
              }
            }
          `,
					variables: {
						amount: amountInPaise,
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				const errorMessage = data.errors[0]?.message || 'Withdrawal failed. Please try again.';
				toast.error(errorMessage);
				return;
			}

			if (data.data?.whatsubWithdrawAmount?.affected_rows > 0) {
				// Successfully processed withdrawal
				onSuccess?.();
				onClose?.();
				setAmount('');
				router.refresh();
			} else {
				const errorMessage = 'Withdrawal failed. Please try again.';
				toast.error(errorMessage);
			}
		} catch (error) {
			console.error('Error processing withdrawal:', error);
			const errorMessage = 'Network error. Please try again.';
			toast.error(errorMessage);
		} finally {
			setIsWithdrawing(false);
		}
	};

	const handleClose = () => {
		if (isWithdrawing) return; // Prevent closing during withdrawal
		setAmount('');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 overflow-hidden">
			<div className="bg-dark-500 rounded-xl md:rounded-2xl w-full max-w-md max-h-[90vh] border border-gray-700 shadow-2xl flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700 flex-shrink-0">
					<div className="flex items-center gap-2 md:gap-3">
						<div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
							<Wallet className="h-4 w-4 md:h-5 md:w-5 text-indigo-400" />
						</div>
						<h2 className="text-base md:text-xl font-bold">Withdraw Money</h2>
					</div>
					<button
						onClick={handleClose}
						disabled={isWithdrawing}
						className="p-1.5 md:p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:cursor-not-allowed"
					>
						<X className="h-4 w-4 md:h-5 md:w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4 md:p-6">
					{isLoading ? (
						<div className="text-center py-6 md:py-8 min-h-[350px] md:min-h-[450px]">
							<div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3 md:mb-4"></div>
							<p className="text-gray-400 text-sm md:text-base">Loading bank details...</p>
						</div>
					) : (
						<div className="space-y-4 md:space-y-6">
							{/* Account Name (read-only, comes only if verified) */}
							{bankDetails?.account_name && (
								<div>
									<label className="block text-xs md:text-sm font-medium text-gray-400 mb-1.5 md:mb-2">
										Account Name
									</label>
									<input
										type="text"
										value={bankDetails.account_name}
										readOnly
										className="input w-full bg-dark-400 text-gray-300 cursor-not-allowed text-sm md:text-base"
									/>
								</div>
							)}

							{/* Account Number */}
							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-400 mb-1.5 md:mb-2">
									Account Number
								</label>
								<input
									type="text"
									value={bankDetails?.bank_account_number || ''}
									onChange={(e) => handleBankDetailsChange('bank_account_number', e.target.value)}
									className="input w-full text-sm md:text-base"
									placeholder="Enter account number"
								/>
							</div>

							{/* IFSC Code */}
							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-400 mb-1.5 md:mb-2">
									IFSC Code
								</label>
								<input
									type="text"
									value={bankDetails?.ifsc || ''}
									onChange={(e) => handleBankDetailsChange('ifsc', e.target.value)}
									className="input w-full text-sm md:text-base"
									placeholder="Enter IFSC code"
								/>
							</div>

							{/* Verify Bank Details Button */}
							<div>
								<button
									onClick={verifyBankDetails}
									disabled={isVerifying || !hasChangedBankDetails()}
									className="w-full py-2.5 md:py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm md:text-base"
								>
									{isVerifying ? (
										<>
											<div className="animate-spin rounded-full h-3.5 w-3.5 md:h-4 md:w-4 border-t-2 border-b-2 border-white mr-2 inline-block"></div>
											Verifying...
										</>
									) : (
										'Verify'
									)}
								</button>
							</div>

							{/* Enter Amount */}
							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-400 mb-1.5 md:mb-2">
									Enter Amount
								</label>
								<div className="relative">
									<input
										type="number"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										placeholder="Enter Amount"
										className="input w-full pl-7 md:pl-8 text-sm md:text-base"
										min={MIN_AMOUNT}
										step={1}
									/>
									<span className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm md:text-base">₹</span>
								</div>
								<p className="text-[10px] md:text-xs text-gray-500 mt-1">
									Withdraw amount should be more than ₹{MIN_AMOUNT}
								</p>

								{/* Amount validation */}
								{amount && (
									<div className="mt-1.5 md:mt-2">
										{parseFloat(amount) < MIN_AMOUNT && (
											<p className="text-[10px] md:text-xs text-red-400">
												Minimum amount is ₹{MIN_AMOUNT}
											</p>
										)}
									</div>
								)}

								{/* Charge Display */}
								{amount && isAmountValid() && (
									<div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
										<div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
											<div className="flex justify-between">
												<span className="text-gray-400">Withdraw Amount:</span>
												<span className="text-white">₹{parseFloat(amount).toFixed(2)}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-400">Charge ({transactionChargesPercentage}% + ₹{transactionChargesPrices}) :</span>
												<span className="text-orange-400">-₹{calculateCharge().toFixed(2)}</span>
											</div>
											<div className="border-t border-orange-500/20 pt-1.5 md:pt-2 flex justify-between font-medium">
												<span className="text-white">Net Amount:</span>
												<span className="text-green-400">₹{calculateNetAmount().toFixed(2)}</span>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Withdraw Button */}
							<button
								onClick={handleWithdraw}
								disabled={!isAmountValid() || isWithdrawing || !amount}
								className={`w-full py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-colors flex items-center justify-center gap-2 ${isAmountValid() && amount && !isWithdrawing
										? 'bg-indigo-500 hover:bg-indigo-600 text-white'
										: 'bg-gray-600 text-gray-400 cursor-not-allowed'
									}`}
							>
								{isWithdrawing ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-t-2 border-b-2 border-white"></div>
										Processing...
									</>
								) : (
									<>
										<Wallet className="h-4 w-4 md:h-5 md:w-5" />
										Withdraw
									</>
								)}
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);


};

export default WithdrawMoneyModal;